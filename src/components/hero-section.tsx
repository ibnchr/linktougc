import * as React from "react";
import { Sparkles, Zap, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface HeroSectionProps {
  children?: React.ReactNode;
  className?: string;
}

export function HeroSection({ children, className }: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden pb-16 pt-20 md:pb-24 md:pt-28 lg:pb-32 lg:pt-36",
        className,
      )}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-pulse-glow absolute top-1/3 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-4xl px-4">
        <div className="flex flex-col items-center text-center">
          <div className="animate-fade-in-up stagger-1 mb-6 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              100% AI Generated
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Bahasa Indonesia
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <span className="font-mono text-[10px] font-bold">9:16</span>
              Format
            </Badge>
          </div>

          <h1 className="animate-fade-in-up stagger-2 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            <span>1 Link Produk</span>
            <ArrowRight className="mx-1.5 inline-block h-7 w-7 text-primary sm:mx-2 sm:h-9 sm:w-9 md:h-11 md:w-11" />
            <span>Video UGC Review</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Siap Viral
            </span>
          </h1>

          <p className="animate-fade-in-up stagger-3 mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            Ubah link produk Shopee / TikTok jadi video UGC review berkualitas
            dalam hitungan detik. 100% AI, 100% Bahasa Indonesia, format 9:16
            siap upload.
          </p>

          {children && (
            <div className="animate-fade-in-up stagger-4 mt-10 w-full max-w-lg">
              {children}
            </div>
          )}

          <div className="animate-fade-in-up stagger-5 mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-foreground sm:text-3xl">
                10K+
              </span>
              <span className="text-xs text-muted-foreground sm:text-sm">
                Video Generated
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-foreground sm:text-3xl">
                98%
              </span>
              <span className="text-xs text-muted-foreground sm:text-sm">
                Kepuasan User
              </span>
            </div>
            <div className="col-span-2 flex flex-col items-center gap-1 sm:col-span-1">
              <span className="text-2xl font-bold text-foreground sm:text-3xl">
                5 Detik
              </span>
              <span className="text-xs text-muted-foreground sm:text-sm">
                Proses Cepat
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
