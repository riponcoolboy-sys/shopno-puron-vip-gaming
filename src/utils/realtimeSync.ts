// src/utils/realtimeSync.ts

type RealtimeEventType = 'balance_update' | 'connection_status' | 'game_event' | 'deposit_update';
type ListenerCallback = (data: any) => void;

// Backend Server URLs
const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env || {};
const BACKEND_BASE_URL = runtimeEnv.VITE_API_URL || '';
const BACKEND_WS_URL = runtimeEnv.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

class RealtimeSyncManager {
  private ws: WebSocket | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 20;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private pollingInterval: any = null;
  private listeners: Map<RealtimeEventType, Set<ListenerCallback>> = new Map();
  private currentUserId: string | null = null;
  private isPollingActive: boolean = false;
  private lastDepositSnapshot = '';
  private destroyed = false;

  constructor() {
    this.initEvents();
  }

  private isAdminSession(): boolean {
    return typeof window !== 'undefined'
      && (localStorage.getItem('user_role') === 'admin'
        || Boolean(localStorage.getItem('admin_token')));
  }

  private initEvents() {
    this.listeners.set('balance_update', new Set());
    this.listeners.set('connection_status', new Set());
    this.listeners.set('game_event', new Set());
    this.listeners.set('deposit_update', new Set());
  }

