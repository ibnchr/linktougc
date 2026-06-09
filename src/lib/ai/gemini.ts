import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import type { Part } from "@google/generative-ai";
import type { ProductInfo, UgcScript, UgcCaption } from "@/types";

const API_KEY = process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

function getModel(index = 0) {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  return genAI.getGenerativeModel({
    model: models[index] || models[0],
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });
}

const SYSTEM_PROMPT = `Kamu adalah content creator TikTok/Shopee Indonesia spesialis UGC review produk fragrance & body care. Gaya bicaramu natural, santai, dan personal — seperti teman yang lagi cerita produk favorit.

Tugas: Buat script UGC review yang sangat spesifik sesuai deskripsi produk.

Output HARUS JSON:
{
  "script": {
    "hook": "teks hook maks 100 karakter",
    "narration": "narasi natural maks 400 karakter",
    "cta": "CTA kuat maks 100 karakter",
    "fullScript": "gabungan hook+narasi+cta"
  },
  "caption": {
    "text": "caption max 100 karakter",
    "hashtags": ["#hashtag1", "#hashtag2"],
    "full": "caption + hashtags (total max 150 karakter)"
  }
}

PENTING:
- Hook harus SPESIFIK ke produk (aroma, tekstur, sensasi), bukan generik
- Narasi pakai detail dari deskripsi produk
- Bahasa Indonesia santai, campur sedikit bahasa Inggris gaul (literally, trust me, dll)
- CTA beri alasan spesifik kenapa harus beli, bukan "cek link bio" doang
- Jawab HANYA JSON, tanpa markdown`;
function buildPrompt(product: ProductInfo): string {
  return `Produk ini:
- Nama: ${product.title}
- Harga: Rp ${product.price.toLocaleString("id-ID")}${product.priceOriginal ? ` (Diskon dari Rp ${product.priceOriginal.toLocaleString("id-ID")})` : ""}
- Rating: ${product.rating ? `${product.rating}/5` : "N/A"}${product.sold ? ` | Terjual: ${product.sold}` : ""}
- Platform: ${product.platform}
- Deskripsi lengkap: ${product.description || "Tidak ada deskripsi"}

Buat script UGC review yang sangat spesifik sesuai deskripsi produk di atas. Hook harus spesifik ke produk ini, bukan generik. Narasi pakai detail dari deskripsi. CTA beri alasan kenapa harus beli.`;
}

async function getImageParts(images: string[]): Promise<Part[]> {
  const parts: Part[] = [];

  for (let i = 0; i < Math.min(images.length, 3); i++) {
    const url = images[i];
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = response.headers.get("content-type") || "image/jpeg";
      parts.push({ inlineData: { mimeType, data: base64 } });
    } catch {
      continue;
    }
  }

  return parts;
}

function parseResponse(text: string): { script: UgcScript; caption: UgcCaption } {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  const parsed = JSON.parse(cleaned);
  return {
    script: {
      hook: String(parsed.script?.hook || "").slice(0, 100),
      narration: String(parsed.script?.narration || "").slice(0, 400),
      cta: String(parsed.script?.cta || "").slice(0, 100),
      fullScript: String(parsed.script?.fullScript || parsed.script?.hook + " " + parsed.script?.narration + " " + parsed.script?.cta || ""),
    },
    caption: parsed.caption
      ? {
          text: String(parsed.caption.text || "").slice(0, 150),
          hashtags: Array.isArray(parsed.caption.hashtags) ? parsed.caption.hashtags.slice(0, 5) : [],
          full: String(parsed.caption.full || "").slice(0, 150),
        }
      : generateCaptionFallback(parsed.script),
  };
}

function generateCaptionFallback(script: UgcScript): UgcCaption {
  const text = script.hook.slice(0, 80);
  const hashtags = ["#ugc", "#tiktokreview", "#recommended", "#fyp"];
  const hashtagStr = hashtags.join(" ");
  const full = `${text} ${hashtagStr}`.slice(0, 150);
  return { text, hashtags, full };
}

function fallbackResult(error?: string): { script: UgcScript; caption: UgcCaption } {
  return {
    script: {
      hook: "GAIS GAIS GAIS! Ini WAJIB KALIAN TAU!",
      narration: "Aku baru nemu produk ini dan literally mind-blowing banget. Qualitynya premium, harganya affordable. Trust me, gak bakal nyesel! Banyak yang udah beli dan reviewnya bagus-bagus.",
      cta: "Langling di bio sekarang! Sebelum kehabisan!",
      fullScript: "GAIS GAIS GAIS! Ini WAJIB KALIAN TAU! Aku baru nemu produk ini dan literally mind-blowing banget. Qualitynya premium, harganya affordable. Trust me, gak bakal nyesel! Banyak yang udah beli dan reviewnya bagus-bagus. Langling di bio sekarang! Sebelum kehabisan!",
    },
    caption: {
      text: error ? `Maaf, lagi error nih. Coba lagi ya!` : "Coba cek produk ini!",
      hashtags: ["#ugc", "#tiktokreview", "#fyp"],
      full: error ? `Maaf, lagi error nih. Coba lagi ya! #ugc #tiktokreview #fyp` : `Coba cek produk ini! #ugc #tiktokreview #fyp`,
    },
  };
}

