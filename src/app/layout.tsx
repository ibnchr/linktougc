import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "UGCForge - 1 Link Produk → Video UGC Review Siap Viral",
  description:
    "Ubah link produk Shopee/TikTok menjadi video UGC review viral dengan AI. Gratis, cepat, dan hasilnya keren!",
  keywords: [
    "UGC",
    "video review",
    "AI video generator",
    "Shopee",
    "TikTok Shop",
    "UGCForge",
    "LinkToUGC",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
