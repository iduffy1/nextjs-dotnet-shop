"use client";

import Link from "next/link";
import { useBasket } from "./BasketProvider";

export default function BasketLink() {
  const { count } = useBasket();
  return (
    <Link href="/basket" className="text-sm font-normal hover:underline">
      Basket ({count})
    </Link>
  );
}