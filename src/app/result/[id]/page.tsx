"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-store";
import { VideoPlayer } from "@/components/video-player";
import { ScriptDisplay } from "@/components/script-display";
import { CaptionDisplay } from "@/components/caption-display";
import { ProductPreview } from "@/components/product-preview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { UgcOutput } from "@/types";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const [output, setOutput] = useState<UgcOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setProduct, setScript, setCaption, setVideoUrl } = useAppStore();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/result/${params.id}`);
        if (!res.ok) {
          throw new Error("Hasil tidak ditemukan");
        }
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Gagal memuat hasil");
        }
        setOutput(data.output);
        setProduct(data.output.product);
        setScript(data.output.script);
        setCaption(data.output.caption);
        if (data.output.videoUrl) {
          setVideoUrl(data.output.videoUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [params.id, setProduct, setScript, setCaption, setVideoUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-[9/16] w-full max-w-sm mx-auto rounded-xl" />
            </div>
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !output) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Hasil Tidak Ditemukan</h1>
          <p className="text-muted-foreground">
            {error || "Link hasil tidak valid atau sudah kadaluarsa."}
          </p>
          <Button onClick={() => router.push("/")} variant="default">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Hasil UGC Video</h1>
              <p className="text-sm text-muted-foreground">
                ID: {output.id}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate Ulang
          </Button>
        </div>

        {/* Product Preview */}
        <ProductPreview product={output.product} />

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Video */}
          <div className="lg:col-span-2">
            <VideoPlayer
              videoUrl={output.videoUrl || null}
              title={output.product.title}
            />
          </div>

          {/* Right: Script + Caption */}
          <div className="lg:col-span-3 space-y-6">
            <ScriptDisplay script={output.script} />
            <CaptionDisplay caption={output.caption} />
          </div>
        </div>

        {/* Prompt Used */}
        {output.promptUsed && <PromptPanel prompt={output.promptUsed} />}
      </div>
    </main>
  );
}

function PromptPanel({ prompt }: { prompt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="py-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Prompt yang dikirim ke Gemini
          </CardTitle>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent>
          <pre className="text-xs whitespace-pre-wrap break-words bg-muted p-4 rounded-lg max-h-96 overflow-y-auto font-mono">
            {prompt}
          </pre>
        </CardContent>
      )}
    </Card>
  );
}
