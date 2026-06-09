import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Sparkles, Loader2 } from "lucide-react";

import { cn, detectPlatform } from "@/lib/utils";
import { linkSchema, type LinkSchema } from "@/lib/validations";
import { useAppStore } from "@/store/use-store";
import { Button } from "@/components/ui/button";

const EXAMPLE_LINKS = [
  { label: "shopee.co.id/...produk", url: "https://shopee.co.id/product/123456789/987654321" },
  { label: "tiktok.com/...product", url: "https://www.tiktok.com/@shop/video/1234567890123456789" },
];

export interface LinkInputProps {
  onSubmit: (url: string) => void;
}

export function LinkInput({ onSubmit }: LinkInputProps) {
  const { url: storeUrl, setUrl } = useAppStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LinkSchema>({
    resolver: zodResolver(linkSchema),
    defaultValues: { url: storeUrl },
  });

  const watchedUrl = watch("url");
  const platform = detectPlatform(watchedUrl || "");

  const handleFormSubmit = (data: LinkSchema) => {
    setUrl(data.url);
    onSubmit(data.url);
  };

  const handleExampleClick = (exampleUrl: string) => {
    setValue("url", exampleUrl, { shouldValidate: true });
    setUrl(exampleUrl);
  };

  const { ref, ...registerRest } = register("url");

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full space-y-3">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Link className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          {...registerRest}
          ref={ref}
          type="url"
          placeholder="Tempel link produk Shopee atau TikTok Shop di sini..."
          className={cn(
            "flex h-14 w-full rounded-xl border-2 border-input bg-background pl-11 pr-4 text-base shadow-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            errors.url && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {platform !== "unknown" && watchedUrl && (
          <div className="absolute bottom-1.5 left-11">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                platform === "shopee"
                  ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                  : "bg-pink-500/15 text-pink-600 dark:text-pink-400",
              )}
            >
              {platform === "shopee" ? "Shopee" : "TikTok"}
            </span>
          </div>
        )}
      </div>

      {errors.url && (
        <p className="text-sm text-destructive">{errors.url.message}</p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full gap-2 text-base"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
        {isSubmitting ? "Memproses..." : "Generate UGC Video"}
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Contoh:</span>
        {EXAMPLE_LINKS.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => handleExampleClick(example.url)}
            className="inline-flex items-center rounded-full border border-input bg-secondary/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {example.label}
          </button>
        ))}
      </div>
    </form>
  );
}
