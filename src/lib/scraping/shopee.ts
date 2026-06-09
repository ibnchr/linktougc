import { chromium } from "playwright";
import { parseShopeeUrl } from "@/lib/utils";
import type { ProductInfo, ScrapeResult } from "@/types";

const STEALTH_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--no-sandbox",
];

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function scrapeViaPlaywright(
  url: string,
  shopId: string,
  itemId: string
): Promise<ProductInfo | null> {
  const browser = await chromium.launch({ headless: true, args: STEALTH_ARGS });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 800 },
    locale: "id-ID",
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
  const page = await context.newPage();

  // Intercept API response untuk price & data lengkap
  let apiItem: any = null;
  page.on("response", async (res) => {
    if (res.url().includes("/api/v4/item/get") && res.ok()) {
      try {
        const json = await res.json();
        if (json.data?.item) apiItem = json.data.item;
      } catch {}
    }
  });

  try {
    // Step 1: Buka homepage dulu untuk cookies
    await page.goto("https://shopee.co.id", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(1500);

    // Step 2: Navigasi ke product page
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    const redirected = page.url().includes("verify/traffic");
    if (redirected) return null;

    // Jika API terintercept, gunakan data lengkap
    if (apiItem) {
      return {
        title: apiItem.name ?? "",
        price: Math.round((apiItem.price ?? 0) / 100000),
        priceOriginal:
          apiItem.price_max && apiItem.price_max !== apiItem.price
            ? Math.round(apiItem.price_max / 100000)
            : undefined,
        description: (apiItem.description ?? "").substring(0, 250),
        images: (apiItem.images ?? []).map(
          (img: string) => `https://cf.shopee.co.id/file/${img}`
        ),
        rating: apiItem.rating_star ?? undefined,
        sold: apiItem.sold ?? apiItem.historical_sold ?? undefined,
        platform: "shopee",
        url,
      };
    }

    // Fallback: MFE data + price dari DOM
    const productData = await page.evaluate(
      ({ shopId, itemId }) => {
        const mfe = document.querySelector(
          'script[type="text/mfe-initial-data"]'
        );
        if (!mfe) return null;

        try {
          const parsed = JSON.parse(mfe.textContent || "{}");
          const state = parsed.initialState;
          const cacheKey = `${shopId}/${itemId}`;
          const cached =
            state.DOMAIN_PDP?.data?.PDP_BFF_DATA?.cachedMap?.[cacheKey]?.item;
          if (!cached) return null;

          const itemImages = state.item?.items?.[itemId]?.images || [];
          const allImages = [cached.image, ...itemImages].filter(Boolean);

          // Price dari DOM
          const priceText =
            document
              .querySelector('[class*="productPrice"]')
              ?.textContent?.trim()
              ?.replace(/[^0-9]/g, "") ||
            document
              .querySelector('[class*="price"]')
              ?.textContent?.trim()
              ?.replace(/[^0-9]/g, "") ||
            "";
          const domPrice = parseInt(priceText, 10) || 0;

          return {
            title: cached.title || "",
            price: domPrice,
            description: (cached.description || "").substring(0, 250),
            images: allImages.map(
              (img: string) => `https://cf.shopee.co.id/file/${img}`
            ),
            rating: cached.item_rating?.rating_star ?? undefined,
            sold: cached.historical_sold ?? undefined,
          };
        } catch {
          return null;
        }
      },
      { shopId, itemId }
    );

    if (!productData?.title) return null;

    return {
      title: productData.title,
      price: productData.price,
      description: productData.description,
      images: [...new Set(productData.images)].slice(0, 8),
      rating: productData.rating,
      sold: productData.sold,
      platform: "shopee",
      url,
    };
  } finally {
    await browser.close();
  }
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

    const product = await scrapeViaPlaywright(url, parsed.shopId, parsed.itemId);

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
