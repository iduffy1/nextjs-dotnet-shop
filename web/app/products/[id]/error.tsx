"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-gray-600 mt-2">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded border px-4 py-2">
        Try again
      </button>
    </main>
  );
}