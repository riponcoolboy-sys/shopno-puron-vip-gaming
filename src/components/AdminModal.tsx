import React, { useState } from 'react';

interface AdminModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  setIsAdmin?: (isAdmin: boolean) => void;
}

export default function AdminModal({ isOpen = true, onClose, onSuccess, setIsAdmin }: AdminModalProps) {
  const [showAdminModal, setShowAdminModal] = useState(isOpen);
  
  // ১. ইমেইল স্টেটটি সম্পূর্ণ ফাঁকা ("") রাখা হলো
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ইমেইল এবং পাসওয়ার্ড দুইটাই সঠিক হলে ঢুকতে দেবে
    if (adminEmail.trim() === "riponcoolboy@gmail.com" && adminPassword === "Akashvai92@#*") {
      alert("লগইন সফল হয়েছে!");
      setIsAdmin?.(true);
      localStorage.setItem('isAdmin', 'true');
      setShowAdminModal(false);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } else {
      alert("ইমেইল অথবা পাসওয়ার্ড ভুল!");
    }
  };

  const handleClose = () => {
    setShowAdminModal(false);
    if (onClose) onClose();
  };

  return (
    <>
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121522] border border-amber-500/40 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-amber-400 font-bold text-sm mb-4 text-center tracking-wider">
              🔒 SECRET ADMIN ACCESS
            </h3>
            
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">এডমিন ইমেইল / ইউজারনেম</label>
                <input
                  type="email"
                  placeholder="ইমেইল দিন..." // এখানে কোনো ইমেইল শো করবে না
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">এডমিন সিক্রেট পিন/পাসওয়ার্ড</label>
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড দিন..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="w-1/2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-lg text-xs"
                >
                  প্রবেশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