  public on(event: RealtimeEventType, callback: ListenerCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: RealtimeEventType, callback: ListenerCallback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: RealtimeEventType, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in realtime listener for ${event}:`, e);
        }
      });
    }
  }

  public connect(userId?: string) {
    this.destroyed = false;

    if (this.isAdminSession()) {
      this.pausePolling();
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.isConnecting = false;
      this.isConnected = false;
      return;
    }

    if (userId) {
      this.currentUserId = userId;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    this.emit('connection_status', { status: 'CONNECTING', isConnected: false });

    try {
      const socket = new WebSocket(BACKEND_WS_URL);
      this.ws = socket;

      socket.onopen = () => {
        if (this.destroyed || this.ws !== socket) return;
        this.isConnecting = false;
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection_status', { status: 'CONNECTED', isConnected: true, mode: 'WEBSOCKET' });

        // Authenticate socket
        const token = localStorage.getItem('token') || localStorage.getItem('user_token') || localStorage.getItem('auth_token');
        const userObjStr = localStorage.getItem('user');
        let parsedUser: any = null;
        try {
          if (userObjStr) parsedUser = JSON.parse(userObjStr);
        } catch (e) {
          // ignore
        }

        const authUserId = this.currentUserId || parsedUser?._id || parsedUser?.id || 'usr_78912';

        this.send({
          type: 'AUTH',
          userId: authUserId,
          token: token || undefined,
        });

        // Start heartbeat ping
        this.startHeartbeat();

        // WebSocket connected, reduce or pause aggressive polling
        this.pausePolling();
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      socket.onerror = (err) => {
        console.warn("WebSocket connection encountered an error. Falling back to HTTP polling...", err);
        this.handleDisconnect(socket);
      };

      socket.onclose = () => {
        this.handleDisconnect(socket);
      };
    } catch (err) {
      console.warn("WebSocket initialization failed, enabling HTTP Polling fallback.", err);
      this.handleDisconnect();
    }
  }

  private handleDisconnect(socket?: WebSocket | null) {
    if (this.destroyed || (socket && socket !== this.ws)) return;
    if (!this.isConnecting && !this.isConnected && this.isPollingActive) return;

    this.isConnecting = false;
    this.isConnected = false;
    if (this.ws === socket) this.ws = null;
    this.stopHeartbeat();
    this.emit('connection_status', { status: 'DISCONNECTED', isConnected: false, mode: 'POLLING_FALLBACK' });

    // Enable immediate HTTP Polling Fallback
    this.startPollingFallback();

    // Attempt auto-reconnect with exponential backoff
    if (!this.reconnectTimer && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(10000, 1000 * Math.pow(1.5, this.reconnectAttempts));
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING', timestamp: Date.now() });
      }
    }, 12000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private startPollingFallback() {
    if (this.isPollingActive) return;
    this.isPollingActive = true;

    // Run first sync immediately
    this.pollServerState();

    // Schedule regular polling every 2.5 seconds
    if (!this.pollingInterval) {
      this.pollingInterval = setInterval(() => {
        this.pollServerState();
      }, 2500);
    }
  }

  private pausePolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPollingActive = false;
  }

  private async pollServerState() {
    if (this.isAdminSession()) {
      this.pausePolling();
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token') || localStorage.getItem('auth_token');
      const userObjStr = localStorage.getItem('user');
      let uid = this.currentUserId;
      if (!uid && userObjStr) {
        try {
          const parsed = JSON.parse(userObjStr);
          uid = parsed?._id || parsed?.id || parsed?.username;
        } catch (e) {
          // ignore
        }
      }

      const res = await fetch(`${BACKEND_BASE_URL}/api/realtime/sync?userId=${encodeURIComponent(uid || 'usr_78912')}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.balance === 'number') {
          this.emit('balance_update', {
            balance: data.balance,
            source: 'POLLING_SYNC',
            user: data.user,
          });
        }
      }

      const depositsResponse = await fetch(`${BACKEND_BASE_URL}/api/deposits`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (depositsResponse.ok) {
        const depositsData = await depositsResponse.json();
        if (depositsData.success && Array.isArray(depositsData.deposits)) {
          const deposits = depositsData.deposits;
          const snapshot = deposits.map((deposit: any) =>
            `${deposit._id || deposit.id}:${deposit.status}:${deposit.updatedAt || deposit.createdAt}`
          ).join('|');
          if (snapshot !== this.lastDepositSnapshot) {
            this.lastDepositSnapshot = snapshot;
            this.emit('deposit_update', { deposits, source: 'POLLING_SYNC' });
          }
        }
      }
    } catch (e) {
      // Polling network glitch, will retry silently
    }
  }

  private handleServerMessage(message: any) {
    if (!message || !message.type) return;

    const eventType = String(message.type).toUpperCase();
    const eventData = message.data || message.payload || message;
    const eventBalance = eventData.balance ?? eventData.newBalance ?? eventData.currentBalance;

    switch (eventType) {
      case 'PONG':
        break;

      case 'BALANCE_SYNC':
      case 'BALANCE_UPDATE':
        if (typeof eventBalance === 'number') {
          this.emit('balance_update', {
            balance: eventBalance,
            winAmount: eventData.winAmount,
            betAmount: eventData.betAmount,
            source: 'WEBSOCKET',
            description: eventData.description,
            actionType: eventData.actionType,
          });
        }
        break;

      case 'DEPOSIT_APPROVED':
      case 'DEPOSIT_UPDATED':
      case 'DEPOSIT_STATUS_UPDATED':
        if (typeof eventBalance === 'number') {
          this.emit('balance_update', {
            balance: eventBalance,
            amount: eventData.amount,
            source: 'WEBSOCKET',
            description: 'Deposit approved',
            actionType: 'DEPOSIT_APPROVED',
          });
        }
        this.emit('deposit_update', {
          deposit: eventData.deposit || eventData,
          source: 'WEBSOCKET',
          actionType: eventData.actionType || eventType,
        });
        break;

      case 'LIVE_EVENT':
        this.emit('game_event', message.data);
        break;

      case 'DEPOSIT_CREATED':
        if (eventData.deposit) {
          this.emit('deposit_update', { deposit: eventData.deposit, source: 'WEBSOCKET' });
        }
        break;

      default:
        break;
    }
  }

  public send(payload: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        return true;
      } catch (err) {
        console.error("Failed to send WebSocket message:", err);
      }
    }
    return false;
  }

  public async syncBalanceUpdate(
    newBalance: number,
    amount: number = 0,
    type: 'BET' | 'WIN' = 'WIN',
    description: string = 'Game Result'
  ): Promise<{ success: boolean; finalBalance: number }> {
    const validatedBalance = Math.max(0, Math.round(Number(newBalance) * 100) / 100);
    if (this.isAdminSession()) {
      return { success: false, finalBalance: validatedBalance };
    }

    const token = localStorage.getItem('token') || localStorage.getItem('user_token') || localStorage.getItem('auth_token');

    // Wallet changes are settled server-side; local storage never becomes authoritative.
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/game/settle-bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: this.currentUserId,
          betAmount: type === 'BET' ? amount : 0,
          winAmount: type === 'WIN' ? amount : 0,
          gameName: description,
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          finalBalance: result.balance !== undefined ? result.balance : validatedBalance
        };
      }
    } catch (err) {
      console.warn("REST balance sync error:", err);
    }

    return { success: false, finalBalance: validatedBalance };
  }

  public destroy() {
    this.destroyed = true;
    this.stopHeartbeat();
    this.pausePolling();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();