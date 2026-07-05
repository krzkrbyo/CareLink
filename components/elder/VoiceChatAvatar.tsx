"use client";

import { useEffect, useRef } from "react";
import type { ChatStatus } from "@/components/elder/voice-chat-context";
import { cn } from "@/lib/utils";

export const VOICE_CHAT_AVATAR_SRC = "/avatar/tortuga.mp4";

type AvatarVariant = "featured" | "banner" | "fab" | "corner";

interface VoiceChatAvatarProps {
  status: ChatStatus;
  variant?: AvatarVariant;
  className?: string;
}

export function VoiceChatAvatar({
  status,
  variant = "banner",
  className,
}: VoiceChatAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSpeaking = status === "speaking";
  const isListening = status === "recording";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isSpeaking) {
      video.currentTime = 0;
      void video.play().catch(() => {});
      return;
    }

    video.pause();
    video.currentTime = 0;
  }, [isSpeaking]);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-care-primary/30",
        variant === "featured" && "aspect-video w-full max-h-72",
        variant === "banner" && "aspect-video w-full max-h-44",
        variant === "corner" && "shrink-0",
        variant === "fab" && "h-full w-full",
        className
      )}
    >
      <video
        ref={videoRef}
        src={VOICE_CHAT_AVATAR_SRC}
        muted
        playsInline
        loop
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden
      />

      {isSpeaking && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-care-accent-dark/90 via-care-accent-dark/40 to-transparent",
            variant === "corner" ? "px-1 pb-1 pt-4" : "px-3 pb-2 pt-8"
          )}
        >
          <p
            className={cn(
              "text-center font-semibold text-white",
              variant === "corner" ? "text-[10px] leading-tight" : "text-sm"
            )}
          >
            {variant === "corner" ? "Hablando…" : "Hablando con usted…"}
          </p>
        </div>
      )}

      {isListening && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-care-foreground/70 via-care-foreground/30 to-transparent",
            variant === "corner" ? "px-1 pb-1 pt-4" : "px-3 pb-2 pt-8"
          )}
        >
          <p
            className={cn(
              "text-center font-semibold text-white",
              variant === "corner" ? "text-[10px] leading-tight" : "text-sm"
            )}
          >
            Escuchando…
          </p>
        </div>
      )}

      {variant !== "fab" && status === "processing" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center bg-care-foreground/10 pb-2">
          <span
            className={cn(
              "rounded-full bg-white/90 font-semibold text-care-muted shadow",
              variant === "corner" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
            )}
          >
            Pensando…
          </span>
        </div>
      )}
    </div>
  );
}
