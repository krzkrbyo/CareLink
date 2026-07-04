import {
  format,
  parse,
  isValid,
  startOfDay,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";

/** YYYY-MM-DD */
export function formatIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** HH:mm (24h) */
export function formatIsoTime(date: Date): string {
  return format(date, "HH:mm");
}

/** YYYY-MM-DDTHH:mm (datetime-local value) */
export function formatIsoDateTimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function parseIsoTime(value: string | undefined): { hours: number; minutes: number } | undefined {
  if (!value) return undefined;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return undefined;
  return { hours, minutes };
}

export function parseIsoDateTimeLocal(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function formatDateDisplay(value: string | undefined): string {
  const date = parseIsoDate(value);
  if (!date) return "";
  return format(date, "d 'de' MMMM yyyy", { locale: es });
}

export function formatTimeDisplay(value: string | undefined): string {
  const parts = parseIsoTime(value);
  if (!parts) return "";
  const date = new Date();
  date.setHours(parts.hours, parts.minutes, 0, 0);
  return format(date, "HH:mm", { locale: es });
}

export function formatDateTimeDisplay(value: string | undefined): string {
  const date = parseIsoDateTimeLocal(value);
  if (!date) return "";
  return format(date, "d MMM yyyy · HH:mm", { locale: es });
}

export function minDateConstraint(min?: string): Date | undefined {
  const d = parseIsoDate(min);
  return d ? startOfDay(d) : undefined;
}

export function maxDateConstraint(max?: string): Date | undefined {
  const d = parseIsoDate(max);
  return d ? endOfDay(d) : undefined;
}

export const TIME_HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);

export const TIME_MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);

export function mergeDateAndTime(isoDate: string, isoTime: string): string {
  return `${isoDate}T${isoTime}`;
}

export function splitDateTimeLocal(value: string | undefined): {
  date: string;
  time: string;
} {
  if (!value) return { date: "", time: "09:00" };
  const [date, time] = value.split("T");
  return { date: date ?? "", time: (time ?? "09:00").slice(0, 5) };
}
