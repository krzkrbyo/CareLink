"use client";

import * as React from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import {
  formatDateTimeDisplay,
  formatIsoDate,
  maxDateConstraint,
  mergeDateAndTime,
  minDateConstraint,
  parseIsoDate,
  parseIsoDateTimeLocal,
  splitDateTimeLocal,
  TIME_HOURS,
  TIME_MINUTES,
} from "@/lib/dates/iso";

export interface DateTimePickerProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  inputSize?: "default" | "sm" | "lg";
  className?: string;
}

export function DateTimePicker({
  id,
  name,
  value = "",
  onChange,
  onBlur,
  min,
  max,
  disabled,
  required,
  placeholder = "Seleccionar fecha y hora",
  inputSize = "default",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDateTime = parseIsoDateTimeLocal(value);
  const { date: draftDate, time: draftTime } = splitDateTimeLocal(value);
  const [pendingDate, setPendingDate] = React.useState(draftDate);
  const [hours, setHours] = React.useState(draftTime.split(":")[0] ?? "09");
  const [minutes, setMinutes] = React.useState(draftTime.split(":")[1] ?? "00");

  React.useEffect(() => {
    const split = splitDateTimeLocal(value);
    setPendingDate(split.date);
    const [h, m] = split.time.split(":");
    setHours(h ?? "09");
    setMinutes(m ?? "00");
  }, [value]);

  const display = formatDateTimeDisplay(value);
  const calendarSelected = parseIsoDate(pendingDate);

  const disabledDays = [
    ...(min ? [{ before: minDateConstraint(min.slice(0, 10))! }] : []),
    ...(max ? [{ after: maxDateConstraint(max.slice(0, 10))! }] : []),
  ];

  function applyDateTime() {
    if (!pendingDate) return;
    onChange?.(mergeDateAndTime(pendingDate, `${hours}:${minutes}`));
    setOpen(false);
  }

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
            <CalendarClock className="h-5 w-5 shrink-0 text-care-accent-dark" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,22rem)] p-3" align="start">
          <p className="mb-2 text-sm font-semibold text-care-foreground">Fecha</p>
          <Calendar
            mode="single"
            selected={calendarSelected}
            onSelect={(date) => {
              if (date) setPendingDate(formatIsoDate(date));
            }}
            disabled={disabledDays.length > 0 ? disabledDays : undefined}
            defaultMonth={calendarSelected ?? selectedDateTime}
          />

          <div className="mt-4 border-t border-care-secondary/40 pt-4">
            <p className="mb-2 text-sm font-semibold text-care-foreground">Hora</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-care-muted">
                  Hora
                </label>
                <Select value={hours} onChange={(e) => setHours(e.target.value)}>
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
                <Select value={minutes} onChange={(e) => setMinutes(e.target.value)}>
                  {TIME_MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="mt-4 w-full"
            disabled={!pendingDate}
            onClick={applyDateTime}
          >
            Confirmar fecha y hora
          </Button>
        </PopoverContent>
      </Popover>
    </>
  );
}
