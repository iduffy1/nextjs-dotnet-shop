import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default async function Homepage() {
  const products = await getProducts();

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  )

}