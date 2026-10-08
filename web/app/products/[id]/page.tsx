import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import AddToBasketButton from "@/components/AddToBasketButton";

export async function generateMetadata({ params }: PageProps<"/products/[id]">) {
    const { id } = await params;
    const product = await getProduct(id);
    return { title: product ? `${product.name} | Shop` : "Not found | Shop" };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
    const { id } = await params;
    const product = await getProduct(id);
    
    if (!product) notFound();

    return (
        <main className="max-m-3xl mx-auto p-8">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
                ← All products
            </Link>

            <p className="text-xs uppercase text-gray-500 mt-6">{product.category}</p>
            <p className="text-3xl font-bold mt-1">{product.name}</p>
            <p className="text-gray-700 mt-4">{product.description}</p>
            <p className="text-2xl font-bold mt-6">{formatPrice(product.price)}</p>
            <AddToBasketButton product={product} />
        </main>
    )

}