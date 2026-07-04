"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "@/app/actions/settings";
import { updateManagedElderPassword } from "@/app/actions/elder-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface PasswordFormProps {
  elderId?: string;
  managedByCaregiver?: boolean;
}

export function PasswordForm({ elderId, managedByCaregiver = false }: PasswordFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = elderId
        ? await updateManagedElderPassword(elderId, formData)
        : await updatePassword(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(
        managedByCaregiver
          ? "Contraseña del adulto mayor actualizada"
          : "Contraseña actualizada correctamente"
      );
      e.currentTarget.reset();
    });
  }

  const inputClass =
    "w-full rounded-xl border-2 border-care-secondary/60 bg-white px-4 py-3 text-care-foreground outline-none focus:border-care-accent-dark";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-care-accent-dark" />
          {managedByCaregiver ? "Contraseña de acceso" : "Cambiar contraseña"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {managedByCaregiver && (
          <p className="mb-4 text-sm text-care-muted">
            Solo tú como responsable puedes restablecer la contraseña de acceso al portal.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold">
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-semibold">
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={pending} className="h-11 text-base">
            {pending ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