function buildFullPrompt(product: ProductInfo): string {
  return `${SYSTEM_PROMPT}\n\n${buildPrompt(product)}`;
}

export async function analyzeProduct(product: ProductInfo): Promise<{ script: UgcScript; caption: UgcCaption; promptUsed: string }> {
  const promptUsed = buildFullPrompt(product);

  if (!API_KEY) {
    console.warn("[gemini] GEMINI_API_KEY not set, using fallback");
    return { ...fallbackResult(), promptUsed };
  }

  let lastError: unknown;

  for (let i = 0; i < 2; i++) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const model = getModel(i);
        const [imageParts, textPrompt] = await Promise.all([
          getImageParts(product.images),
          Promise.resolve(buildPrompt(product)),
        ]);

        const contents: (string | Part)[] = [
          { text: SYSTEM_PROMPT },
          ...imageParts,
          { text: textPrompt },
        ];

        const result = await model.generateContent(contents);
        const responseText = result.response.text();
        const parsed = parseResponse(responseText);
        return { ...parsed, promptUsed };
      } catch (error: unknown) {
        lastError = error;

        if (error instanceof GoogleGenerativeAIFetchError) {
          const status = error.status;
          if (status === 429) {
            if (attempt < 2) {
              const delay = (attempt + 1) * 10000;
              console.warn(`[gemini] Rate limited (429), retry ${attempt + 1}/3 in ${delay}ms...`);
              await new Promise(r => setTimeout(r, delay));
              continue;
            }
            console.warn(`[gemini] Rate limited (429), ${i === 1 ? "out of models" : "trying next model"}`);
            if (i === 1) {
              return {
                script: {
                  hook: "Waduh, lagi rame banget nih!",
                  narration: "Server lagi penuh, tapi tenang aja. Produk ini recommended banget! Buruan dicek!",
                  cta: "Klik link di bio sekarang!",
                  fullScript: "Waduh, lagi rame banget nih! Server lagi penuh, tapi tenang aja. Produk ini recommended banget! Buruan dicek! Klik link di bio sekarang!",
                },
                caption: {
                  text: "Server penuh! Tapi produk ini wajib dicek!",
                  hashtags: ["#ugc", "#limited", "#fyp"],
                  full: "Server penuh! Tapi produk ini wajib dicek! #ugc #limited #fyp",
                },
                promptUsed,
              };
            }
            break;
          }
          if (status === 403 || status === 402) {
            console.warn(`[gemini] Quota exhausted (${status}), using fallback`);
            return {
              script: {
                hook: "Maaf banget, kuota lagi abis!",
                narration: "Tapi tenang, produk ini recommended banget! Cek aja langsung lewat link di bio. Dijamin puas!",
                cta: "Langling di bio!",
                fullScript: "Maaf banget, kuota lagi abis! Tapi tenang, produk ini recommended banget! Cek aja langsung lewat link di bio. Dijamin puas! Langling di bio!",
              },
              caption: {
                text: "Kuota abis, tapi produk recommended!",
                hashtags: ["#ugc", "#tiktok", "#checkthisout"],
                full: "Kuota abis, tapi produk recommended! #ugc #tiktok #checkthisout",
              },
              promptUsed,
            };
          }
          if (status === 503) {
            if (attempt < 2) {
              const delay = (attempt + 1) * 3000;
              console.warn(`[gemini] Model busy (503), retry ${attempt + 1}/3 in ${delay}ms...`);
              await new Promise(r => setTimeout(r, delay));
              continue;
            }
            console.warn(`[gemini] Model busy (503), ${i === 1 ? "out of models" : "trying next model"}`);
            if (i === 1) {
              return { ...fallbackResult("Model sibuk"), promptUsed };
            }
            break;
          }
        }

        if (attempt === 2) {
          if (i === 1) {
            console.warn("[gemini] Both models failed, using fallback", lastError);
            return { ...fallbackResult("Gagal generate script"), promptUsed };
          }
        }
      }
    }
  }

  return { ...fallbackResult("Terjadi kesalahan"), promptUsed };
}

export function generateCaption(product: ProductInfo, script: UgcScript): UgcCaption {
  const productKeywords = product.title
    .split(" ")
    .filter((w) => w.length > 3)
    .slice(0, 2);

  const text = `${script.hook} ${script.cta}`.slice(0, 100);

  const hashtags = [
    "#ugc",
    "#tiktokreview",
    "#recommended",
    ...productKeywords.map((k) => `#${k.toLowerCase()}`),
    "#fyp",
  ].slice(0, 5);

  const hashtagStr = hashtags.join(" ");
  const full = `${text} ${hashtagStr}`.slice(0, 150);

  return { text, hashtags, full };
}
