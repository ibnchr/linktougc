import type { ProductInfo, ScrapeResult } from "@/types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const HTML_HEADERS: Record<string, string> = {
  "User-Agent": USER_AGENT,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

const API_HEADERS: Record<string, string> = {
  "User-Agent": USER_AGENT,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Referer: "https://www.tiktok.com/",
};

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  attempt: number = 1,
): Promise<Response | null> {
  try {
    const res = await fetch(url, { headers });
    if (res.ok) return res;
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 1500));
      return fetchWithRetry(url, headers, attempt + 1);
    }
    return res;
  } catch {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 1500));
      return fetchWithRetry(url, headers, attempt + 1);
    }
    return null;
  }
}

export async function resolveTiktokUrl(shortUrl: string): Promise<string> {
  try {
    const res = await fetch(shortUrl, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": USER_AGENT },
    });
    const location = res.headers.get("location");
    if (location) {
      if (location.startsWith("/")) {
        try {
          const u = new URL(shortUrl);
          return `${u.protocol}//${u.host}${location}`;
        } catch {
          return `https://www.tiktok.com${location}`;
        }
      }
      return location;
    }
    const followRes = await fetch(shortUrl, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    return followRes.url;
  } catch {
    return shortUrl;
  }
}

function extractProductId(url: string): string | null {
  const patterns = [
    /shop\.tiktok\.com\/view\/product\/(\d+)/i,
    /tiktok\.com\/product\/(\d+)/i,
    /tiktok\.com\/@[\w.-]+\/(?:video|photo)\/(\d+)/i,
    /tiktok\.com\/@[\w.-]+\/product\/(\d+)/i,
    /vm\.tiktok\.com\/([\w-]+)/i,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractNextDataProduct(data: any): ProductInfo | null {
  const props = data.props?.pageProps ?? data.props ?? data;
  const productSource =
    props.productInfo ?? props.product ?? props.item ?? props.data;

  if (!productSource) {
    const deepFind = (obj: any, depth: number = 0): any => {
      if (depth > 5 || !obj || typeof obj !== "object") return null;
      if (obj.title && (obj.price || obj.price_text)) return obj;
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const found = deepFind(item, depth + 1);
          if (found) return found;
        }
      }
      for (const key of Object.keys(obj)) {
        if (key.includes("product") || key.includes("Product")) {
          const found = deepFind(obj[key], depth + 1);
          if (found) return found;
        }
      }
      for (const val of Object.values(obj)) {
        const found = deepFind(val, depth + 1);
        if (found) return found;
      }
      return null;
    };
    const found = deepFind(productSource ?? data);
    if (!found) return null;
    return buildProductInfo(found, "");
  }

  return buildProductInfo(productSource, "");
}

function buildProductInfo(source: any, url: string): ProductInfo | null {
  const title = source.title ?? source.name ?? source.product_name ?? "";
  if (!title) return null;

  const rawPrice = source.price ?? source.price_text ?? "0";
  const price =
    typeof rawPrice === "string"
      ? parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(/,/g, ""))
      : typeof rawPrice === "number"
        ? rawPrice
        : 0;
  const rawOriginal =
    source.original_price ?? source.market_price ?? source.price_before_discount;
  const priceOriginal =
    rawOriginal != null
      ? typeof rawOriginal === "string"
        ? parseFloat(rawOriginal.replace(/[^0-9.,]/g, "").replace(/,/g, ""))
        : rawOriginal
      : undefined;

  const images = extractImages(source);
  if (images.length === 0) return null;

  return {
    title,
    price: isNaN(price) ? 0 : price,
    priceOriginal: priceOriginal != null && !isNaN(priceOriginal) ? priceOriginal : undefined,
    description: source.description ?? source.desc ?? "",
    images,
    rating: source.rating ?? source.star_rating ?? source.average_rating ?? undefined,
    sold: source.sold ?? source.sales ?? source.historical_sold ?? source.total_sold ?? undefined,
    platform: "tiktok",
    url,
  };
}

