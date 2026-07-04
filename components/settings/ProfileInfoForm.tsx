"use client";

import { useState, useTransition } from "react";
import { updateProfileInfo } from "@/app/actions/settings";
import { updateManagedElderProfile } from "@/app/actions/elder-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProfileInfoFormProps {
  fullName: string;
  phone: string | null;
  bio: string | null;
  email: string;
  elderId?: string;
  managedByCaregiver?: boolean;
}

export function ProfileInfoForm({
  fullName: initialName,
  phone: initialPhone,
  bio: initialBio,
  email,
  elderId,
  managedByCaregiver = false,
}: ProfileInfoFormProps) {
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!fullName.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    startTransition(async () => {
      try {
        if (elderId) {
          await updateManagedElderProfile(elderId, { fullName, phone, bio });
        } else {
          await updateProfileInfo({ fullName, phone, bio });
        }
        setMessage("Perfil guardado correctamente");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border-2 border-care-secondary/60 bg-white px-4 py-3 text-care-foreground outline-none transition-colors focus:border-care-accent-dark";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información personal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-care-foreground">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              disabled
              className={cn(inputClass, "cursor-not-allowed bg-care-primary/50 text-care-muted")}
            />
            <p className="mt-1 text-xs text-care-muted">
              {managedByCaregiver
                ? "Correo de acceso al portal del adulto mayor."
                : "El correo no se puede cambiar desde aquí."}
            </p>
          </div>

          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-semibold text-care-foreground">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-care-foreground">
              Teléfono de contacto
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 55 1234 5678"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="bio" className="mb-1 block text-sm font-semibold text-care-foreground">
              {managedByCaregiver ? "Notas y preferencias" : "Notas sobre ti como cuidador"}
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder={
                managedByCaregiver
                  ? "Gustos, hobbies, preferencias, datos relevantes..."
                  : "Experiencia, relación con las personas a tu cuidado..."
              }
              className={cn(inputClass, "resize-none")}
            />
          </div>

          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={pending} className="h-11 text-base">
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
