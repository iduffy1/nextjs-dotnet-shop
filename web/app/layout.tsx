import Link from "next/link";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BasketProvider } from "@/components/BasketProvider";
import BasketLink from "@/components/BasketLink";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shop",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BasketProvider>
          <header className="border-b p-4 font-bold">
            <Link href="/">Shop</Link>
            <BasketLink />
          </header>
          {children}
        </BasketProvider>
      </body>
    </html>
  );
}
