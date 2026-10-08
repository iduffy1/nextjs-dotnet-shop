import BasketView from "@/components/BasketView";

export const metadata = { title: "Basket | Shop" };

export default function BasketPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Your basket</h1>
      <BasketView />
    </main>
  );
}