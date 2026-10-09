"use server";

import { createOrder } from "@/lib/api";
import type { OrderLineRequest } from "@/lib/types";

export type CheckoutResult =
  | { ok: true; orderId: number }
  | { ok: false; error: string };

export async function checkout(lines: OrderLineRequest[]): Promise<CheckoutResult> {
  try {
    const order = await createOrder(lines);
    return { ok: true, orderId: order.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Checkout failed." };
  }
}