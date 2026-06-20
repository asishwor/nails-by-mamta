import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Nails By Mamta | Premium Nail Artistry",
  description: "Book your premium nail services today. Experience luxurious nail care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${playfair.variable} font-sans antialiased text-slate-800`}>
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
