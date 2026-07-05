"use client";

import { VoiceChatAvatar } from "@/components/elder/VoiceChatAvatar";
import { VoiceChatPanel } from "@/components/elder/VoiceChatPanel";
import { useVoiceChat } from "@/components/elder/voice-chat-context";
import { cn } from "@/lib/utils";

export function VoiceChatFloating() {
  const { isOpen, setOpen, toggleOpen, status } = useVoiceChat();
  const isActive = status !== "idle";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-care-foreground/25 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-24 right-4 z-[70] flex flex-col items-end gap-3 lg:bottom-6">
        {isOpen && (
          <div
            className="w-[min(100vw-2rem,22rem)] overflow-hidden rounded-3xl border-2 border-care-secondary/60 shadow-2xl lg:w-[26rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <VoiceChatPanel variant="floating" onClose={() => setOpen(false)} />
          </div>
        )}

        <button
          type="button"
          onClick={toggleOpen}
          aria-label={isOpen ? "Cerrar acompañante" : "Abrir acompañante de voz"}
          className={cn(
            "relative h-16 w-16 overflow-hidden rounded-full shadow-lg transition-transform active:scale-95",
            isOpen && "ring-4 ring-care-accent/40",
            isActive && !isOpen && "animate-pulse ring-4 ring-red-300"
          )}
        >
          <VoiceChatAvatar status={status} variant="fab" />
          <span className="sr-only">
            {isOpen ? "Cerrar tortuguita acompañante" : "Abrir tortuguita acompañante"}
          </span>
        </button>
      </div>
    </>
  );
}
