"use client";

import { useMemo, useState, useTransition } from "react";
import { createMedication } from "@/app/actions/caregiver";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  ALL_WEEKDAYS,
  INTERVAL_HOUR_PRESETS,
  WEEKDAY_LABELS,
  WEEKDAYS,
  WEEKENDS,
  type MedicationScheduleInput,
  type ScheduleTimingMode,
} from "@/lib/medications/types";
import {
  defaultTimesForCount,
  endDateFromDurationDays,
  generateTimesFromInterval,
  treatmentDaysBetween,
} from "@/lib/medications/schedule";
import { cn } from "@/lib/utils";

interface MedicationScheduleFormProps {
  elderId: string;
  onSuccess?: (message: string) => void;
}

type DurationMode = "ongoing" | "fixed";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MedicationScheduleForm({ elderId, onSuccess }: MedicationScheduleFormProps) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [durationMode, setDurationMode] = useState<DurationMode>("ongoing");
  const [durationDays, setDurationDays] = useState(30);
  const [endDate, setEndDate] = useState(() => endDateFromDurationDays(todayIsoDate(), 30));
  const [timingMode, setTimingMode] = useState<ScheduleTimingMode>("specific");
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [times, setTimes] = useState<string[]>(defaultTimesForCount(1));
  const [firstDoseTime, setFirstDoseTime] = useState("08:00");
  const [intervalHours, setIntervalHours] = useState<number>(8);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(ALL_WEEKDAYS);
  const [error, setError] = useState<string | null>(null);

  const resolvedTimes = useMemo(() => {
    if (timingMode === "interval") {
      return generateTimesFromInterval(firstDoseTime, intervalHours);
    }
    return times.slice(0, timesPerDay).sort();
  }, [timingMode, firstDoseTime, intervalHours, times, timesPerDay]);

  function handleDurationDaysChange(rawValue: number) {
    const days = Math.min(Math.max(rawValue || 1, 1), 365);
    setDurationDays(days);
    setEndDate(endDateFromDurationDays(startDate, days));
  }

  function handleEndDateChange(nextEndDate: string) {
    if (!nextEndDate || nextEndDate < startDate) return;
    setEndDate(nextEndDate);
    setDurationDays(treatmentDaysBetween(startDate, nextEndDate));
  }

  function handleStartDateChange(nextStartDate: string) {
    setStartDate(nextStartDate);
    if (durationMode === "fixed") {
      setEndDate(endDateFromDurationDays(nextStartDate, durationDays));
    }
  }

  function handleTimesPerDayChange(count: number) {
    const safeCount = Math.min(Math.max(count, 1), 6);
    setTimesPerDay(safeCount);
    setTimes((current) => {
      const defaults = defaultTimesForCount(safeCount);
      return defaults.map((time, index) => current[index] ?? time);
    });
  }

  function toggleDay(day: number) {
    setDaysOfWeek((current) => {
      if (current.includes(day)) {
        const next = current.filter((value) => value !== day);
        return next.length > 0 ? next : current;
      }
      return [...current, day].sort();
    });
  }

  function resetForm() {
    const today = todayIsoDate();
    setName("");
    setDose("");
    setNotes("");
    setStartDate(today);
    setDurationMode("ongoing");
    setDurationDays(30);
    setEndDate(endDateFromDurationDays(today, 30));
    setTimingMode("specific");
    handleTimesPerDayChange(1);
    setFirstDoseTime("08:00");
    setIntervalHours(8);
    setDaysOfWeek(ALL_WEEKDAYS);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Indique el nombre del medicamento");
      return;
    }

    if (daysOfWeek.length === 0) {
      setError("Seleccione al menos un día de la semana");
      return;
    }

    if (resolvedTimes.length === 0) {
      setError("Configure al menos un horario de toma");
      return;
    }

    const payload: MedicationScheduleInput = {
      name: name.trim(),
      dose: dose.trim() || undefined,
      notes: notes.trim() || undefined,
      startDate,
      endDate: durationMode === "fixed" ? endDate : null,
      schedule: {
        times: resolvedTimes,
        daysOfWeek,
        timingMode,
        ...(timingMode === "interval"
          ? { intervalHours, firstDoseTime }
          : {}),
      },
    };

    startTransition(async () => {
      try {
        await createMedication(elderId, payload);
        onSuccess?.("Medicamento agregado con calendarización");
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar el medicamento");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar medicamento</CardTitle>
        <p className="text-sm text-care-muted">
          Configure dosis, duración del tratamiento, horarios y días para recordatorios y calendario.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-care-muted">
              Información básica
            </h3>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nombre del medicamento"
            />
            <Input
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="Dosis por toma (ej: 1 tableta, 5 ml)"
            />
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales"
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-care-muted">
              Duración del tratamiento
            </h3>
            <FormField id="startDate" label="Fecha de inicio">
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDurationMode("ongoing")}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors",
                  durationMode === "ongoing"
                    ? "border-care-accent-dark bg-care-accent-dark text-white"
                    : "border-care-secondary bg-white text-care-muted hover:border-care-accent"
                )}
              >
                Continuo
              </button>
              <button
                type="button"
                onClick={() => {
                  setDurationMode("fixed");
                  setEndDate(endDateFromDurationDays(startDate, durationDays));
                }}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors",
                  durationMode === "fixed"
                    ? "border-care-accent-dark bg-care-accent-dark text-white"
                    : "border-care-secondary bg-white text-care-muted hover:border-care-accent"
                )}
              >
                Duración fija
              </button>
            </div>

            {durationMode === "fixed" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FormField id="durationDays" label="Duración (días)">
                    <Input
                      id="durationDays"
                      type="number"
                      min={1}
                      max={365}
                      value={durationDays}
                      onChange={(e) => handleDurationDaysChange(Number(e.target.value))}
                    />
                  </FormField>
                </div>
                <div>
                  <FormField id="endDate" label="Fecha de fin">
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {durationMode === "fixed" && (
              <p className="rounded-lg bg-care-primary px-3 py-2 text-sm text-care-muted">
                Tratamiento de <strong>{durationDays} días</strong>, del{" "}
                {new Date(`${startDate}T12:00:00`).toLocaleDateString("es-MX")} al{" "}
                {new Date(`${endDate}T12:00:00`).toLocaleDateString("es-MX")}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-care-muted">
              Frecuencia diaria
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTimingMode("specific")}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors",
                  timingMode === "specific"
                    ? "border-care-accent-dark bg-care-accent-dark text-white"
                    : "border-care-secondary bg-white text-care-muted hover:border-care-accent"
                )}
              >
                Horarios específicos
              </button>
              <button
                type="button"
                onClick={() => setTimingMode("interval")}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors",
                  timingMode === "interval"
                    ? "border-care-accent-dark bg-care-accent-dark text-white"
                    : "border-care-secondary bg-white text-care-muted hover:border-care-accent"
                )}
              >
                Cada X horas
              </button>
            </div>

            {timingMode === "specific" ? (
              <>
                <p className="text-sm text-care-muted">¿Cuántas veces al día?</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleTimesPerDayChange(count)}
                      className={cn(
                        "min-w-12 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-colors",
                        timesPerDay === count
                          ? "border-care-accent-dark bg-care-accent-dark text-white"
                          : "border-care-secondary bg-white text-care-muted hover:border-care-accent"
                      )}
                    >
                      {count}x
                    </button>
                  ))}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {times.slice(0, timesPerDay).map((time, index) => (
                    <div key={index}>
                      <FormField id={`dose-time-${index}`} label={`Toma ${index + 1}`}>
                        <Input
                          id={`dose-time-${index}`}
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const next = [...times];
                            next[index] = e.target.value;
                            setTimes(next);
                          }}
                          required
                        />
                      </FormField>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <FormField id="firstDoseTime" label="Primera toma del día">
                  <Input
                    id="firstDoseTime"
                    type="time"
                    value={firstDoseTime}
                    onChange={(e) => setFirstDoseTime(e.target.value)}
                    required
                  />
                </FormField>

                <p className="text-sm text-care-muted">Repetir cada</p>
                <div className="flex flex-wrap gap-2">
                  {INTERVAL_HOUR_PRESETS.map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setIntervalHours(hours)}
                      className={cn(
                        "rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-colors",
                        intervalHours === hours
                          ? "border-care-accent-dark bg-care-accent-dark text-white"
                          : "border-care-secondary bg-white text-care-muted hover:border-care-accent"
                      )}
                    >
                      {hours} h
                    </button>
                  ))}
                </div>

                <FormField id="intervalHours" label="Intervalo personalizado (horas)">
                  <Input
                    id="intervalHours"
                    type="number"
                    min={1}
                    max={24}
                    value={intervalHours}
                    onChange={(e) => setIntervalHours(Math.min(Math.max(Number(e.target.value) || 1, 1), 24))}
                  />
                </FormField>
              </>
            )}

            <p className="rounded-lg bg-care-primary px-3 py-2 text-sm text-care-muted">
              {timingMode === "interval" ? (
                <>
                  <strong>{resolvedTimes.length} tomas</strong> generadas cada {intervalHours} h
                  {resolvedTimes.length > 0 && (
                    <> · {resolvedTimes.join(", ")}</>
                  )}
                </>
              ) : (
                <>
                  <strong>{resolvedTimes.length} toma{resolvedTimes.length !== 1 ? "s" : ""}</strong>
                  {resolvedTimes.length > 0 && <> · {resolvedTimes.join(", ")}</>}
                </>
              )}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-care-muted">
              Días de la semana
            </h3>
            <div className="flex flex-wrap gap-2">
              <PresetButton label="Todos" active={daysOfWeek.length === 7} onClick={() => setDaysOfWeek(ALL_WEEKDAYS)} />
              <PresetButton
                label="Entre semana"
                active={daysOfWeek.length === 5 && WEEKDAYS.every((d) => daysOfWeek.includes(d))}
                onClick={() => setDaysOfWeek(WEEKDAYS)}
              />
              <PresetButton
                label="Fines de semana"
                active={daysOfWeek.length === 2 && WEEKENDS.every((d) => daysOfWeek.includes(d))}
                onClick={() => setDaysOfWeek(WEEKENDS)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-pressed={daysOfWeek.includes(day.value)}
                  aria-label={day.label}
                  className={cn(
                    "h-11 w-11 rounded-full border-2 text-sm font-semibold transition-colors",
                    daysOfWeek.includes(day.value)
                      ? "border-care-accent-dark bg-care-accent-dark text-white"
                      : "border-care-secondary bg-white text-care-muted hover:border-care-accent"
                  )}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando..." : "Guardar medicamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-care-accent-dark bg-care-accent-dark text-white"
          : "border-care-secondary bg-white text-care-muted hover:border-care-accent"
      )}
    >
      {label}
    </button>
  );
}
