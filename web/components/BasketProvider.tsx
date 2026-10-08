"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Product } from "@/lib/types";

export type BasketItem = { product: Product; quantity: number };

type BasketContextValue = {
  items: BasketItem[];
  count: number;
  total: number;
  add: (product: Product) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);

  function add(product: Product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function setQuantity(productId: number, quantity: number) {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.product.id !== productId)
        : prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }

  function remove(productId: number) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function clear() {
    setItems([]);
  }

  // Derived values: computed on each render, not stored in state
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.quantity * i.product.price, 0);

  return (
    <BasketContext value={{ items, count, total, add, setQuantity, remove, clear }}>
      {children}
    </BasketContext>
  );
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used inside <BasketProvider>");
  return ctx;
}