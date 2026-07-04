"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createAppointment,
  updateAppointment,
} from "@/app/actions/caregiver";
import { createFacility, createProfessional } from "@/app/actions/medical-catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EXAM_SUBTYPE_LABELS,
  FACILITY_TYPE_LABELS,
  STATUS_LABELS,
  APPOINTMENT_STATUSES,
  type AppointmentInput,
  type AppointmentStatus,
  type ExamSubtype,
  type MedicalCatalog,
} from "@/lib/appointments/types";
import type { Appointment } from "@/types/database";
import { Plus } from "lucide-react";

interface AppointmentScheduleFormProps {
  elderId: string;
  catalog: MedicalCatalog;
  editing?: Appointment | null;
  onSuccess?: (message: string) => void;
  onCancelEdit?: () => void;
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AppointmentScheduleForm({
  elderId,
  catalog,
  editing,
  onSuccess,
  onCancelEdit,
}: AppointmentScheduleFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<"cita" | "examen">(editing?.type ?? "cita");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [startsAt, setStartsAt] = useState(
    editing ? toDatetimeLocalValue(editing.starts_at) : ""
  );
  const [facilityId, setFacilityId] = useState(editing?.facility_id ?? "");
  const [professionalId, setProfessionalId] = useState(editing?.professional_id ?? "");
  const [locationText, setLocationText] = useState(editing?.location_text ?? "");
  const [examSubtype, setExamSubtype] = useState<ExamSubtype>(
    (editing?.exam_subtype as ExamSubtype) ?? "sangre"
  );
  const [preparationNotes, setPreparationNotes] = useState(editing?.preparation_notes ?? "");
  const [durationMinutes, setDurationMinutes] = useState(String(editing?.duration_minutes ?? 60));
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [status, setStatus] = useState<AppointmentStatus>(
    (editing?.status as AppointmentStatus) ?? "scheduled"
  );

  const [showNewFacility, setShowNewFacility] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState("");
  const [newFacilityType, setNewFacilityType] = useState<keyof typeof FACILITY_TYPE_LABELS>("hospital");
  const [newFacilityAddress, setNewFacilityAddress] = useState("");
  const [newFacilityPhone, setNewFacilityPhone] = useState("");

  const [showNewProfessional, setShowNewProfessional] = useState(false);
  const [newProfessionalName, setNewProfessionalName] = useState("");
  const [newProfessionalSpecialty, setNewProfessionalSpecialty] = useState("");
  const [newProfessionalPhone, setNewProfessionalPhone] = useState("");

  const selectedFacility = useMemo(
    () => catalog.facilities.find((f) => f.id === facilityId),
    [catalog.facilities, facilityId]
  );

  function handleFacilityChange(value: string) {
    if (value === "__new__") {
      setShowNewFacility(true);
      return;
    }
    setFacilityId(value);
    const facility = catalog.facilities.find((f) => f.id === value);
    if (facility?.address && !locationText) {
      setLocationText(facility.address);
    }
  }

  function handleProfessionalChange(value: string) {
    if (value === "__new__") {
      setShowNewProfessional(true);
      return;
    }
    setProfessionalId(value);
    const professional = catalog.professionals.find((p) => p.id === value);
    if (professional?.facility_id && !facilityId) {
      setFacilityId(professional.facility_id);
      const facility = catalog.facilities.find((f) => f.id === professional.facility_id);
      if (facility?.address && !locationText) setLocationText(facility.address);
    }
  }

  function buildInput(): AppointmentInput {
    return {
      title: title.trim() || undefined,
      type,
      startsAt,
      notes,
      facilityId: facilityId || null,
      professionalId: type === "cita" ? professionalId || null : professionalId || null,
      locationText,
      examSubtype: type === "examen" ? examSubtype : null,
      preparationNotes,
      durationMinutes: Number(durationMinutes) || 60,
      status,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startsAt) {
      setError("Indique fecha y hora");
      return;
    }

    startTransition(async () => {
      try {
        const input = buildInput();
        if (editing) {
          await updateAppointment(editing.id, elderId, input);
          onSuccess?.("Cita actualizada");
          onCancelEdit?.();
        } else {
          await createAppointment(elderId, input);
          onSuccess?.("Evento agregado al calendario");
          setTitle("");
          setStartsAt("");
          setNotes("");
          setPreparationNotes("");
          setStatus("scheduled");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleQuickAddFacility() {
    if (!newFacilityName.trim()) return;
    startTransition(async () => {
      const facility = await createFacility(elderId, {
        name: newFacilityName,
        type: newFacilityType,
        address: newFacilityAddress,
        phone: newFacilityPhone,
      });
      setFacilityId(facility.id);
      if (facility.address) setLocationText(facility.address);
      setShowNewFacility(false);
      setNewFacilityName("");
      setNewFacilityAddress("");
      setNewFacilityPhone("");
      onSuccess?.("Lugar médico guardado");
    });
  }

  function handleQuickAddProfessional() {
    if (!newProfessionalName.trim()) return;
    startTransition(async () => {
      const professional = await createProfessional(elderId, {
        fullName: newProfessionalName,
        specialty: newProfessionalSpecialty,
        facilityId: facilityId || null,
        phone: newProfessionalPhone,
      });
      setProfessionalId(professional.id);
      setShowNewProfessional(false);
      setNewProfessionalName("");
      setNewProfessionalSpecialty("");
      setNewProfessionalPhone("");
      onSuccess?.("Doctor guardado");
    });
  }

  return (
    <Card className={editing ? "ring-2 ring-care-accent/50" : undefined}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{editing ? "Editar cita o examen" : "Agendar cita o examen"}</CardTitle>
            <p className="text-sm text-care-muted">
              {editing
                ? "Modifique los datos y guarde, o cree un evento nuevo."
                : "Seleccione hospital y doctor guardados, o agregue nuevos al catálogo."}
            </p>
          </div>
          {editing && onCancelEdit && (
            <Button
              type="button"
              variant="default"
              size="default"
              className="h-11 shrink-0 gap-2 text-base"
              onClick={onCancelEdit}
            >
              <Plus className="h-4 w-4" />
              Agregar nuevo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as "cita" | "examen")}
          >
            <option value="cita">Cita médica</option>
            <option value="examen">Examen</option>
          </Select>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "cita" ? "Título (opcional, se genera automático)" : "Título (opcional)"}
          />

          <FormField label="Fecha y hora">
            <Input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </FormField>

          <FormField id="appointment-status" label="Estado">
            <Select
              id="appointment-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
            >
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-care-muted">
              Use &quot;Reprogramada&quot; si cambió la fecha. &quot;Cancelada&quot; mantiene el registro sin avisos activos.
            </p>
          </FormField>

          <FormField label="Hospital / clínica / laboratorio">
            <Select value={facilityId} onChange={(e) => handleFacilityChange(e.target.value)}>
              <option value="">— Seleccionar lugar —</option>
              {catalog.facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({FACILITY_TYPE_LABELS[f.type]})
                </option>
              ))}
              <option value="__new__">+ Agregar hospital o clínica…</option>
            </Select>
          </FormField>

          {showNewFacility && (
            <div className="space-y-2 rounded-xl border border-care-secondary/60 bg-care-primary/40 p-3">
              <Input
                value={newFacilityName}
                onChange={(e) => setNewFacilityName(e.target.value)}
                placeholder="Nombre del lugar"
              />
              <Select
                value={newFacilityType}
                onChange={(e) => setNewFacilityType(e.target.value as keyof typeof FACILITY_TYPE_LABELS)}
              >
                {Object.entries(FACILITY_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </Select>
              <Input
                value={newFacilityAddress}
                onChange={(e) => setNewFacilityAddress(e.target.value)}
                placeholder="Dirección"
              />
              <Input
                value={newFacilityPhone}
                onChange={(e) => setNewFacilityPhone(e.target.value)}
                placeholder="Teléfono"
              />
              <div className="flex gap-2">
                <Button type="button" size="default" className="h-11 flex-1 text-base" onClick={handleQuickAddFacility} disabled={pending}>
                  Guardar lugar
                </Button>
                <Button type="button" variant="ghost" size="default" className="h-11 text-base" onClick={() => setShowNewFacility(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {type === "cita" && (
            <FormField label="Doctor">
              <Select value={professionalId} onChange={(e) => handleProfessionalChange(e.target.value)}>
                <option value="">— Seleccionar doctor —</option>
                {catalog.professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}{p.specialty ? ` (${p.specialty})` : ""}
                  </option>
                ))}
                <option value="__new__">+ Agregar doctor…</option>
              </Select>
            </FormField>
          )}

          {type === "cita" && showNewProfessional && (
            <div className="space-y-2 rounded-xl border border-care-secondary/60 bg-care-primary/40 p-3">
              <Input
                value={newProfessionalName}
                onChange={(e) => setNewProfessionalName(e.target.value)}
                placeholder="Nombre del doctor"
              />
              <Input
                value={newProfessionalSpecialty}
                onChange={(e) => setNewProfessionalSpecialty(e.target.value)}
                placeholder="Especialidad"
              />
              <Input
                value={newProfessionalPhone}
                onChange={(e) => setNewProfessionalPhone(e.target.value)}
                placeholder="Teléfono"
              />
              <div className="flex gap-2">
                <Button type="button" size="default" className="h-11 flex-1 text-base" onClick={handleQuickAddProfessional} disabled={pending}>
                  Guardar doctor
                </Button>
                <Button type="button" variant="ghost" size="default" className="h-11 text-base" onClick={() => setShowNewProfessional(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {type === "examen" && (
            <Select value={examSubtype} onChange={(e) => setExamSubtype(e.target.value as ExamSubtype)}>
              {Object.entries(EXAM_SUBTYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </Select>
          )}

          <Input
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="Dirección o ubicación"
          />

          {selectedFacility?.phone && (
            <p className="text-sm text-care-muted">Tel. del lugar: {selectedFacility.phone}</p>
          )}

          {type === "examen" && (
            <Textarea
              value={preparationNotes}
              onChange={(e) => setPreparationNotes(e.target.value)}
              placeholder="Preparación (ayuno, documentos, etc.)"
              rows={2}
            />
          )}

          <Select value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}>
            <option value="30">Duración: 30 min</option>
            <option value="60">Duración: 1 hora</option>
            <option value="90">Duración: 1 h 30 min</option>
            <option value="120">Duración: 2 horas</option>
          </Select>

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales"
            rows={2}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending} className="h-11 flex-1 text-base">
              {pending ? "Guardando…" : editing ? "Actualizar evento" : "Guardar evento"}
            </Button>
            {editing && onCancelEdit && (
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 text-base"
                onClick={onCancelEdit}
              >
                <Plus className="h-4 w-4" />
                Agregar nuevo
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
