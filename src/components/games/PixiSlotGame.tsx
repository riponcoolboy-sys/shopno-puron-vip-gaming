// @ts-nocheck
import React from 'react';

export default function PixiSlotGame({ balance, onUpdateBalance, onClose }) {
  return (
    <div className="bg-slate-900 border border-amber-500/40 text-white p-6 rounded-2xl text-center">
      <h2 className="text-xl font-bold text-amber-400 mb-4">PixiJS Game Loading...</h2>
      <p className="text-xs text-gray-400 mb-6">নতুন PixiJS গেমের ক্যানভাস রেডি হচ্ছে</p>
      <button 
        onClick={onClose}
        className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg"
      >
        বন্ধ করুন
      </button>
    </div>
  );
}