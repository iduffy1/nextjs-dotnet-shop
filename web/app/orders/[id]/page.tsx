import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold">Thank you, order #{order.id} is confirmed</h1>
      <p className="text-sm text-gray-600 mt-1">
        Placed {new Date(order.createdAt).toLocaleString("en-GB")}
      </p>

      <ul className="mt-6 divide-y rounded-lg border">
        {order.lines.map((line) => (
          <li key={line.productId} className="flex justify-between p-4">
            <span>{line.quantity} × {line.productName}</span>
            <span className="font-semibold">{formatPrice(line.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-right text-xl font-bold">Total: {formatPrice(order.total)}</p>
      <Link href="/" className="mt-6 inline-block text-blue-600 hover:underline">
        Continue shopping
      </Link>
    </main>
  );
}