"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { IconBox } from "@/components/ui/icon-box";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center care-gradient-page p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <IconBox icon={UserPlus} tone="accent" size="xl" className="mx-auto mb-3" />
          <CardTitle className="text-3xl">Crear cuenta</CardTitle>
          <p className="text-care-muted">Únete a CareLink</p>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <FormField id="fullName" label="Nombre completo">
              <Input
                id="fullName"
                name="fullName"
                required
                placeholder="Ana García"
              />
            </FormField>
            <FormField id="email" label="Correo">
              <Input id="email" name="email" type="email" required />
            </FormField>
            <FormField id="password" label="Contraseña">
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
              />
            </FormField>
            <FormField id="role" label="Tipo de cuenta">
              <Select id="role" name="role">
                <option value="caregiver">Familiar / Cuidador</option>
                <option value="elder">Adulto mayor</option>
              </Select>
            </FormField>
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Creando..." : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-care-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-care-accent-dark underline">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
