"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import {
  formatTimeDisplay,
  parseIsoTime,
  TIME_HOURS,
  TIME_MINUTES,
} from "@/lib/dates/iso";

export interface TimePickerProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  inputSize?: "default" | "sm" | "lg";
  className?: string;
}

export function TimePicker({
  id,
  name,
  value = "",
  onChange,
  onBlur,
  disabled,
  required,
  placeholder = "Seleccionar hora",
  inputSize = "default",
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseIsoTime(value) ?? { hours: 9, minutes: 0 };
  const [hours, setHours] = React.useState(String(parsed.hours).padStart(2, "0"));
  const [minutes, setMinutes] = React.useState(String(parsed.minutes).padStart(2, "0"));

  React.useEffect(() => {
    const next = parseIsoTime(value);
    if (next) {
      setHours(String(next.hours).padStart(2, "0"));
      setMinutes(String(next.minutes).padStart(2, "0"));
    }
  }, [value]);

  const display = formatTimeDisplay(value);

  function applyTime() {
    onChange?.(`${hours}:${minutes}`);
    setOpen(false);
  }

  const quickTimes = ["08:00", "12:00", "14:00", "18:00", "20:00"];

  return (
    <>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            onBlur={onBlur}
            className={cn(
              "care-input flex w-full items-center justify-between text-left",
              inputSize === "sm" && "care-input-sm",
              inputSize === "lg" && "care-input-lg",
              disabled && "care-input-disabled",
              !display && "text-care-muted-light",
              className
            )}
          >
            <span className="truncate">{display || placeholder}</span>
            <Clock className="h-5 w-5 shrink-0 text-care-accent-dark" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,20rem)]" align="start">
          <p className="mb-3 text-sm font-semibold text-care-foreground">Elegir hora</p>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-care-muted">
                Hora
              </label>
              <Select value={hours} onChange={(e) => setHours(e.target.value)} aria-label="Hora">
                {TIME_HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-care-muted">
                Minutos
              </label>
              <Select
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                aria-label="Minutos"
              >
                {TIME_MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-care-muted">
            Accesos rápidos
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {quickTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  const [h, m] = time.split(":");
                  setHours(h);
                  setMinutes(m);
                }}
                className={cn(
                  "rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-colors",
                  value === time
                    ? "border-care-accent-dark bg-care-accent-dark text-white"
                    : "border-care-secondary bg-care-primary text-care-muted hover:border-care-accent"
                )}
              >
                {time}
              </button>
            ))}
          </div>

          <Button type="button" className="w-full" onClick={applyTime}>
            Confirmar hora
          </Button>
        </PopoverContent>
      </Popover>
    </>
  );
}
