{/* Used Claude to help write this file */}

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const VaultContext = createContext(null);

const STORAGE_KEY = 'tcg_vault_items';

export function VaultProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addToVault = useCallback((card) => {
    setItems(prev => {
      // If same card+condition already in vault, increment quantity
      const existing = prev.find(
        i => i.apiId === card.apiId && i.gameId === card.gameId && i.condition === card.condition
      );
      if (existing) {
        return prev.map(i =>
          i.id === existing.id ? { ...i, quantity: i.quantity + card.quantity } : i
        );
      }
      return [...prev, { ...card, id: `${card.gameId}-${card.apiId}-${card.condition}-${Date.now()}` }];
    });
  }, []);

  const removeFromVault = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id, delta) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  }, []);

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <VaultContext.Provider value={{ items, addToVault, removeFromVault, updateQuantity, totalCount }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}
