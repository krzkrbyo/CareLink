"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { playBase64Audio } from "@/lib/voice-chat/play-audio";

export type ChatRole = "user" | "assistant";
export type ChatStatus = "idle" | "recording" | "processing" | "speaking";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface VoiceChatContextValue {
  elderName: string;
  messages: ChatMessage[];
  status: ChatStatus;
  error: string;
  isOpen: boolean;
  recordingSupported: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  toggleRecording: () => void;
  statusLabel: string;
}

const VoiceChatContext = createContext<VoiceChatContextValue | null>(null);

function getRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return types.find((t) => MediaRecorder.isTypeSupported(t));
}

const STATUS_LABELS: Record<ChatStatus, string> = {
  idle: "Presione para hablar con su tortuguita",
  recording: "Escuchando… Toque para enviar",
  processing: "Su tortuguita está pensando…",
  speaking: "Su tortuguita le está respondiendo…",
};

export function VoiceChatProvider({
  elderName,
  children,
}: {
  elderName: string;
  children: ReactNode;
}) {
  const firstName = elderName.split(" ")[0];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hola, ${firstName}. Soy su tortuguita de CareLink. Presione el micrófono y hable conmigo.`,
    },
  ]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState("");
  const [isOpen, setOpen] = useState(false);
  const [recordingSupported, setRecordingSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setRecordingSupported(
      typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const addMessage = useCallback((role: ChatRole, content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${role}-${Date.now()}`, role, content },
    ]);
  }, []);

  const processRecording = useCallback(
    async (blob: Blob, mimeType: string) => {
      setError("");
      setStatus("processing");

      const formData = new FormData();
      formData.append("audio", blob, mimeType.includes("mp4") ? "recording.mp4" : "recording.webm");

      const history = messagesRef.current
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      formData.append("history", JSON.stringify(history));

      const res = await fetch("/api/voice-chat/turn", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "No pude completar la conversación");
      }

      addMessage("user", data.userText as string);
      addMessage("assistant", data.reply as string);

      setStatus("speaking");
      await playBase64Audio(data.audioBase64 as string, data.audioMimeType as string);
      setStatus("idle");
    },
    [addMessage]
  );

  const startRecording = useCallback(async () => {
    setError("");
    chunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;

    const mimeType = getRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stopStream();
      const type = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });

      void processRecording(blob, type).catch((err) => {
        setError(err instanceof Error ? err.message : "Ocurrió un error");
        setStatus("idle");
      });
    };

    recorder.start(200);
    setStatus("recording");
  }, [processRecording, stopStream]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    mediaRecorderRef.current = null;
  }, []);

  const toggleRecording = useCallback(() => {
    if (status === "recording") {
      stopRecording();
      return;
    }
    if (status !== "idle") return;

    void startRecording().catch(() => {
      setError("No pude acceder al micrófono. Verifique los permisos.");
      setStatus("idle");
    });
  }, [startRecording, status, stopRecording]);

  const toggleOpen = useCallback(() => setOpen((v) => !v), []);

  return (
    <VoiceChatContext.Provider
      value={{
        elderName,
        messages,
        status,
        error,
        isOpen,
        recordingSupported,
        setOpen,
        toggleOpen,
        toggleRecording,
        statusLabel: STATUS_LABELS[status],
      }}
    >
      {children}
    </VoiceChatContext.Provider>
  );
}

export function useVoiceChat() {
  const ctx = useContext(VoiceChatContext);
  if (!ctx) {
    throw new Error("useVoiceChat debe usarse dentro de VoiceChatProvider");
  }
  return ctx;
}
