"use client";

import * as React from "react";
import { useState } from "react";
import { RefreshCw, AlertCircle, Sparkles } from "lucide-react";

import { useAppStore } from "@/store/use-store";
import { HeroSection } from "@/components/hero-section";
import { LinkInput } from "@/components/link-input";
import { ProgressSteps } from "@/components/progress-steps";
import { ProductPreview } from "@/components/product-preview";
import { ScriptDisplay } from "@/components/script-display";
import { CaptionDisplay } from "@/components/caption-display";
import { VideoPlayer } from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import type { ScrapeResult, GenerateResult } from "@/types";

export default function HomePage() {
  const [mode, setMode] = useState<"input" | "result">("input");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    step,
    product,
    script,
    caption,
    videoUrl,
    error,
    setUrl,
    setProgress,
    setProduct,
    setScript,
    setCaption,
    setVideoUrl,
    setVideoStatus,
    setOutputId,
    setError,
    reset,
  } = useAppStore();

  const handleGenerate = async (url: string) => {
    setMode("result");
    setIsProcessing(true);
    setError(null);
    setProduct(null);
    setScript(null);
    setCaption(null);
    setVideoUrl(null);
    setVideoStatus("pending");
    setOutputId(null);

    setProgress("scraping", "Mengambil data produk...", 10);

    try {
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const scrapeData: ScrapeResult = await scrapeRes.json();

      if (!scrapeData.success || !scrapeData.product) {
        throw new Error(scrapeData.error || "Gagal mengambil data produk");
      }

      setProduct(scrapeData.product);
      setProgress("analyzing", "Menganalisis produk dengan AI...", 40);

      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: scrapeData.product }),
      });
      const generateData: GenerateResult = await generateRes.json();

      if (!generateData.success || !generateData.output) {
        throw new Error(generateData.error || "Gagal menghasilkan konten");
      }

      const { output } = generateData;

      setScript(output.script);
      setCaption(output.caption);
      setProgress("scripting", "Membuat script UGC...", 70);

      if (output.videoUrl) {
        setVideoUrl(output.videoUrl);
        setVideoStatus(output.videoStatus);
        setProgress("rendering", "Merender video...", 90);
      }

      setOutputId(output.id);
      setProgress("completed", "Video siap!", 100);
      toast({ title: "Berhasil!", description: "Video UGC berhasil dibuat" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
      setProgress("failed", message, 0);
      toast({ title: "Gagal", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    reset();
    setMode("input");
  };

  const hasOutput = script !== null;

  return (
    <main className="relative min-h-screen">
      {mode === "input" ? (
        <HeroSection>
          <LinkInput onSubmit={handleGenerate} />
        </HeroSection>
      ) : (
        <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
          <div className="space-y-8">
            <ProgressSteps />

            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                  <p className="min-w-0 flex-1 text-sm font-medium text-destructive">
                    {error}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate(useAppStore.getState().url)}
                    disabled={isProcessing}
                    className="shrink-0 gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Coba Lagi
                  </Button>
                </CardContent>
              </Card>
            )}

            {product && <ProductPreview product={product} />}

            {hasOutput && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <VideoPlayer
                    videoUrl={videoUrl}
                    title={product?.title ?? "UGC Video"}
                  />
                </div>
                <div className="space-y-6 lg:col-span-3">
                  <ScriptDisplay script={script} />
                  <CaptionDisplay caption={caption} />
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleReset}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Ulang
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-border/40 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by Gemini &amp; Veo 3.1
        </p>
      </footer>
    </main>
  );
}
