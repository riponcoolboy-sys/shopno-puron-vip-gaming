import React, { useState } from 'react';
import { X, Send, PhoneCall, MessageCircle, HelpCircle, ShieldCheck, UserCheck, Bot } from 'lucide-react';
import { SupportChatMessage } from '../types';
import { sounds } from '../utils/audio';

interface SupportModalProps {
  onClose: () => void;
}

const FAQ_TOPICS = [
  { id: 'dep', label: 'ডিপোজিট সমস্যা', answer: 'ডিপোজিট করার ১-৩ মিনিটের মধ্যে টাকা স্বয়ংক্রিয়ভাবে আপনার ব্যালেন্সে যোগ হয়। TrxID সঠিক দিয়েছেন কিনা মিলিয়ে নিন।' },
  { id: 'wth', label: 'উইথড্র কখন পাব?', answer: 'Shopno Puron ভিআইপি উইথড্র ২ থেকে ৫ মিনিটের মধ্যে বিকাশ/নগদে চলে যায়। যেকোনো সমস্যায় ট্রানজেকশন হিস্ট্রি চেক করুন।' },
  { id: 'avi', label: 'এভিয়েটর ট্রিকস', answer: 'এভিয়েটর ২.০ গেমে বিমানটি ওড়ার পূর্বে বাজি ধরুন এবং ক্র্যাশ হওয়ার আগেই ক্যাশ আউট করুন। অটো ক্যাশআউট ১.৫০x-২.০০x রাখা নিরাপদ।' },
  { id: 'vip', label: 'ভিআইপি সুবিধা কী?', answer: 'ভিআইপি মেম্বাররা পান বিশেষ ক্যাশব্যাক, দৈনিক ফ্রি লাকি হুইল স্পিন এবং পার্সোনাল অ্যাকাউন্ট ম্যানেজারের সেবা।' },
];

export default function SupportModal({ onClose }: SupportModalProps) {
  const [messages, setMessages] = useState<SupportChatMessage[]>([
    {
      id: '1',
      sender: 'support',
      text: 'আসসালামু আলাইকুম! স্বপ্ন পূরণ ভিআইপি ক্যাসিনো সাপোর্ট সেন্টারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?',
      time: '12:00 PM',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    sounds.playClick();
    const userMsg: SupportChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = 'আপনার বার্তাটি গ্রহণ করা হয়েছে। একজন ডেডিকেটেড ভিআইপি ম্যানেজার আপনার সাথে যোগাযোগ করছেন।';
      if (text.includes('ডিপোজিট') || text.includes('deposit') || text.includes('টাকা')) {
        reply = 'ডিপোজিটের জন্য বিকাশ বা নগদ নম্বর কপি করে ক্যাশআউট বা সেন্ড মানি করুন এবং সঠিক TrxID সাবমিট করুন। ব্যালেন্স নিমেষেই যোগ হবে!';
      } else if (text.includes('উইথড্র') || text.includes('withdraw')) {
        reply = 'উইথড্র রিকোয়েস্ট পাঠানোর ২-৫ মিনিটের মধ্যে আপনার একাউন্টে টাকা পৌঁছাবে।';
      } else if (text.includes('এভিয়েটর') || text.includes('aviator')) {
        reply = 'এভিয়েটর ২.০ গেমটি লবি থেকে নির্বাচন করে সরাসরি খেলুন। ১০০% ফেয়ার ও লাইভ প্রোভাইডার জেনুইন সিস্টেম!';
      }

      const botMsg: SupportChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      sounds.playClick();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#121524] border border-amber-500/40 w-full max-w-md rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-sm relative">
              🎧
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 right-0 border border-black" />
            </div>
            <div>
              <h3 className="text-base font-black text-amber-400">২৪/৭ লাইভ সাপোর্ট হেল্পডেস্ক</h3>
              <p className="text-[10px] text-emerald-400 font-mono">অনলাইন এজেন্ট একটিভ আছেন</p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Topics FAQ Pills */}
        <div className="py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-gray-800">
          {FAQ_TOPICS.map((faq) => (
            <button
              key={faq.id}
              onClick={() => handleSendMessage(faq.label)}
              className="bg-[#0a0c16] hover:bg-amber-400/10 border border-gray-800 hover:border-amber-400/50 text-gray-300 hover:text-amber-300 px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition"
            >
              {faq.label}
            </button>
          ))}
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 py-3 min-h-[220px]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-400 text-black font-semibold rounded-br-none'
                    : 'bg-[#0a0c16] border border-gray-800 text-gray-200 rounded-bl-none'
                }`}
              >
                <p>{m.text}</p>
                <span className={`text-[9px] block text-right mt-1 font-mono ${m.sender === 'user' ? 'text-black/60' : 'text-gray-500'}`}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#0a0c16] px-3 py-1.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
              <span>এজেন্ট উত্তর লিখছেন...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="pt-2 border-t border-gray-800 flex gap-2"
        >
          <input
            type="text"
            placeholder="আপনার সমস্যা বা প্রশ্ন লিখুন..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-[#0a0c16] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="bg-amber-400 hover:bg-amber-300 text-black p-2.5 rounded-xl transition flex items-center justify-center font-bold"
          >
            <Send size={15} />
          </button>
        </form>

        {/* External Social Helplines */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
          <button
            onClick={() => { sounds.playClick(); alert('হোয়াটসঅ্যাপ ভিআইপি হটলাইনে রিডাইরেক্ট করা হচ্ছে: +880 1888-776655'); }}
            className="bg-[#25D366]/20 border border-[#25D366]/50 text-[#25D366] py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-[#25D366]/30 transition"
          >
            <MessageCircle size={14} /> WhatsApp সাপোর্ট
          </button>
          <button
            onClick={() => { sounds.playClick(); alert('টেলিগ্রাম ভিআইপি গ্রুপে রিডাইরেক্ট করা হচ্ছে: @ShopnoPuronVIP'); }}
            className="bg-[#0088cc]/20 border border-[#0088cc]/50 text-[#0088cc] py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-[#0088cc]/30 transition"
          >
            <span>✈️ Telegram চ্যানেল</span>
          </button>
        </div>
      </div>
    </div>
  );
}
