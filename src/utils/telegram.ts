// ========================================================
// Frontend Direct Telegram API Notification Dispatcher
// ========================================================

export const TELEGRAM_BOT_TOKEN = '8622556616:AAEI7JWLWuGenLALK_o8uRBAcvorUHm_XI';
export const TELEGRAM_CHAT_ID = '8622556616';
export const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

export interface TelegramDepositPayload {
  username?: string;
  amount: number | string;
  method: string;
  trxId: string;
  senderNumber?: string;
}

export interface TelegramWithdrawPayload {
  username?: string;
  amount: number | string;
  accountNumber: string;
  method?: string;
}

export function formatMethodName(method: string): string {
  if (!method) return 'Bkash';
  const m = method.toLowerCase();
  if (m.includes('bkash')) return 'Bkash';
  if (m.includes('nagad')) return 'Nagad';
  if (m.includes('rocket')) return 'Rocket';
  if (m.includes('upay')) return 'Upay';
  if (m.includes('bank')) return 'Bank';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

/**
 * Direct Telegram API Call from Frontend
 */
export async function sendDirectTelegramMessage(text: string): Promise<boolean> {
  try {
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
      }),
    });

    const data = await response.json();
    if (data && data.ok) {
      console.log('Telegram message sent successfully from frontend:', data);
      return true;
    } else {
      console.warn('Telegram API response error:', data);
      return false;
    }
  } catch (error) {
    console.error('Direct Telegram API fetch failed:', error);
    return false;
  }
}

/**
 * Direct Deposit Alert from Frontend
 */
export async function sendDirectTelegramDepositAlert(payload: TelegramDepositPayload): Promise<boolean> {
  const user = payload.username || 'Player';
  const method = formatMethodName(payload.method);
  const text = `🚨 NEW DEPOSIT REQUEST!\nUser: ${user}\nAmount: ৳${payload.amount}\nMethod: ${method}\nTrxID: ${payload.trxId}`;
  
  return sendDirectTelegramMessage(text);
}

/**
 * Direct Withdraw Alert from Frontend
 */
export async function sendDirectTelegramWithdrawAlert(payload: TelegramWithdrawPayload): Promise<boolean> {
  const user = payload.username || 'Player';
  const text = `💸 NEW WITHDRAW REQUEST!\nUser: ${user}\nAmount: ৳${payload.amount}\nNumber: ${payload.accountNumber}`;
  
  return sendDirectTelegramMessage(text);
}
