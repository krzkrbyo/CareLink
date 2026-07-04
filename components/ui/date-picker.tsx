"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatDateDisplay,
  formatIsoDate,
  maxDateConstraint,
  minDateConstraint,
  parseIsoDate,
} from "@/lib/dates/iso";

export interface DatePickerProps {
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

export function DatePicker({
  id,
  name,
  value = "",
  onChange,
  onBlur,
  min,
  max,
  disabled,
  required,
  placeholder = "Seleccionar fecha",
  inputSize = "default",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseIsoDate(value);
  const display = formatDateDisplay(value);

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    onChange?.(formatIsoDate(date));
    setOpen(false);
  }

  const disabledDays = [
    ...(min ? [{ before: minDateConstraint(min)! }] : []),
    ...(max ? [{ after: maxDateConstraint(max)! }] : []),
  ];

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
            <CalendarIcon className="h-5 w-5 shrink-0 text-care-accent-dark" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={disabledDays.length > 0 ? disabledDays : undefined}
            defaultMonth={selected}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
