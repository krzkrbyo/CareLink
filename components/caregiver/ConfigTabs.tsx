"use client";

import { useState, useTransition } from "react";
import {
  deleteMedication,
  deleteFoodRule,
  createFoodRule,
} from "@/app/actions/caregiver";
import { MedicationScheduleForm } from "@/components/caregiver/MedicationScheduleForm";
import { AppointmentScheduleForm } from "@/components/caregiver/AppointmentScheduleForm";
import { AppointmentList } from "@/components/caregiver/AppointmentList";
import { MedicalCatalogPanel } from "@/components/caregiver/MedicalCatalogPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CalendarClock, CalendarPlus, Pill, Salad, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBox } from "@/components/ui/icon-box";
import { formatMedicationScheduleSummary } from "@/lib/medications/schedule";
import type { Medication, Appointment, FoodRule } from "@/types/database";
import type { MedicalCatalog } from "@/lib/appointments/types";

interface ConfigTabsProps {
  elderId: string;
  medications: Medication[];
  appointments: Appointment[];
  foodRules: FoodRule[];
  catalog: MedicalCatalog;
}

const TABS = [
  {
    id: "medicamentos",
    label: "Medicamentos",
    description: "Horarios y dosis",
    icon: Pill,
  },
  {
    id: "citas",
    label: "Citas y exámenes",
    description: "Agenda médica",
    icon: CalendarClock,
  },
  {
    id: "alimentacion",
    label: "Alimentación",
    description: "Restricciones y recomendaciones",
    icon: Salad,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ConfigTabs({
  elderId,
  medications,
  appointments,
  foodRules,
  catalog,
}: ConfigTabsProps) {
  const [tab, setTab] = useState<TabId>("medicamentos");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  return (
    <div>
      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        {TABS.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all",
              tab === id
                ? "border-care-accent-dark bg-care-accent-dark text-white shadow-sm"
                : "border-care-secondary/50 bg-white text-care-muted hover:border-care-secondary hover:bg-care-primary"
            )}
          >
            <IconBox
              icon={Icon}
              tone={tab === id ? "muted" : "accent"}
              size="sm"
              className={tab === id ? "bg-white/20 text-white" : undefined}
            />
            <div>
              <p className="font-semibold">{label}</p>
              <p className={cn("text-xs", tab === id ? "text-white/80" : "text-care-muted-light")}>
                {description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-green-800">{message}</p>
      )}

      {tab === "medicamentos" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <MedicationScheduleForm elderId={elderId} onSuccess={setMessage} />
          <ItemList
            icon={Pill}
            items={medications.map((m) => ({
              id: m.id,
              title: m.name,
              subtitle: formatMedicationScheduleSummary(m),
              calendarHref: `/api/calendar/medication/${m.id}`,
            }))}
            onDelete={(id) =>
              startTransition(async () => {
                await deleteMedication(id, elderId);
                setMessage("Medicamento eliminado");
              })
            }
            pending={pending}
            emptyText="No hay medicamentos registrados todavía."
          />
        </div>
      )}

      {tab === "citas" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <AppointmentScheduleForm
              key={editingAppointment?.id ?? "new"}
              elderId={elderId}
              catalog={catalog}
              editing={editingAppointment}
              onSuccess={setMessage}
              onCancelEdit={() => setEditingAppointment(null)}
            />
            <AppointmentList
              elderId={elderId}
              appointments={appointments}
              editingId={editingAppointment?.id ?? null}
              onEdit={setEditingAppointment}
              onNew={() => setEditingAppointment(null)}
              onMessage={setMessage}
            />
          </div>
          <MedicalCatalogPanel elderId={elderId} catalog={catalog} onMessage={setMessage} />
        </div>
      )}

      {tab === "alimentacion" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Regla alimenticia</CardTitle>
              <p className="text-sm text-care-muted">
                Indique alimentos prohibidos, a reducir o recomendaciones.
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  startTransition(async () => {
                    await createFoodRule(elderId, {
                      label: fd.get("label") as string,
                      type: fd.get("type") as FoodRule["type"],
                    });
                    setMessage("Regla alimenticia agregada");
                    e.currentTarget.reset();
                  });
                }}
                className="space-y-3"
              >
                <Select name="type">
                  <option value="prohibited">Prohibido</option>
                  <option value="reduce">Reducir</option>
                  <option value="recommendation">Recomendación</option>
                  <option value="allergen">Alérgeno</option>
                </Select>
                <Input name="label" required placeholder="Ej: sal, tortillas, lácteos" />
                <Button type="submit" disabled={pending} className="w-full">
                  Guardar regla
                </Button>
              </form>
            </CardContent>
          </Card>
          <ItemList
            icon={Salad}
            items={foodRules.map((f) => ({
              id: f.id,
              title: f.label,
              subtitle: f.type,
            }))}
            onDelete={(id) =>
              startTransition(async () => {
                await deleteFoodRule(id, elderId);
                setMessage("Regla eliminada");
              })
            }
            pending={pending}
            emptyText="No hay reglas alimenticias registradas."
          />
        </div>
      )}
    </div>
  );
}

function ItemList({
  icon,
  items,
  onDelete,
  pending,
  emptyText,
}: {
  icon: LucideIcon;
  items: { id: string; title: string; subtitle: string; calendarHref?: string }[];
  onDelete: (id: string) => void;
  pending: boolean;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-care-muted">
          <IconBox icon={icon} tone="muted" size="lg" />
          <p>{emptyText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <IconBox icon={icon} tone="accent" size="sm" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-care-foreground">{item.title}</p>
                <p className="truncate text-sm text-care-muted">{item.subtitle}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {item.calendarHref && (
                <a
                  href={item.calendarHref}
                  className="rounded-lg p-2 text-care-accent-dark hover:bg-care-primary"
                  aria-label={`Exportar ${item.title} al calendario`}
                  title="Exportar al calendario"
                >
                  <CalendarPlus className="h-5 w-5" />
                </a>
              )}
              <button
                onClick={() => onDelete(item.id)}
                disabled={pending}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                aria-label={`Eliminar ${item.title}`}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
