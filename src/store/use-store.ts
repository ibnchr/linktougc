import { create } from "zustand";
import type { ProductInfo, UgcScript, UgcCaption, GenerationStep } from "@/types";

interface AppState {
  // URL input
  url: string;
  setUrl: (url: string) => void;

  // Generation progress
  step: GenerationStep;
  progress: number;
  message: string;
  setProgress: (step: GenerationStep, message: string, progress: number) => void;

  // Scraping results
  product: ProductInfo | null;
  setProduct: (product: ProductInfo | null) => void;

  // Script & caption
  script: UgcScript | null;
  caption: UgcCaption | null;
  setScript: (script: UgcScript | null) => void;
  setCaption: (caption: UgcCaption | null) => void;

  // Video
  videoUrl: string | null;
  videoStatus: "pending" | "processing" | "completed" | "failed";
  setVideoUrl: (url: string | null) => void;
  setVideoStatus: (status: "pending" | "processing" | "completed" | "failed") => void;

  // Output ID
  outputId: string | null;
  setOutputId: (id: string | null) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  url: "",
  step: "idle" as GenerationStep,
  progress: 0,
  message: "",
  product: null,
  script: null,
  caption: null,
  videoUrl: null,
  videoStatus: "pending" as const,
  outputId: null,
  error: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setUrl: (url) => set({ url }),

  setProgress: (step, message, progress) =>
    set({ step, message, progress }),

  setProduct: (product) => set({ product }),

  setScript: (script) => set({ script }),
  setCaption: (caption) => set({ caption }),

  setVideoUrl: (videoUrl) => set({ videoUrl }),
  setVideoStatus: (videoStatus) => set({ videoStatus }),

  setOutputId: (outputId) => set({ outputId }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
