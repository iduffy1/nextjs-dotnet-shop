"use client";

import { useBasket } from "./BasketProvider";
import type { Product } from "@/lib/types";

export default function AddToBasketButton({ product }: { product: Product }) {
  const { items, add } = useBasket();
  const quantity = items.find((i) => i.product.id === product.id)?.quantity ?? 0;

  return (
    <div className="mt-6 flex items-center gap-4">
      <button
        onClick={() => add(product)}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Add to basket
      </button>
      {quantity > 0 && <span className="text-sm text-gray-600">{quantity} in basket</span>}
    </div>
  );
}