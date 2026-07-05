"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteManagedElder } from "@/app/actions/elder-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface DeleteElderSectionProps {
  elderId: string;
  elderName: string;
}

export function DeleteElderSection({ elderId, elderName }: DeleteElderSectionProps) {
  const router = useRouter();
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const canDelete = confirmName.trim() === elderName.trim();

  function handleDelete() {
    setError("");
    if (!canDelete) {
      setError("Escriba el nombre exacto para confirmar");
      return;
    }

    startTransition(async () => {
      try {
        await deleteManagedElder(elderId);
        router.push("/cuidador");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo eliminar");
      }
    });
  }

  return (
    <Card className="border-red-200 bg-red-50/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <CardTitle className="text-red-800">Eliminar persona a cargo</CardTitle>
            <p className="mt-1 text-sm text-red-700/90">
              Se borrarán su perfil, medicamentos, citas, reglas alimenticias, recordatorios y la
              cuenta de acceso al portal. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="confirm-delete-elder" className="mb-1 block text-sm font-semibold text-red-900">
            Escriba <strong>{elderName}</strong> para confirmar
          </label>
          <Input
            id="confirm-delete-elder"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={elderName}
            autoComplete="off"
            className="border-red-200 bg-white"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button
          type="button"
          variant="destructive"
          disabled={pending || !canDelete}
          onClick={handleDelete}
          className="h-11"
        >
          {pending ? "Eliminando..." : "Eliminar persona y todos sus datos"}
        </Button>
      </CardContent>
    </Card>
  );
}
