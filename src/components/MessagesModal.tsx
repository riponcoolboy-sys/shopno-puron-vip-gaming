import React from 'react';
import { X, Bell, Gift, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
  onOpenVip: () => void;
}

export default function MessagesModal({
  isOpen,
  onClose,
  onOpenDeposit,
  onOpenVip,
}: MessagesModalProps) {
  if (!isOpen) return null;

  const messages = [
    {
      id: 'msg-1',
      title: '🎉 ১০০% ওয়েলকাম বোনাস অফার!',
      description: 'আপনার প্রথম ডিপোজিটে ১০০% পর্যন্ত অতিরিক্ত ক্যাশ বোনাস লুফে নিন। অফারটি সীমিত সময়ের জন্য প্রযোজ্য।',
      time: '১০ মিনিট আগে',
      isNew: true,
      actionLabel: 'ডিপোজিট করুন',
      action: () => {
        onClose();
        onOpenDeposit();
      },
    },
    {
      id: 'msg-2',
      title: '👑 দৈনিক ভিআইপি ক্যাশ রিওয়ার্ড আনলকড',
      description: 'আপনার আজকের ভিআইপি ডেইলি রিওয়ার্ড জমা হয়েছে। রিওয়ার্ডস সেকশনে গিয়ে এখনই ক্লেইম করুন।',
      time: '১ ঘণ্টা আগে',
      isNew: true,
      actionLabel: 'ক্লেইম করুন',
      action: () => {
        onClose();
        onOpenVip();
      },
    },
    {
      id: 'msg-3',
      title: '🛡️ সিকিউর পেমেন্ট গেটওয়ে আপডেট',
      description: 'বিকাশ ও নগদ দিয়ে মাত্র ১ থেকে ৫ মিনিটে তাৎক্ষণিক অটোমেটিক ডিপোজিট ও উইথড্র সুবিধা চালু হয়েছে।',
      time: 'গতকাল',
      isNew: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        onClick={() => {
          sounds.playClick();
          onClose();
        }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
      />

      <div className="relative w-full max-w-md bg-[#0B0E14] border border-[#FFC700]/30 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-[#101522] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">ইনবক্স ও নোটিফিকেশন</h3>
              <p className="text-[10px] text-gray-400">সর্বশেষ অফার ও অ্যাকাউন্টের খবর</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages List */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-3 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3.5 rounded-xl border transition ${
                msg.isNew
                  ? 'bg-[#151C2C] border-[#FFC700]/40 shadow-sm'
                  : 'bg-[#10141F] border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  {msg.title}
                </h4>
                {msg.isNew && (
                  <span className="text-[9px] font-black bg-[#FFC700] text-black px-1.5 py-0.2 rounded uppercase">
                    NEW
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-300 mt-1.5 leading-relaxed">
                {msg.description}
              </p>
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-gray-800/60">
                <span className="text-[10px] text-gray-500">{msg.time}</span>
                {msg.action && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      msg.action();
                    }}
                    className="text-[11px] font-black text-[#FFC700] hover:underline"
                  >
                    {msg.actionLabel} ➔
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
