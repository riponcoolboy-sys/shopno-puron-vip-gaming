import React, { useState } from 'react';
import { X, Smartphone, Download, CheckCircle2, ShieldCheck, QrCode, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    sounds.playClick();
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 4000);
    }, 1500);
  };

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
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">মোবাইল অ্যাপ ডাউনলোড</h3>
              <p className="text-[10px] text-gray-400">Android APK ও iOS PWA সাপোর্ট</p>
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

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Visual Showcase */}
          <div className="bg-gradient-to-br from-[#151C2C] to-[#0D121D] border border-[#FFC700]/20 rounded-xl p-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFC700]/20 border border-[#FFC700] text-[#FFC700] flex items-center justify-center mx-auto mb-2 text-2xl shadow-[0_0_15px_rgba(255,199,0,0.3)]">
              👑
            </div>
            <h4 className="text-sm font-black text-[#FFC700]">Shopno Puron VIP App v2.4</h4>
            <p className="text-xs text-gray-300 mt-1">
              দ্রুতগতির লোডিং, লো-ডাটা মোড এবং ইনস্ট্যান্ট নোটিফিকেশন সুবিধা সহ অফিশিয়াল মোবাইল অ্যাপ।
            </p>

            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} /> 100% সুরক্ষিত
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} /> ভাইরাস মুক্ত
              </span>
              <span className="flex items-center gap-1">
                <Sparkles size={12} /> সাইজ মাত্র ১২ MB
              </span>
            </div>
          </div>

          {/* Download APK Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FFC700] to-amber-400 hover:brightness-110 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(255,199,0,0.3)] transition transform active:scale-95 disabled:opacity-70"
          >
            {downloading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                APK প্যাকেজ তৈরি হচ্ছে...
              </span>
            ) : downloadDone ? (
              <span className="flex items-center gap-1.5 text-emerald-950 font-black">
                <CheckCircle2 size={16} /> ডাউনলোড শুরু হয়েছে!
              </span>
            ) : (
              <>
                <Download size={16} className="stroke-[3]" />
                <span>Android APK ডাউনলোড করুন (v2.4)</span>
              </>
            )}
          </button>

          {/* iOS / PWA Guide */}
          <div className="bg-[#10141F] border border-gray-800 rounded-xl p-3 text-[11px] text-gray-400">
            <p className="font-bold text-gray-300 mb-1 flex items-center gap-1">
              📱 iPhone / iOS ইউজারদের জন্য:
            </p>
            <p>Safari ব্রাউজারে শেয়ার আইকনে ট্যাপ করে "Add to Home Screen" সিলেক্ট করুন।</p>
          </div>
        </div>
      </div>
    </div>
  );
}
