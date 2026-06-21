import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Mukta, Playfair_Display } from "next/font/google";
import { ChatbotWidget } from "@/components/ui/ChatbotWidget";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import "./globals.css";

const mukta = Mukta({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin", "devanagari"], variable: "--font-outfit" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Nails By Mamta | Premium Nail Artistry",
  description: "Book your premium nail services today. Experience luxurious nail care.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${mukta.variable} ${playfair.variable} font-sans antialiased text-slate-800`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <ChatbotWidget />
            <Toaster position="top-center" />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
