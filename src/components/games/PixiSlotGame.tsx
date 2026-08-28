// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';

export default function PixiSlotGame(props: any) {
  // 💥 Exact LocalStorage Key Sync with shopno_puron_wallet (1500 Tk Sync)
  const [currentBalance, setCurrentBalance] = useState<number>(() => {
    try {
      const walletObjStr = localStorage.getItem('shopno_puron_wallet');
      if (walletObjStr) {
        const parsed = JSON.parse(walletObjStr);
        if (typeof parsed.balance === 'number') {
          return parsed.balance;
        }
      }
    } catch (e) {}

    if (typeof props.balance === 'number' && props.balance > 0) return props.balance;
    if (typeof props.wallet === 'number' && props.wallet > 0) return props.wallet;

    return 500;
  });

  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [activeMultiplier, setActiveMultiplier] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const reelsRef = useRef<any[]>([]);

  // LocalStorage Event Listener for Real-time Wallet Updates
  useEffect(() => {
    const syncWallet = () => {
      try {
        const walletObjStr = localStorage.getItem('shopno_puron_wallet');
        if (walletObjStr) {
          const parsed = JSON.parse(walletObjStr);
          if (typeof parsed.balance === 'number') {
            setCurrentBalance(parsed.balance);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('storage', syncWallet);
    return () => window.removeEventListener('storage', syncWallet);
  }, []);

  // 🔥 Sync balance update directly to shopno_puron_wallet
  const updateWallet = (delta: number) => {
    setCurrentBalance((prev) => {
      const nextBal = Math.max(0, prev + delta);

      try {
        const walletObjStr = localStorage.getItem('shopno_puron_wallet');
        let walletObj = walletObjStr ? JSON.parse(walletObjStr) : {};
        walletObj.balance = nextBal;
        localStorage.setItem('shopno_puron_wallet', JSON.stringify(walletObj));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}

      if (typeof props.onUpdateBalance === 'function') props.onUpdateBalance(delta);
      if (typeof props.updateBalance === 'function') props.updateBalance(delta);
      return nextBal;
    });
  };

  const SYMBOLS = [
    { name: 'wild', image: '/images/wild.png', value: 10 },
    { name: 'ring', image: 'https://img.icons8.com/emoji/96/000000/ring-emoji.png', value: 5 },
    { name: 'ruby', image: 'https://img.icons8.com/emoji/96/000000/gem-stone-emoji.png', value: 4 },
    { name: 'emerald', image: 'https://img.icons8.com/emoji/96/000000/emerald-emoji.png', value: 3 },
    { name: 'sapphire', image: 'https://img.icons8.com/emoji/96/000000/diamond-with-a-dot-emoji.png', value: 2 },
    { name: 'crown', image: 'https://img.icons8.com/emoji/96/000000/crown-emoji.png', value: 8 },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadPixi = () => {
      if (window.PIXI) {
        if (isMounted) initGame();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.2.4/pixi.min.js';
      script.async = true;
      script.onload = () => {
        if (isMounted) initGame();
      };
      document.body.appendChild(script);
    };

    loadPixi();

    return () => {
      isMounted = false;
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        } catch (e) {}
      }
    };
  }, []);

  const initGame = () => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const app = new window.PIXI.Application({
      width: 320,
      height: 320,
      backgroundColor: 0x070609,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    containerRef.current.appendChild(app.view);
    appRef.current = app;

    const reelContainer = new window.PIXI.Container();
    reelContainer.x = 10;
    reelContainer.y = 10;
    app.stage.addChild(reelContainer);

    const REEL_WIDTH = 100;
    const SYMBOL_SIZE = 100;

    reelsRef.current = [];

    for (let i = 0; i < 3; i++) {
      const rc = new window.PIXI.Container();
      rc.x = i * REEL_WIDTH;
      reelContainer.addChild(rc);

      const reel = {
        container: rc,
        symbols: [],
        position: 0,
        previousPosition: 0,
      };

      for (let j = 0; j < 4; j++) {
        const symData = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const texture = window.PIXI.Texture.from(symData.image);
        const sprite = new window.PIXI.Sprite(texture);
        sprite.width = SYMBOL_SIZE - 20;
        sprite.height = SYMBOL_SIZE - 20;
        sprite.x = 10;
        sprite.y = j * SYMBOL_SIZE + 10;
        sprite.symData = symData;

        rc.addChild(sprite);
        reel.symbols.push(sprite);
      }
      reelsRef.current.push(reel);
    }
  };

  const handleSpin = () => {
    if (isSpinning || currentBalance < bet) return;

    updateWallet(-bet);
    setIsSpinning(true);
    setWinAmount(0);

    let completedReels = 0;

    reelsRef.current.forEach((reel, i) => {
      const targetPos = reel.position + 25 + Math.floor(Math.random() * 10);
      const time = 1200 + i * 400;

      const startTime = Date.now();
      const startPos = reel.position;

      const animate = () => {
        const now = Date.now();
        const progress = Math.min(1, (now - startTime) / time);

        reel.position = startPos + (targetPos - startPos) * easeOutBack(progress);

        reel.symbols.forEach((sprite, j) => {
          const y = ((reel.position + j) % 4) * 100;
          sprite.y = y + 10;
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          completedReels++;
          if (completedReels === 3) {
            checkWin();
            setIsSpinning(false);
          }
        }
      };
      animate();
    });
  };

  const easeOutBack = (x: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };

  const checkWin = () => {
    const isWin = Math.random() > 0.5;
    if (isWin) {
      const win = bet * activeMultiplier * 2;
      setWinAmount(win);
      updateWallet(win);
    }
  };

  useEffect(() => {
    let autoInterval: any;
    if (isAutoSpin && !isSpinning && currentBalance >= bet) {
      autoInterval = setTimeout(() => {
        handleSpin();
      }, 500);
    }
    return () => clearTimeout(autoInterval);
  }, [isAutoSpin, isSpinning, currentBalance, bet]);

  return (
    <div className="relative w-full max-w-md mx-auto bg-[#0a080d] border-2 border-[#ff9900] rounded-2xl p-4 text-white shadow-2xl font-sans">
      {/* Top Header / Balance Display */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={props.onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 shadow-lg"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2 bg-[#120e17] px-4 py-1.5 rounded-xl border border-[#ff9900]/60 shadow-inner">
          <span className="text-[#ff9900] font-black text-xs tracking-wider">WALLET</span>
          <span className="text-lg font-black text-amber-300">৳{currentBalance}</span>
        </div>
      </div>

      {/* Game Title Bar */}
      <div className="text-center my-2 bg-gradient-to-r from-[#211403] via-[#472d07] to-[#211403] py-1.5 rounded-lg border border-[#ff9900]/40">
        <h2 className="text-xs font-black tracking-widest text-[#ffaa00] uppercase drop-shadow-md">
          FORTUNE GARUDA 500
        </h2>
      </div>

      {/* Main Pixi Canvas Frame + Multipliers Sidebar */}
      <div className="relative bg-[#040305] border-2 border-[#ff9900]/40 rounded-xl p-2 my-3 flex items-center justify-between gap-2 overflow-hidden min-h-[330px]">
        {/* Canvas Display */}
        <div className="flex-1 flex justify-center items-center">
          <div ref={containerRef} className="rounded-lg overflow-hidden shadow-2xl" />
        </div>

        {/* Right Multipliers Panel */}
        <div className="flex flex-col justify-between h-[300px] py-1 z-10">
          {[1, 2, 3, 5, 10].map((m) => (
            <button
              key={m}
              onClick={() => setActiveMultiplier(m)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition ${
                activeMultiplier === m
                  ? 'bg-gradient-to-r from-[#ff9900] to-yellow-400 text-black shadow-lg shadow-orange-500/50 scale-105 border border-white'
                  : 'bg-black/80 text-amber-500 border border-amber-500/30 hover:border-amber-400'
              }`}
            >
              {m}x
            </button>
          ))}
        </div>
      </div>

      {/* Win Banner */}
      <div className="bg-[#120e17] border border-[#ff9900]/30 rounded-xl p-2.5 mb-3 flex justify-between items-center px-4 shadow-inner">
        <span className="text-xs font-black text-amber-400 tracking-wider">WIN</span>
        <span className="text-xl font-black text-green-400">৳{winAmount.toFixed(2)}</span>
      </div>

      {/* Spin and Controls Footer */}
      <div className="space-y-2">
        <div className="flex justify-between items-center bg-[#120e17] p-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-amber-500/20">
            <button
              onClick={() => setBet(Math.max(10, bet - 10))}
              disabled={isSpinning}
              className="w-8 h-8 bg-[#ff9900] text-black font-black rounded-lg hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-base"
            >
              -
            </button>
            <div className="text-center px-3">
              <span className="text-[10px] text-gray-400 block -mb-1">BET</span>
              <span className="font-black text-base text-amber-300">৳{bet}</span>
            </div>
            <button
              onClick={() => setBet(bet + 10)}
              disabled={isSpinning}
              className="w-8 h-8 bg-[#ff9900] text-black font-black rounded-lg hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-base"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setIsAutoSpin(!isAutoSpin)}
            className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider transition border ${
              isAutoSpin
                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                : 'bg-slate-800 text-amber-400 border-amber-500/30'
            }`}
          >
            AUTO
          </button>
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning || currentBalance < bet}
          className={`w-full py-3.5 rounded-xl text-xl font-black tracking-widest uppercase transition-all shadow-xl ${
            isSpinning || currentBalance < bet
              ? 'bg-gray-700 cursor-not-allowed text-gray-400 border border-gray-600'
              : 'bg-gradient-to-r from-[#ff9900] via-[#ffd700] to-[#ff9900] text-black hover:brightness-110 active:scale-98 border-2 border-amber-200 shadow-orange-500/20'
          }`}
        >
          {isSpinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>
    </div>
  );
}