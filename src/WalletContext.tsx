import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface WalletContextType {
  balance: number;
  deductBalance: (amount: number) => boolean;
  addBalance: (amount: number) => void;
  setBalanceDirectly: (amount: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('user_balance');
      if (saved && !isNaN(parseFloat(saved))) return parseFloat(saved);
    } catch (e) {}
    return 5000;
  });

  useEffect(() => {
    try {
      localStorage.setItem('user_balance', balance.toString());
      const w1 = localStorage.getItem('shopno_puron_wallet');
      let wObj = w1 ? JSON.parse(w1) : {};
      wObj.balance = balance;
      localStorage.setItem('shopno_puron_wallet', JSON.stringify(wObj));
    } catch (e) {}
  }, [balance]);

  const deductBalance = (amount: number): boolean => {
    if (balance < amount) return false;
    setBalance((prev: number) => Math.max(0, prev - amount));
    return true;
  };

  const addBalance = (amount: number) => {
    setBalance((prev: number) => prev + amount);
  };

  const setBalanceDirectly = (amount: number) => {
    setBalance(Math.max(0, amount));
  };

  const value = { balance, deductBalance, addBalance, setBalanceDirectly };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}