"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { IconBox } from "@/components/ui/icon-box";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const portalLabel = redirect.includes("/adulto")
    ? "Portal adulto mayor"
    : redirect.includes("/cuidador")
      ? "Portal familiar"
      : "CareLink";

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("redirect", redirect);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center care-gradient-page p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <IconBox icon={Heart} tone="accent" size="xl" className="mx-auto mb-3" />
          <CardTitle className="text-3xl">CareLink</CardTitle>
          <p className="text-care-muted">Iniciar sesión · {portalLabel}</p>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <FormField id="email" label="Correo electrónico">
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="ana@carelink.app"
              />
            </FormField>
            <FormField id="password" label="Contraseña">
              <Input id="password" name="password" type="password" required />
            </FormField>
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-6 space-y-3 text-center text-sm text-care-muted">
            <p>
              ¿No tienes cuenta?{" "}
              <Link href="/signup" className="font-semibold text-care-accent-dark underline">
                Registrarse
              </Link>
            </p>
            <div className="rounded-xl bg-care-secondary/30 p-3 text-left text-xs">
              <p className="font-semibold text-care-foreground">Cuentas de demostración</p>
              <p className="mt-1">Cuidador: ana@carelink.app</p>
              <p>Adulto mayor: manuel@carelink.app</p>
              <p>Contraseña: CareLink2026!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
