import type { Product } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:5000";

export async function getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/api/products`, { cache: "no-store" });
    if (!res.ok) throw new Error('Failed to load products: ${res.status}');
    return res.json();
}

export async function getProduct(id : string): Promise<Product | null> {
    const res = await fetch(`${API_URL}/api/products/${id}`, { cache: "no-store"});
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load product ${id}: ${res.status}`);
    return res.json();
}

export function formatPrice(price: number) {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(price);
}