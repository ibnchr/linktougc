"use client";

import * as React from "react";
import { Hash, Copy, Check, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { UgcCaption } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_CHARS = 150;

export interface CaptionDisplayProps {
  caption: UgcCaption | null;
  className?: string;
}

function CaptionSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-18 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CaptionDisplay({ caption, className }: CaptionDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  if (!caption) {
    return <CaptionSkeleton />;
  }

  const charCount = caption.full.length;
  const percent = Math.min((charCount / MAX_CHARS) * 100, 100);

  const progressColor =
    charCount > MAX_CHARS
      ? "bg-red-500"
      : charCount > MAX_CHARS * 0.8
        ? "bg-yellow-500"
        : "bg-green-500";

  const textColor =
    charCount > MAX_CHARS
      ? "text-red-500"
      : charCount > MAX_CHARS * 0.8
        ? "text-yellow-500"
        : "text-green-500";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption.full);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = caption.full;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast({ title: "Copy berhasil!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHashtagClick = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = tag;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    toast({ title: `Hashtag ${tag} disalin!` });
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Caption & Hashtag</h2>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy All
              </>
            )}
          </button>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">
          {caption.full}
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Karakter</span>
            <span className={cn("font-mono font-medium", textColor)}>
              {charCount}/{MAX_CHARS}
              {charCount > MAX_CHARS && (
                <AlertTriangle className="ml-1 inline h-3 w-3 align-text-top" />
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className={cn("h-full transition-all duration-300", progressColor)}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {caption.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {caption.hashtags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer transition-colors hover:bg-secondary/60"
                onClick={() => handleHashtagClick(tag)}
              >
                <Hash className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
