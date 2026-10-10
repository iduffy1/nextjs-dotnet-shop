import "server-only";

import type { Product, OrderLineRequest, Order } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:5000";

export async function getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/api/products`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load products: ${res.status}`);
    return res.json();
}

export async function getProduct(id : string): Promise<Product | null> {
    const res = await fetch(`${API_URL}/api/products/${id}`, { cache: "no-store"});
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load product ${id}: ${res.status}`);
    return res.json();
}

export async function createOrder(lines: OrderLineRequest[]) : Promise<Order> {
    const res = await fetch(`${API_URL}/api/orders`, { 
        method: "POST",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify({ lines })
    });
    if (!res.ok) {
        const problem = await res.json().catch(() => null);
        const message = problem?.errors
            ? Object.values(problem.errors as Record<string, string[]>).flat().join(" ")
            : `Order failed: ${res.status}`;
        throw new Error(message);
    }
    return res.json();
}

export async function getOrder(id: string) : Promise<Order | null> {
    const res = await fetch(`${API_URL}/api/orders/${id}`, { cache: "no-store"});
    if (res.status === 404)  return null;
    if (!res.ok) throw new Error(`Failed to load order ${id}: ${res.status}`);
    return res.json();
}