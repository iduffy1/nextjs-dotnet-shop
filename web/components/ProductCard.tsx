import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/api";

type Props = { product: Product };

export default function ProductCard({ product } : Props) {
    return (
        <Link
            href={`/products/${product.id}`}
            className="block rounded-lg border p-4 hover:shadow-md transition" 
        >
            <p className="text-xs uppercase text-gray-500">{product.category}</p>
            <h2 className="font-semibold mt-1">{product.name}</h2>
            <p className="text-sm text-gray-600 mt-2">{product.description}</p>
            <p className="font-bold mt-3">{formatPrice(product.price)}</p>
        </Link>
    );
}