function extractImages(data: any): string[] {
  const seen = new Set<string>();
  const images: string[] = [];

  const rawCandidates: string[] = [];

  if (typeof data === "string") {
    rawCandidates.push(data);
  } else if (data) {
    if (Array.isArray(data.images)) rawCandidates.push(...data.images);
    if (Array.isArray(data.image)) rawCandidates.push(...data.image);
    if (Array.isArray(data.imgUrls)) rawCandidates.push(...data.imgUrls);
    if (Array.isArray(data.product_images)) rawCandidates.push(...data.product_images);
    if (Array.isArray(data.media)) {
      for (const m of data.media) {
        if (typeof m === "string") rawCandidates.push(m);
        else if (m?.url) rawCandidates.push(m.url);
        else if (m?.image) rawCandidates.push(m.image);
        else if (m?.src) rawCandidates.push(m.src);
      }
    }
    if (data.main_image_url) rawCandidates.push(data.main_image_url);
    if (data.main_image) rawCandidates.push(data.main_image);
    if (data.cover) rawCandidates.push(data.cover);
    if (data.thumbnail) rawCandidates.push(data.thumbnail);

    for (const key of Object.keys(data)) {
      if (key.toLowerCase().includes("cover") || key.toLowerCase().includes("thumbnail")) {
        const val = data[key];
        if (typeof val === "string") rawCandidates.push(val);
      }
    }
  }

  for (const img of rawCandidates) {
    if (!img || typeof img !== "string") continue;
    const trimmed = img.trim();
    if (!trimmed) continue;
    const url = trimmed.startsWith("http")
      ? trimmed
      : trimmed.startsWith("//")
        ? `https:${trimmed}`
        : trimmed;
    if (!url.startsWith("http")) continue;
    const key = url.replace(/[?#].*$/, "").replace(/\/[^/]+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    images.push(url);
    if (images.length >= 8) break;
  }

  return images;
}

function parseNextData(html: string): any {
  const match = html.match(
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json"\s*>([\s\S]*?)<\/script>/i,
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function parseJsonLd(html: string): any {
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed["@type"] === "Product") return parsed;
      if (parsed["@graph"]) {
        for (const item of parsed["@graph"]) {
          if (item["@type"] === "Product") return item;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

function parseInitState(html: string): any {
  const match = html.match(
    /<script[^>]*>[\s\S]*?window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});[\s\S]*?<\/script>/i,
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function extractProductFromInitState(state: any, url: string): ProductInfo | null {
  const searchIn = (obj: any, depth: number = 0): any => {
    if (depth > 6 || !obj || typeof obj !== "object") return null;
    if (obj.title && (obj.price != null || obj.price_text)) {
      const images = extractImages(obj);
      if (images.length > 0) return obj;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = searchIn(item, depth + 1);
        if (found) return found;
      }
    } else {
      for (const val of Object.values(obj)) {
        if (val && typeof val === "object") {
          const found = searchIn(val, depth + 1);
          if (found) return found;
        }
      }
    }
    return null;
  };

  const product = searchIn(state);
  if (!product) return null;
  return buildProductInfo(product, url);
}

function extractProductFromJsonLd(jsonLd: any, url: string): ProductInfo | null {
  const name = jsonLd.name ?? "";
  if (!name) return null;

  const offers = jsonLd.offers ?? jsonLd.offers?.[0] ?? {};
  const price =
    typeof offers.price === "string"
      ? parseFloat(offers.price)
      : offers.price ?? 0;

  const images: string[] = [];
  const rawImage = jsonLd.image ?? jsonLd.thumbnailUrl;
  if (typeof rawImage === "string") {
    images.push(rawImage);
  } else if (Array.isArray(rawImage)) {
    for (const img of rawImage) {
      if (typeof img === "string") images.push(img);
    }
  }

  if (images.length === 0) return null;

  return {
    title: name,
    price,
    priceOriginal: undefined,
    description: jsonLd.description ?? "",
    images,
    rating: jsonLd.aggregateRating?.ratingValue ?? undefined,
    sold: undefined,
    platform: "tiktok",
    url,
  };
}

async function tryApi(productId: string, resolvedUrl: string): Promise<ProductInfo | null> {
  const endpoints = [
    `https://www.tiktok.com/api/product/detail/?product_id=${productId}&need_item_full=1`,
    `https://www.tiktok.com/ocean/v1/tab/product/detail/?product_id=${productId}`,
    `https://shop.tiktok.com/rest/v2/product/detail?product_id=${productId}`,
  ];

  for (const endpointUrl of endpoints) {
    const res = await fetchWithRetry(endpointUrl, API_HEADERS);
    if (!res || !res.ok) continue;
    try {
      const json = await res.json();
      const d = json.data ?? json;
      const title = d.title ?? d.name ?? d.product_name ?? "";
      if (!title) continue;
      const product = buildProductInfo(d, resolvedUrl);
      if (product) return product;
    } catch {
      continue;
    }
  }

  return null;
}

async function tryPageScrape(resolvedUrl: string): Promise<ProductInfo | null> {
  const res = await fetchWithRetry(resolvedUrl, HTML_HEADERS);
  if (!res || !res.ok) return null;
  const html = await res.text();

  const nextData = parseNextData(html);
  if (nextData) {
    const product = extractNextDataProduct(nextData);
    if (product) {
      product.url = resolvedUrl;
      return product;
    }
  }

  const jsonLd = parseJsonLd(html);
  if (jsonLd) {
    const product = extractProductFromJsonLd(jsonLd, resolvedUrl);
    if (product) return product;
  }

  const initState = parseInitState(html);
  if (initState) {
    const product = extractProductFromInitState(initState, resolvedUrl);
    if (product) return product;
  }

  return null;
}

export async function scrapeTiktok(url: string): Promise<ScrapeResult> {
  try {
    const isShortUrl = /vm\.tiktok\.com/i.test(url);
    const resolvedUrl = isShortUrl ? await resolveTiktokUrl(url) : url;

    const productId = extractProductId(resolvedUrl);

    if (productId) {
      const apiResult = await tryApi(productId, resolvedUrl);
      if (apiResult) {
        return { success: true, product: apiResult };
      }
    }

    const pageResult = await tryPageScrape(resolvedUrl);
    if (pageResult) {
      return { success: true, product: pageResult };
    }

    return {
      success: false,
      error:
        "Gagal mengambil data produk TikTok. Pastikan URL produk valid dan coba lagi.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error
        ? `Terjadi kesalahan saat memproses produk TikTok: ${error.message}`
        : "Terjadi kesalahan yang tidak diketahui.",
    };
  }
}
