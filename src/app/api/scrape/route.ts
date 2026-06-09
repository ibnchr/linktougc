import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { detectPlatform, parseShopeeUrl, parseTiktokUrl } from "@/lib/utils";
import { scrapeShopee } from "@/lib/scraping/shopee";
import { scrapeTiktok } from "@/lib/scraping/tiktok";

const bodySchema = z.object({
  url: z.string().min(1, "URL tidak boleh kosong").url("Format URL tidak valid"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || "Data tidak valid";
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 400 },
      );
    }

    const { url } = parsed.data;
    const platform = detectPlatform(url);

    if (platform === "unknown") {
      return NextResponse.json(
        {
          success: false,
          error: "Link tidak didukung. Gunakan link Shopee atau TikTok.",
        },
        { status: 400 },
      );
    }

    const result =
      platform === "shopee" ? await scrapeShopee(url) : await scrapeTiktok(url);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? `Terjadi kesalahan: ${error.message}`
        : "Terjadi kesalahan yang tidak diketahui.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
