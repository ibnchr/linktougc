import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateId(): string {
  return nanoid(12);
}

export function detectPlatform(url: string): "shopee" | "tiktok" | "unknown" {
  const lower = url.toLowerCase();
  if (lower.includes("shopee.co.id") || lower.includes("shopee.com.my") || lower.includes("shopee.sg") || lower.includes("shopee.")) {
    return "shopee";
  }
  if (lower.includes("tiktok.com") || lower.includes("tiktok")) {
    return "tiktok";
  }
  return "unknown";
}

export function parseShopeeUrl(url: string): { shopId: string; itemId: string } | null {
  try {
    const cleanUrl = url.trim().toLowerCase();

    const urlObj = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`);
    const pathname = urlObj.pathname;

    // 1. Format standar /product/{shop_id}/{item_id}
    const productMatch = pathname.match(/\/product\/(\d+)\/(\d+)/);
    if (productMatch) {
      return { shopId: productMatch[1], itemId: productMatch[2] };
    }

    // 2. Format paling umum: ...-i.{shop_id}.{item_id}
    const iMatch = cleanUrl.match(/-i\.(\d+)\.(\d+)/);
    if (iMatch) {
      return { shopId: iMatch[1], itemId: iMatch[2] };
    }

    // 3. Format lama / {slug}.i.{shop_id}.{item_id}
    const dotIMatch = cleanUrl.match(/\.i\.(\d+)\.(\d+)/);
    if (dotIMatch) {
      return { shopId: dotIMatch[1], itemId: dotIMatch[2] };
    }

    // 4. Query parameter (kadang muncul di affiliate atau share link)
    const itemIdParam = urlObj.searchParams.get("itemid") || urlObj.searchParams.get("item_id");
    const shopIdParam = urlObj.searchParams.get("shopid") || urlObj.searchParams.get("shop_id");
    if (itemIdParam && shopIdParam) {
      return { shopId: shopIdParam, itemId: itemIdParam };
    }

    // 5. Fallback regex super agresif (tangkap hampir semua kasus)
    const aggressiveMatch = cleanUrl.match(/i\.?(\d{7,11})\.?(\d{7,11})/);
    if (aggressiveMatch) {
      return { shopId: aggressiveMatch[1], itemId: aggressiveMatch[2] };
    }

    return null;
  } catch {
    return null;
  }
}

export function parseTiktokUrl(url: string): { productId: string } | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
    /tiktok\.com\/@[\w.-]+\/photo\/(\d+)/i,
    /vm\.tiktok\.com\/([\w-]+)/i,
    /tiktok\.com\/product\/(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { productId: match[1] };
    }
  }

  return null;
}

export function getImageUrl(imageData: string): string {
  if (imageData.startsWith("http")) return imageData;
  if (imageData.startsWith("//")) return `https:${imageData}`;
  return `https://cf.shopee.co.id/file/${imageData}`;
}
