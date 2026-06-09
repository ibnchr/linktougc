import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import ffmpegPath from "ffmpeg-static";
import type { UgcScript, ProductInfo } from "@/types";

const execPromise = util.promisify(exec);
const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

const API_KEY = process.env.VEO_API_KEY || process.env.GEMINI_API_KEY || "";
const mockMode = !API_KEY || process.env.VEO_MOCK === "true";

const FONT_PATHS = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
  "/usr/share/fonts/TTF/DejaVuSans.ttf",
  path.join(process.cwd(), "public", "font.ttf"),
];

function findFont(): string {
  for (const p of FONT_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return "fonts/DejaVuSans.ttf";
}

function escapeDrawtext(text: string): string {
  return text
    .replace(/'/g, "\u2019")
    .replace(/!/g, "\uFF01")
    .replace(/:/g, "\uFF1A")
    .replace(/\[/g, "\u3010")
    .replace(/\]/g, "\u3011");
}

function splitText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current += " " + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

let fontFile: string | null = null;

function getFont(): string {
  if (fontFile) return fontFile;
  fontFile = findFont();
  return fontFile;
}

function buildDrawtextFilter(text: string, yPos: number, fontSize: number): string {
  const lines = splitText(text, 28);
  const lineHeight = Math.round(fontSize * 1.3);
  const totalHeight = lines.length * lineHeight;
  const startY = yPos - Math.round(totalHeight / 2);

  return lines
    .map((line, i) => {
      const y = startY + (i === 0 ? 0 : (i * lineHeight));
      return `drawtext=text='${escapeDrawtext(line)}':x=(w-text_w)/2:y=${y}:fontsize=${fontSize}:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=12:fontfile='${getFont()}'`;
    })
    .join(",");
}

async function downloadImage(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    return true;
  } catch {
    return false;
  }
}

async function generateWithFfmpeg(
  script: UgcScript,
  product: ProductInfo,
  videoId: string,
): Promise<{ videoUrl?: string; error?: string }> {
  const tmpDir = path.join(GENERATED_DIR, `tmp-${videoId}`);
  const outputPath = path.join(GENERATED_DIR, `${videoId}.mp4`);
  const publicUrl = `/generated/${videoId}.mp4`;

  try {
    if (!fs.existsSync(GENERATED_DIR)) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpDir, { recursive: true });

    const validImages: string[] = [];
    if (product.images.length === 0) {
      return { error: "Tidak ada gambar produk" };
    }

    for (let i = 0; i < Math.min(product.images.length, 4); i++) {
      const imgPath = path.join(tmpDir, `img${i}.jpg`);
      const ok = await downloadImage(product.images[i], imgPath);
      if (ok) validImages.push(imgPath);
      console.log(`  📷 Image ${i + 1}: ${ok ? "OK" : "FAIL"}`);
    }

    if (validImages.length === 0) {
      return { error: "Gagal download gambar produk" };
    }

    console.log(`  🎬 FFmpeg: ${validImages.length} images → ${outputPath}`);

    const duration = 4;
    const fadeDur = 0.5;
    const w = 1080;
    const h = 1920;

    let filterParts: string[] = [];

    for (let i = 0; i < validImages.length; i++) {
      const filters: string[] = [
        `scale=${w}:${h}:force_original_aspect_ratio=decrease`,
        `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black`,
        `setpts=PTS-STARTPTS`,
      ];

      if (i === 0) {
        filters.push(buildDrawtextFilter(script.hook, 200, 52));
        filters.push(buildDrawtextFilter(script.cta, h - 200, 44));
      }

      if (i === 1 && script.narration) {
        filters.push(buildDrawtextFilter(script.narration.slice(0, 120), h / 2 - 50, 40));
      }

      filterParts.push(`[${i}:v]${filters.join(",")}[v${i}]`);
    }

    let prev: string;
    if (validImages.length === 1) {
      prev = "[v0]";
    } else {
      const xfadeParts: string[] = [];
      let current = "[v0]";
      let offset = duration - fadeDur;

      for (let i = 1; i < validImages.length; i++) {
        const out = i === validImages.length - 1 ? "vout" : `v${i}x`;
        xfadeParts.push(`${current}[v${i}]xfade=transition=fade:duration=${fadeDur}:offset=${offset * i}[${out}]`);
        current = `[${out}]`;
      }
      prev = "[vout]";
      filterParts.push(...xfadeParts);
    }

    const inputFiles = validImages.map((img) => `-loop 1 -t ${duration} -i "${img}"`).join(" ");
    const filterComplex = filterParts.join("; ");
    const totalDuration = validImages.length * duration - (validImages.length - 1) * fadeDur;

    const ffmpegBin = ffmpegPath || "ffmpeg";
    const cmd = `"${ffmpegBin}" ${inputFiles} -filter_complex "${filterComplex}" -map "${prev}" -c:v libx264 -pix_fmt yuv420p -r 30 -t ${totalDuration} -preset ultrafast -y "${outputPath}" 2>&1`;

    console.log(`  🎬 FFmpeg cmd length: ${cmd.length} chars`);
    const { stderr } = await execPromise(cmd);
    const lines = stderr.split("\n").filter(l => l.includes("error") || l.includes("Error") || l.includes("frame="));
    if (lines.length > 0) console.log(`  🎬 ${lines.slice(0, 3).join(" | ")}`);

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) {
      return { error: "FFmpeg gagal menghasilkan video (file terlalu kecil atau tidak ada)" };
    }

    console.log(`  ✅ Video selesai: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)} MB`);

    return { videoUrl: publicUrl };
  } catch (error: any) {
    console.error("  ❌ FFmpeg error:", error.message);
    return { error: `Gagal bikin video: ${error.message}` };
  } finally {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

export async function generateVideo(
  script: UgcScript,
  product: ProductInfo,
): Promise<{ videoUrl?: string; error?: string }> {
  const videoId = `ugc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (mockMode) {
    console.log(`🎬 Mock Veo: generating slideshow from ${product.images.length} product images`);
    return generateWithFfmpeg(script, product, videoId);
  }

  // Real mode falls back to mock (Veo predictLongRunning not available via API key)
  console.log("🎬 Veo not available via API key, using FFmpeg fallback");
  return generateWithFfmpeg(script, product, videoId);
}

export async function getVideoStatus(
  _jobId: string,
): Promise<{ status: string; videoUrl?: string }> {
  return { status: "COMPLETED" };
}
