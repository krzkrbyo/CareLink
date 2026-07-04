"use client";

import { useState, useTransition } from "react";
import {
  deleteFacility,
  deleteProfessional,
  updateFacility,
  updateProfessional,
} from "@/app/actions/medical-catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FACILITY_TYPE_LABELS, type MedicalCatalog } from "@/lib/appointments/types";
import { Building2, Stethoscope, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface MedicalCatalogPanelProps {
  elderId: string;
  catalog: MedicalCatalog;
  onMessage?: (msg: string) => void;
}

export function MedicalCatalogPanel({ elderId, catalog, onMessage }: MedicalCatalogPanelProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Administrar lugares y doctores</CardTitle>
            <p className="text-sm text-care-muted">
              {catalog.facilities.length} lugares · {catalog.professionals.length} doctores guardados
            </p>
          </div>
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <CatalogSection
            title="Lugares médicos"
            icon={Building2}
            empty="No hay lugares guardados."
            items={catalog.facilities.map((f) => ({
              id: f.id,
              primary: f.name,
              secondary: [FACILITY_TYPE_LABELS[f.type], f.address, f.phone].filter(Boolean).join(" · "),
              onSave: (primary: string, secondary: string) => {
                const [typeLabel, ...rest] = secondary.split(" · ");
                const typeEntry = Object.entries(FACILITY_TYPE_LABELS).find(([, l]) => l === typeLabel);
                startTransition(async () => {
                  await updateFacility(f.id, elderId, {
                    name: primary,
                    type: (typeEntry?.[0] as keyof typeof FACILITY_TYPE_LABELS) ?? f.type,
                    address: rest[0] ?? "",
                    phone: rest[1] ?? "",
                  });
                  onMessage?.("Lugar actualizado");
                });
              },
              onDelete: () =>
                startTransition(async () => {
                  await deleteFacility(f.id, elderId);
                  onMessage?.("Lugar eliminado");
                }),
            }))}
            pending={pending}
          />
          <CatalogSection
            title="Doctores"
            icon={Stethoscope}
            empty="No hay doctores guardados."
            items={catalog.professionals.map((p) => ({
              id: p.id,
              primary: p.full_name,
              secondary: [p.specialty, p.phone].filter(Boolean).join(" · "),
              onSave: (primary: string, secondary: string) => {
                const [specialty, phone] = secondary.split(" · ");
                startTransition(async () => {
                  await updateProfessional(p.id, elderId, {
                    fullName: primary,
                    specialty: specialty ?? "",
                    phone: phone ?? "",
                  });
                  onMessage?.("Doctor actualizado");
                });
              },
              onDelete: () =>
                startTransition(async () => {
                  await deleteProfessional(p.id, elderId);
                  onMessage?.("Doctor eliminado");
                }),
            }))}
            pending={pending}
          />
        </CardContent>
      )}
    </Card>
  );
}

function CatalogSection({
  title,
  icon: Icon,
  empty,
  items,
  pending,
}: {
  title: string;
  icon: typeof Building2;
  empty: string;
  items: {
    id: string;
    primary: string;
    secondary: string;
    onSave: (primary: string, secondary: string) => void;
    onDelete: () => void;
  }[];
  pending: boolean;
}) {
  if (items.length === 0) {
    return (
      <div>
        <h4 className="mb-2 flex items-center gap-2 font-semibold text-care-foreground">
          <Icon className="h-4 w-4" /> {title}
        </h4>
        <p className="text-sm text-care-muted">{empty}</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 font-semibold text-care-foreground">
        <Icon className="h-4 w-4" /> {title}
      </h4>
      <div className="space-y-2">
        {items.map((item) => (
          <CatalogItem key={item.id} item={item} pending={pending} />
        ))}
      </div>
    </div>
  );
}

function CatalogItem({
  item,
  pending,
}: {
  item: {
    id: string;
    primary: string;
    secondary: string;
    onSave: (primary: string, secondary: string) => void;
    onDelete: () => void;
  };
  pending: boolean;
}) {
  const [primary, setPrimary] = useState(item.primary);
  const [secondary, setSecondary] = useState(item.secondary);

  return (
    <div className="rounded-xl border border-care-secondary/50 p-3">
      <Input
        value={primary}
        onChange={(e) => setPrimary(e.target.value)}
        className="mb-2 text-base"
      />
      <Input
        value={secondary}
        onChange={(e) => setSecondary(e.target.value)}
        className="mb-2 text-sm"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="default"
          className="h-9 flex-1 text-sm"
          disabled={pending}
          onClick={() => item.onSave(primary, secondary)}
        >
          Guardar
        </Button>
        <button
          type="button"
          onClick={item.onDelete}
          disabled={pending}
          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
          aria-label="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
