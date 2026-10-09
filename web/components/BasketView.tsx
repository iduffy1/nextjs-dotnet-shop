"use client";

import Link from "next/link";
import { useBasket } from "./BasketProvider";
import { formatPrice } from "@/lib/format";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "@/app/basket/actions";

export default function BasketView() {
  const { items, total, setQuantity, remove, clear } = useBasket();

    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function handleCheckout() {
        setError(null);
        startTransition(async () => {
            const result = await checkout(
                items.map((i) => ({productId : i.product.id, quantity: i.quantity}))
            );
            if (result.ok) {
                clear();
                router.push(`/orders/${result.orderId}`);
            } else {
                setError(result.error);
            }
        });
    }


  if (items.length === 0) {
    return (
      <p>
        Your basket is empty.{" "}
        <Link href="/" className="text-blue-600 hover:underline">Browse products</Link>
      </p>
    );
  }

  return (
    <div>
      <ul className="divide-y rounded-lg border">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <Link href={`/products/${product.id}`} className="font-semibold hover:underline">
                {product.name}
              </Link>
              <p className="text-sm text-gray-600">{formatPrice(product.price)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(product.id, quantity - 1)}
                className="h-8 w-8 rounded border"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(product.id, quantity + 1)}
                className="h-8 w-8 rounded border"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <p className="w-24 text-right font-semibold">{formatPrice(product.price * quantity)}</p>
            <button onClick={() => remove(product.id)} className="text-sm text-red-600 hover:underline">
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={clear} className="text-sm text-gray-600 hover:underline">
          Clear basket
        </button>
        <p className="text-xl font-bold">Total: {formatPrice(total)}</p>
      </div>
        {error && <p className="mt-4 text-red-600">{error}</p>}
        <button
            onClick={handleCheckout}
            disabled={isPending}
            className="mt-6 w-full rounded bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
            {isPending ? "Placing order…" : "Checkout"}
        </button>
    </div>
  );
}