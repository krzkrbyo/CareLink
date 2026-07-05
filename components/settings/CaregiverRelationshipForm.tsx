"use client";

import { useState, useTransition } from "react";
import { updateManagedElderRelationship } from "@/app/actions/elder-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CaregiverRelationshipFormProps {
  elderId: string;
  relationship: string | null;
}

export function CaregiverRelationshipForm({
  elderId,
  relationship: initialRelationship,
}: CaregiverRelationshipFormProps) {
  const [relationship, setRelationship] = useState(initialRelationship ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    startTransition(async () => {
      try {
        await updateManagedElderRelationship(elderId, relationship);
        setMessage("Rol actualizado correctamente");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu rol con esta persona</CardTitle>
        <p className="text-sm text-care-muted">
          Cómo se describe usted ante el adulto mayor. El portal y el asistente de voz usarán esto
          para hablar de usted (por ejemplo: «Ana es su hija» o «Carlos es su enfermero»).
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="managed-elder-relationship"
              className="mb-1 block text-sm font-semibold text-care-foreground"
            >
              ¿Qué eres para esta persona?
            </label>
            <Input
              id="managed-elder-relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              required
              placeholder="Ej: hija, enfermera, enfermero, cuidador, asistente"
            />
            <p className="mt-1 text-xs text-care-muted">
              Escríbalo como lo diría el adulto mayor: parentesco, rol profesional u otra persona de
              confianza.
            </p>
          </div>

          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={pending} className="h-11 text-base">
            {pending ? "Guardando..." : "Guardar rol"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
