"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createElderAndLink } from "@/app/actions/caregiver";
import { elderCarePath } from "@/lib/elders/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AddElderForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const password = form.get("elderPassword") as string;
    const confirm = form.get("confirmPassword") as string;

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createElderAndLink({
          fullName: form.get("fullName") as string,
          age: Number(form.get("age")) || undefined,
          relationship: form.get("relationship") as string,
          emergencyContact: (form.get("emergencyContact") as string) || undefined,
          elderEmail: form.get("elderEmail") as string,
          elderPassword: password,
        });
        setSuccess(
          `Persona registrada. Acceso: ${result.elderEmail}`
        );
        router.refresh();
        setTimeout(() => {
          router.push(elderCarePath(result.elderSlug, "dashboard"));
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar persona a cargo</CardTitle>
        <p className="text-sm text-care-muted">
          Registre los datos del adulto mayor y cree su acceso al portal
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-care-foreground">
              Datos personales
            </legend>
            <Input
              name="fullName"
              required
              placeholder="Nombre completo"
            />
            <Input
              name="age"
              type="number"
              min={1}
              max={120}
              placeholder="Edad"
            />
            <Input
              name="relationship"
              required
              placeholder="Relación contigo (ej: padre, madre, tío)"
            />
            <Input
              name="emergencyContact"
              placeholder="Contacto de emergencia (opcional)"
            />
          </fieldset>

          <fieldset className="space-y-3 rounded-xl border-2 border-care-accent/30 bg-care-secondary/20 p-4">
            <legend className="px-1 text-sm font-semibold text-care-foreground">
              Acceso al portal del adulto mayor
            </legend>
            <p className="text-xs text-care-muted">
              Estas credenciales las usará la persona para entrar a su portal en{" "}
              <strong>/adulto</strong>
            </p>
            <Input
              name="elderEmail"
              type="email"
              required
              autoComplete="off"
              placeholder="Correo electrónico"
            />
            <Input
              name="elderPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Contraseña (mínimo 8 caracteres)"
            />
            <Input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Confirmar contraseña"
            />
          </fieldset>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{success}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando persona y cuenta..." : "Registrar persona y cuenta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
