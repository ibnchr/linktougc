import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { analyzeProduct } from "@/lib/ai/gemini";
import { generateVideo } from "@/lib/ai/veo";
import { storeOutput } from "@/lib/storage";
import type { ProductInfo, UgcOutput } from "@/types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const product = body?.product as ProductInfo | undefined;

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Data produk tidak ditemukan. Harap kirimkan data produk yang valid." },
        { status: 400 },
      );
    }

    if (!product.title || !product.description || !product.platform || !product.url) {
      return NextResponse.json(
        { success: false, error: "Data produk tidak lengkap. Pastikan title, description, platform, dan url tersedia." },
        { status: 400 },
      );
    }

    await sleep(500);

    const { script, caption, promptUsed } = await analyzeProduct(product);

    await sleep(800);

    const id = nanoid();
    const createdAt = new Date().toISOString();

    const videoResult = await generateVideo(script, product);

    if (videoResult.error) {
      const output: UgcOutput = {
        id,
        product,
        script,
        caption,
        promptUsed,
        videoStatus: "failed",
        createdAt,
      };
      storeOutput(output);

      return NextResponse.json({
        success: true,
        output,
        warning: videoResult.error,
      });
    }

    const output: UgcOutput = {
      id,
      product,
      script,
      caption,
      promptUsed,
      videoUrl: videoResult.videoUrl,
      videoStatus: "completed",
      createdAt,
    };
    storeOutput(output);

    return NextResponse.json({ success: true, output });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui";

    console.error("[generate] Error:", error);

    return NextResponse.json(
      { success: false, error: `Gagal memproses generasi konten: ${message}` },
      { status: 500 },
    );
  }
}
