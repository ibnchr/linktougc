export interface ProductInfo {
  title: string;
  price: number;
  priceOriginal?: number;
  description: string;
  images: string[];
  rating?: number;
  sold?: number;
  platform: "shopee" | "tiktok";
  url: string;
}

export interface UgcScript {
  hook: string;
  narration: string;
  cta: string;
  fullScript: string;
}

export interface UgcCaption {
  text: string;
  hashtags: string[];
  full: string;
}

export interface UgcOutput {
  id: string;
  product: ProductInfo;
  script: UgcScript;
  caption: UgcCaption;
  promptUsed?: string;
  videoUrl?: string;
  videoStatus: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
}

export interface ScrapeResult {
  success: boolean;
  product?: ProductInfo;
  error?: string;
}

export interface GenerateResult {
  success: boolean;
  output?: UgcOutput;
  error?: string;
}

export type GenerationStep =
  | "idle"
  | "scraping"
  | "analyzing"
  | "scripting"
  | "rendering"
  | "completed"
  | "failed";

export interface GenerationProgress {
  step: GenerationStep;
  message: string;
  progress: number;
}
