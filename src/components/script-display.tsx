"use client";

import * as React from "react";
import { Quote, MessageSquare, Target, Copy, Check, Edit3 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { UgcScript } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export interface ScriptDisplayProps {
  script: UgcScript | null;
  onScriptChange?: (script: UgcScript) => void;
  className?: string;
}

const SECTION_META = {
  hook: {
    icon: Quote,
    label: "Hook",
    description: "Attention-grabbing opening line",
    accent: "border-l-amber-500 dark:border-l-amber-400",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  narration: {
    icon: MessageSquare,
    label: "Narasi",
    description: "Main narrative body",
    accent: "border-l-blue-500 dark:border-l-blue-400",
    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  cta: {
    icon: Target,
    label: "CTA",
    description: "Call to action",
    accent: "border-l-emerald-500 dark:border-l-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
} as const;

function ScriptSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-4 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ScriptDisplay({ script, onScriptChange, className }: ScriptDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  if (!script) {
    return <ScriptSkeleton />;
  }

  const handleChange = (field: keyof UgcScript, value: string) => {
    if (!onScriptChange) return;
    const next = { ...script, [field]: value };
    next.fullScript = [next.hook, next.narration, next.cta]
      .filter(Boolean)
      .join("\n\n");
    onScriptChange(next);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script.fullScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = script.fullScript;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sections: Array<{ key: keyof UgcScript; icon: React.ElementType; label: string; description: string; accent: string; badge: string }> = [
    { ...SECTION_META.hook, key: "hook" },
    { ...SECTION_META.narration, key: "narration" },
    { ...SECTION_META.cta, key: "cta" },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Script UGC</h2>
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
              Salin Script
            </>
          )}
        </button>
      </div>

      {sections.map(({ key, icon: Icon, label, description, accent, badge }, idx) => (
        <Card
          key={key}
          className={cn(
            "overflow-hidden border-l-2 transition-all duration-300",
            accent,
            "animate-in fade-in slide-in-from-bottom-2",
            idx === 0 && "duration-300",
            idx === 1 && "duration-500",
            idx === 2 && "duration-700",
          )}
          style={{ animationFillMode: "backwards" }}
        >
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium leading-none">{label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </div>
              <Badge variant="outline" className={cn("shrink-0 border-none font-mono text-xs", badge)}>
                <Edit3 className="mr-1 h-3 w-3" />
                {script[key].length} karakter
              </Badge>
            </div>

            {key === "narration" ? (
              <Textarea
                value={script[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={`Tulis ${label} di sini...`}
                className="min-h-[160px] resize-y text-sm leading-relaxed"
              />
            ) : (
              <Textarea
                value={script[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={`Tulis ${label} di sini...`}
                className="min-h-[80px] resize-y text-sm leading-relaxed"
              />
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="overflow-hidden border-dashed">
        <CardContent className="space-y-2 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Full Script Preview</span>
            <Badge variant="outline" className="font-mono text-xs">
              {script.fullScript.length} karakter
            </Badge>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {script.fullScript || "Belum ada script"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
