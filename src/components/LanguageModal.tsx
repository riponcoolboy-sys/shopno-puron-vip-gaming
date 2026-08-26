import React from 'react';
import { X, Globe, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: 'bn' | 'en';
  onSelectLanguage: (lang: 'bn' | 'en') => void;
}

export default function LanguageModal({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}: LanguageModalProps) {
  if (!isOpen) return null;

  const languages = [
    { code: 'bn' as const, name: 'বাংলা (Bengali)', flag: '🇧🇩', native: 'বাংলা' },
    { code: 'en' as const, name: 'English (US/UK)', flag: '🇬🇧', native: 'English' },
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

      <div className="relative w-full max-w-sm bg-[#0B0E14] border border-[#FFC700]/30 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-[#101522] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center">
              <Globe size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">ভাষা নির্বাচন করুন</h3>
              <p className="text-[10px] text-gray-400">Select Interface Language</p>
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

        {/* Options */}
        <div className="p-4 space-y-2">
          {languages.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  sounds.playClick();
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                  isSelected
                    ? 'bg-[#151C2C] border-[#FFC700] text-white shadow-md'
                    : 'bg-[#10141F] border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className="text-xs font-bold">{lang.name}</p>
                    <p className="text-[10px] text-gray-400">{lang.native}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#FFC700] text-black flex items-center justify-center">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
