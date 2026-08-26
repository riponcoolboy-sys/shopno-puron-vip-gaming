import React, { useState } from 'react';
import { apiUrl } from '../../utils/security';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface FortuneGemsProps {
  initialBalance?: number;
  onUpdateBalance?: (newBalance: number, amountWonOrLost: number, type: 'BET' | 'WIN', description: string) => void;
  onClose?: () => void;
}

export default function FortuneGems({ initialBalance = 5000, onUpdateBalance, onClose }: FortuneGemsProps) {
  const [reels, setReels] = useState(['RED_GEM', 'BLUE_GEM', 'GREEN_GEM']);
  const [fourthReel, setFourthReel] = useState<{ type: string; value: string | number }>({ type: 'MULTIPLIER', value: 1 });
  const [balance, setBalance] = useState(initialBalance); // টেস্ট ব্যালেন্স
  const [betAmount, setBetAmount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winMessage, setWinMessage] = useState('');


  const handleSpin = async () => {
    const currentBal = Number(balance) || 0;
    if (currentBal <= 0) {
      alert("আপনার ব্যালেন্স ৳০.০০! অনুগ্রহ করে রিচার্জ করুন।");
      return;
    }

    const finalBet = getAffordableBet(currentBal, Number(betAmount));
    if (finalBet === null) {
      alert("সঠিক বাজি নির্বাচন করুন");
      return;
    }

    setIsSpinning(true);
    setWinMessage('');

    // Deduct locally or notify
    const afterBet = Math.max(0, currentBal - finalBet);
    setBalance(afterBet);
    if (onUpdateBalance) {
      onUpdateBalance(afterBet, finalBet, 'BET', `Fortune Gems Bet: ৳${finalBet}`);
    }

    try {
      const response = await fetch(apiUrl('/api/game/fortune-gems/spin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'usr_78912', betAmount: finalBet })
      });
      
      const data = await response.json();

      if (data.success) {
        // চাকা ঘোরা এনিমেশন টাইমার (২ সেকেন্ড)
        setTimeout(() => {
          setReels(data.reels);
          setFourthReel(data.fourthReel);
          const serverBal = Number(data.currentBalance) || (currentBal - finalBet + (Number(data.winAmount) || 0));
          setBalance(serverBal);
          setIsSpinning(false);

          if (data.winAmount > 0) {
            const winNum = Number(data.winAmount);
            setWinMessage(`MEGA WIN! ৳${winNum}`);
            if (onUpdateBalance) {
              onUpdateBalance(serverBal, winNum, 'WIN', `Fortune Gems Win: ৳${winNum}`);
            }
          }
        }, 1500);
      } else {
        alert(data.message || 'পরের স্পিনে আবার চেষ্টা করুন!');
        setIsSpinning(false);
      }
    } catch (err) {
      console.error(err);
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-[480px] bg-[#0d0714] text-white flex flex-col justify-between p-4 max-w-md mx-auto relative border border-amber-500/20 rounded-xl shadow-2xl">
      {/* ১. টপ ব্যালেন্স বার */}
      <div className="flex justify-between items-center bg-[#180e28] p-3 rounded-lg border border-amber-500/30">
        <span className="text-xs text-gray-400">ব্যালেন্স: <strong className="text-amber-400 text-sm">৳{balance}</strong></span>
        <div className="flex items-center gap-2">
          <h2 className="text-amber-400 font-bold text-sm tracking-widest">FORTUNE GEMS 2</h2>
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ২. মেইন গেম স্লট বোর্ড */}
      <div className="my-auto flex justify-center items-center gap-2 py-6">
        {/* ৩x৩ স্লট রিল */}
        <div className={`flex gap-2 p-3 bg-black/60 rounded-xl border border-yellow-600/40 ${isSpinning ? 'opacity-50 animate-pulse' : ''}`}>
          {reels.map((symbol, index) => (
            <div key={index} className="w-16 h-24 bg-[#1e1333] border border-amber-500/30 rounded-lg flex flex-col justify-center items-center font-bold text-xs text-amber-300 shadow-inner">
              <span className="text-2xl mb-1">
                {symbol === 'RED_GEM' ? '💎' : symbol === 'BLUE_GEM' ? '🔷' : symbol === 'WILD' ? '👑' : symbol === 'GREEN_GEM' ? '🟢' : '🔱'}
              </span>
              <span className="text-[10px] truncate max-w-[56px] text-center">{symbol}</span>
            </div>
          ))}
        </div>

        {/* ৪র্থ বোনাস চাকা */}
        <div className="w-16 h-24 bg-gradient-to-b from-amber-600 to-yellow-800 rounded-lg flex flex-col justify-center items-center border-2 border-yellow-300 shadow-lg">
          <span className="text-xs text-black font-extrabold uppercase">Bonus</span>
          <span className="text-xl font-black text-white mt-1">
            {fourthReel.type === 'MULTIPLIER' ? `${fourthReel.value}X` : '🎡'}
          </span>
        </div>
      </div>

      {/* ৩. বটম স্পিন ও বেট কন্ট্রোল */}
      <div className="bg-[#180e28] p-3 rounded-xl border border-amber-500/30 flex flex-col gap-2">
        <div className="flex gap-1 overflow-x-auto justify-center">
          {balance > 0 && balance < 10 && (
            <button
              type="button"
              onClick={() => setBetAmount(0.5)}
              className={`px-2 py-1 rounded text-xs font-bold transition border ${
                betAmount === 0.5
                  ? 'bg-amber-500 text-black border-amber-300 font-black'
                  : 'bg-gray-800 text-amber-300 border-amber-500/30 hover:bg-gray-700'
              }`}
            >
              ৳০.৫
            </button>
          )}
          {BET_PRESETS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setBetAmount(amt)}
              className={`px-2 py-1 rounded text-xs font-bold transition border ${
                betAmount === amt
                  ? 'bg-amber-500 text-black border-amber-300 font-black'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
            >
              ৳{amt}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setBetAmount(prev => (prev <= 1 ? 0.5 : Math.max(1, prev - 5)))} 
              className="w-8 h-8 bg-gray-800 rounded-full text-lg font-bold hover:bg-gray-700 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-xs font-semibold font-mono text-amber-400">৳{betAmount}</span>
            <button 
              type="button"
              onClick={() => setBetAmount(prev => (prev < 1 ? 1 : prev + 5))} 
              className="w-8 h-8 bg-gray-800 rounded-full text-lg font-bold hover:bg-gray-700 flex items-center justify-center"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold px-6 py-2.5 rounded-full hover:brightness-110 disabled:opacity-50 shadow-lg active:scale-95 transition text-sm"
          >
            {isSpinning ? 'ঘুরছে...' : 'SPIN'}
          </button>
        </div>
      </div>

      {/* ৪. উইন মেসেজ পপআপ */}
      {winMessage && (
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center rounded-xl z-50 p-4">
          <h1 className="text-3xl font-black text-amber-400 animate-bounce text-center">{winMessage}</h1>
          <button 
            type="button"
            onClick={() => setWinMessage('')}
            className="mt-4 bg-amber-500 text-black font-bold px-6 py-2 rounded-full text-xs"
          >
            ঠিক আছে
          </button>
        </div>
      )}
    </div>
  );
}
