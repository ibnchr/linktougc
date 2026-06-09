import { parseShopeeUrl } from "@/lib/utils";
import type { ProductInfo, ScrapeResult } from "@/types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface ShopeeItem {
  name?: string;
  price?: number;
  price_min?: number;
  price_max?: number;
  description?: string;
  images?: string[];
  item_rating?: { rating_star?: number };
  sold?: number;
  historical_sold?: number;
}

async function scrapeViaHttp(
  url: string,
  shopId: string,
  itemId: string
): Promise<ProductInfo | null> {
  const base = "https://shopee.co.id";

  const cookieRes = await fetch(base, {
    headers: { "User-Agent": USER_AGENT },
  });
  const cookies = cookieRes.headers.getSetCookie?.()?.join("; ") || "";
  const csrfToken = cookies.match(/csrf_token=([^;]+)/)?.[1] || "";

  const apiUrl = `${base}/api/v4/item/get?item_id=${itemId}&shop_id=${shopId}`;
  const apiRes = await fetch(apiUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: cookies,
      Accept: "application/json",
      Referer: url,
      ...(csrfToken ? { "x-csrftoken": csrfToken } : {}),
    },
  });

  if (!apiRes.ok) {
    const fallbackRes = await fetch(
      `${base}/api/v4/product/get_shop_item?shop_id=${shopId}&item_id=${itemId}`,
      { headers: { "User-Agent": USER_AGENT, Cookie: cookies } }
    );
    if (!fallbackRes.ok) return null;
    const fallbackData = await fallbackRes.json();
    if (!fallbackData?.data?.item) return null;

    const item: ShopeeItem = fallbackData.data.item;
    return {
      title: item.name ?? "",
      price: Math.round((item.price ?? 0) / 100000),
      priceOriginal:
        item.price_max && item.price_max !== item.price
          ? Math.round(item.price_max / 100000)
          : undefined,
      description: (item.description ?? "").substring(0, 250),
      images: (item.images ?? [])
        .slice(0, 8)
        .map((img: string) => `https://cf.shopee.co.id/file/${img}`),
      rating: item.item_rating?.rating_star ?? undefined,
      sold: item.historical_sold ?? item.sold ?? undefined,
      platform: "shopee",
      url,
    };
  }

  const data = await apiRes.json();
  const item: ShopeeItem | undefined = data.data?.item;
  if (!item?.name) return null;

  const hasVariants =
    item.price_min && item.price_max && item.price_min !== item.price_max;

  return {
    title: item.name,
    price: Math.round((hasVariants ? item.price_min! : item.price ?? 0) / 100000),
    priceOriginal: hasVariants
      ? Math.round((item.price_max ?? 0) / 100000)
      : undefined,
    description: (item.description ?? "").substring(0, 250),
    images: (item.images ?? [])
      .slice(0, 8)
      .map((img: string) => `https://cf.shopee.co.id/file/${img}`),
    rating: item.item_rating?.rating_star ?? undefined,
    sold: item.historical_sold ?? item.sold ?? undefined,
    platform: "shopee",
    url,
  };
}

export async function scrapeShopee(url: string): Promise<ScrapeResult> {
  try {
    const parsed = parseShopeeUrl(url);
    if (!parsed) {
      return {
        success: false,
        error:
          "URL Shopee tidak valid. Coba copy link produk dari halaman produk Shopee (bukan halaman pencarian atau cart).",
      };
    }

    const product = await scrapeViaHttp(url, parsed.shopId, parsed.itemId);

    if (!product?.title) {
      return {
        success: false,
        error:
          "Gagal mengambil data produk dari Shopee. Pastikan URL produk benar dan coba lagi.",
      };
    }

    if (product.images.length === 0) {
      return { success: false, error: "Gambar produk tidak ditemukan." };
    }

    return { success: true, product };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Gagal memproses produk Shopee: ${error.message}`
          : "Terjadi kesalahan yang tidak diketahui.",
    };
  }
}
