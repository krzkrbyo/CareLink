"use client";

import { useState, useTransition } from "react";
import {
  deleteAppointment,
  updateAppointmentStatus,
} from "@/app/actions/caregiver";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { Select } from "@/components/ui/select";
import {
  buildAppointmentSubtitle,
  STATUS_LABELS,
  APPOINTMENT_STATUSES,
  EXAM_SUBTYPE_LABELS,
  type AppointmentStatus,
} from "@/lib/appointments/types";
import type { Appointment } from "@/types/database";
import {
  CalendarClock,
  CalendarPlus,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentListProps {
  elderId: string;
  appointments: Appointment[];
  editingId?: string | null;
  onEdit: (appointment: Appointment) => void;
  onNew?: () => void;
  onMessage?: (msg: string) => void;
}

export function AppointmentList({
  elderId,
  appointments,
  editingId = null,
  onEdit,
  onNew,
  onMessage,
}: AppointmentListProps) {
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");

  function handleStatusChange(apptId: string, newStatus: AppointmentStatus) {
    startTransition(async () => {
      await updateAppointmentStatus(apptId, elderId, newStatus);
      onMessage?.(`Estado actualizado: ${STATUS_LABELS[newStatus]}`);
    });
  }

  const filtered = appointments.filter((a) => {
    const status = (a.status ?? "scheduled") as AppointmentStatus;
    return filter === "all" || status === filter;
  });

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-care-muted">
          <IconBox icon={CalendarClock} tone="muted" size="lg" />
          <p>No hay citas ni exámenes registrados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(["all", ...APPOINTMENT_STATUSES] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-semibold transition-colors",
                filter === f
                  ? "bg-care-accent-dark text-white"
                  : "bg-care-primary text-care-muted hover:bg-care-secondary/40"
              )}
            >
              {f === "all" ? "Todas" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        {onNew && (
          <Button
            type="button"
            variant={editingId ? "default" : "outline"}
            size="default"
            className="h-9 gap-1 text-sm"
            onClick={onNew}
          >
            <Plus className="h-4 w-4" />
            Agregar nuevo
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map((appt) => {
          const status = (appt.status ?? "scheduled") as AppointmentStatus;
          const Icon = appt.type === "examen" ? Stethoscope : CalendarClock;

          return (
            <Card
              key={appt.id}
              className={cn(editingId === appt.id && "ring-2 ring-care-accent-dark")}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <IconBox icon={Icon} tone="accent" size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-care-foreground">{appt.title}</p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            status === "completed" && "bg-green-100 text-green-800",
                            status === "cancelled" && "bg-gray-100 text-gray-600",
                            status === "scheduled" && "bg-care-accent/20 text-care-accent-darker",
                            status === "rescheduled" && "bg-amber-100 text-amber-800"
                          )}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-care-muted">{buildAppointmentSubtitle(appt)}</p>
                      {appt.exam_subtype && (
                        <p className="text-sm text-care-muted">
                          Tipo: {EXAM_SUBTYPE_LABELS[appt.exam_subtype as keyof typeof EXAM_SUBTYPE_LABELS]}
                        </p>
                      )}
                      {appt.preparation_notes && (
                        <p className="mt-1 text-sm text-care-foreground">
                          Preparación: {appt.preparation_notes}
                        </p>
                      )}
                      {appt.location_text && (
                        <p className="text-sm text-care-muted">{appt.location_text}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-care-secondary/40 pt-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-care-muted">
                    <span>Estado:</span>
                    <Select
                      value={status}
                      inputSize="sm"
                      disabled={pending}
                      onChange={(e) =>
                        handleStatusChange(appt.id, e.target.value as AppointmentStatus)
                      }
                    >
                      {APPOINTMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="h-9 gap-1 text-sm"
                    onClick={() => onEdit(appt)}
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  {appt.calendar_export_enabled !== false && (
                    <a
                      href={`/api/calendar/event/${appt.id}`}
                      className="inline-flex h-9 items-center gap-1 rounded-2xl border-2 border-care-accent-dark px-3 text-sm font-semibold text-care-foreground hover:bg-care-primary"
                      download
                    >
                      <CalendarPlus className="h-4 w-4" /> ICS
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteAppointment(appt.id, elderId);
                        if (editingId === appt.id) onNew?.();
                        onMessage?.("Evento eliminado");
                      })
                    }
                    disabled={pending}
                    className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
