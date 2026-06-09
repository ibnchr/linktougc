import { z } from "zod";

export const linkSchema = z.object({
  url: z
    .string()
    .min(1, "Link produk wajib diisi")
    .url("Masukkan URL yang valid")
    .refine(
      (url) => {
        const lower = url.toLowerCase();
        return (
          lower.includes("shopee.") ||
          lower.includes("tiktok.")
        );
      },
      { message: "Hanya link Shopee atau TikTok yang didukung" }
    ),
});

export type LinkSchema = z.infer<typeof linkSchema>;

export const scriptEditSchema = z.object({
  hook: z.string().min(1).max(200),
  narration: z.string().min(1).max(1000),
  cta: z.string().min(1).max(200),
});

export type ScriptEditSchema = z.infer<typeof scriptEditSchema>;

export const captionSchema = z.object({
  text: z.string().min(1).max(100),
  hashtags: z.array(z.string()).max(5),
});
