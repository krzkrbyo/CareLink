"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { uploadAvatar, removeAvatar } from "@/app/actions/settings";
import {
  uploadManagedElderAvatar,
  removeManagedElderAvatar,
} from "@/app/actions/elder-settings";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  name: string;
  avatarUrl: string | null;
  elderId?: string;
}

export function AvatarUpload({ name, avatarUrl: initialUrl, elderId }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      try {
        const result = elderId
          ? await uploadManagedElderAvatar(elderId, formData)
          : await uploadAvatar(formData);
        setAvatarUrl(result.avatarUrl);
        setMessage("Foto actualizada correctamente");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir la imagen");
      }
    });

    e.target.value = "";
  }

  function handleRemove() {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        if (elderId) {
          await removeManagedElderAvatar(elderId);
        } else {
          await removeAvatar();
        }
        setAvatarUrl(null);
        setMessage("Foto eliminada");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative">
        <UserAvatar name={name} avatarUrl={avatarUrl} size="xl" />
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 text-center sm:text-left">
        <div>
          <p className="font-semibold text-care-foreground">Foto de perfil</p>
          <p className="text-sm text-care-muted">JPG, PNG o WebP. Máximo 3 MB.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="care-file hidden"
            onChange={handleFileChange}
            disabled={pending}
          />
          <Button
            type="button"
            variant="outline"
            size="default"
            className="h-11 text-base"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
          >
            <Camera className="h-4 w-4" />
            {avatarUrl ? "Cambiar foto" : "Subir foto"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="default"
              className="h-11 text-base text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleRemove}
              disabled={pending}
            >
              <Trash2 className="h-4 w-4" />
              Quitar
            </Button>
          )}
        </div>

        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
