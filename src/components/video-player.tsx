"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  Maximize,
  Film,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface VideoPlayerProps {
  videoUrl: string | null;
  title: string;
  className?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[9/16] bg-muted">
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Film className="h-12 w-12 text-muted-foreground/30" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
      <div className="flex items-center justify-between p-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </Card>
  );
}

function VideoError({ title }: { title: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[9/16] bg-muted">
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Film className="h-12 w-12 text-destructive/60" />
            <p className="text-sm text-muted-foreground">
              Failed to load video for &ldquo;{title}&rdquo;
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VideoPlayer({ videoUrl, title, className }: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const progressRef = React.useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (!videoUrl) {
    return <VideoSkeleton />;
  }

  if (hasError) {
    return <VideoError title={title} />;
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoaded(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div
          className="group relative mx-auto aspect-[9/16] max-w-sm cursor-pointer overflow-hidden bg-black"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-contain"
            preload="metadata"
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onError={() => setHasError(true)}
          />

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300",
              isPlaying ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-105">
              <Play className="ml-1 h-8 w-8 fill-black text-black" />
            </div>
          </div>

          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={progressRef}
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleProgressChange}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />

            <div className="mt-2 flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="rounded p-1 transition-colors hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded p-1 transition-colors hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span>{formatTime(currentTime)}</span>
                <span className="opacity-50">/</span>
                <span className="opacity-70">
                  {isLoaded ? formatTime(duration) : "--:--"}
                </span>
                <button
                  type="button"
                  onClick={() => videoRef.current?.requestFullscreen()}
                  className="rounded p-1 transition-colors hover:bg-white/20"
                >
                  <Maximize className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <div className="flex items-center justify-between gap-2 p-3">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {title}
        </p>
        <a
          href={videoUrl}
          download
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
    </Card>
  );
}
