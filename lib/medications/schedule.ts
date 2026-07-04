import type { Medication } from "@/types/database";
import type { MedicationSchedule } from "./types";
import { WEEKDAY_LABELS } from "./types";

export function addDaysIsoDate(startDate: string, days: number): string {
  const date = new Date(`${startDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function treatmentDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T12:00:00`).getTime();
  const end = new Date(`${endDate}T12:00:00`).getTime();
  const diff = Math.round((end - start) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff + 1);
}

export function endDateFromDurationDays(startDate: string, durationDays: number): string {
  return addDaysIsoDate(startDate, Math.max(1, durationDays) - 1);
}

export function generateTimesFromInterval(firstDoseTime: string, intervalHours: number): string[] {
  const [startHour, startMinute] = firstDoseTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const step = Math.max(1, intervalHours) * 60;
  const times: string[] = [];
  const seen = new Set<number>();

  for (let offset = 0; offset < 24 * 60; offset += step) {
    const totalMinutes = (startMinutes + offset) % (24 * 60);
    if (seen.has(totalMinutes)) break;
    seen.add(totalMinutes);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    times.push(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
  }

  return times.sort();
}

const DEFAULT_TIMES_BY_COUNT: Record<number, string[]> = {
  1: ["08:00"],
  2: ["08:00", "20:00"],
  3: ["08:00", "14:00", "20:00"],
  4: ["08:00", "12:00", "18:00", "22:00"],
};

export function defaultTimesForCount(count: number): string[] {
  if (DEFAULT_TIMES_BY_COUNT[count]) {
    return [...DEFAULT_TIMES_BY_COUNT[count]];
  }

  const times: string[] = [];
  const step = Math.floor(24 / count);
  for (let i = 0; i < count; i++) {
    const hour = Math.min(7 + i * step, 23);
    times.push(`${String(hour).padStart(2, "0")}:00`);
  }
  return times;
}

export function parseMedicationSchedule(raw: unknown): MedicationSchedule {
  if (!raw || typeof raw !== "object") {
    return { times: ["08:00"], daysOfWeek: [1, 2, 3, 4, 5, 6, 7] };
  }

  const value = raw as Record<string, unknown>;
  const timingMode = value.timingMode === "interval" ? "interval" : "specific";
  const intervalHours =
    typeof value.intervalHours === "number" && value.intervalHours > 0
      ? value.intervalHours
      : undefined;
  const firstDoseTime =
    typeof value.firstDoseTime === "string" && /^\d{2}:\d{2}$/.test(value.firstDoseTime)
      ? value.firstDoseTime
      : "08:00";

  let times = Array.isArray(value.times)
    ? value.times.filter((t): t is string => typeof t === "string" && /^\d{2}:\d{2}$/.test(t))
    : ["08:00"];

  if (timingMode === "interval" && intervalHours) {
    times = generateTimesFromInterval(firstDoseTime, intervalHours);
  }

  const daysOfWeek = Array.isArray(value.daysOfWeek)
    ? value.daysOfWeek.filter((d): d is number => typeof d === "number" && d >= 1 && d <= 7)
    : [1, 2, 3, 4, 5, 6, 7];

  return {
    times: times.length > 0 ? times.sort() : ["08:00"],
    daysOfWeek: daysOfWeek.length > 0 ? [...new Set(daysOfWeek)].sort() : [1, 2, 3, 4, 5, 6, 7],
    timingMode,
    intervalHours,
    firstDoseTime: timingMode === "interval" ? firstDoseTime : undefined,
  };
}

export function formatTimeLabel(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function formatDaysSummary(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 7) return "todos los días";
  if (daysOfWeek.length === 5 && [1, 2, 3, 4, 5].every((d) => daysOfWeek.includes(d))) {
    return "lun–vie";
  }
  if (daysOfWeek.length === 2 && daysOfWeek.includes(6) && daysOfWeek.includes(7)) {
    return "sáb–dom";
  }

  return daysOfWeek
    .map((day) => WEEKDAY_LABELS.find((d) => d.value === day)?.label.toLowerCase())
    .filter(Boolean)
    .join(", ");
}

export function formatMedicationScheduleSummary(medication: Pick<
  Medication,
  "dose" | "time" | "schedule"
> & {
  start_date?: string | null;
  end_date?: string | null;
}): string {
  const schedule = parseMedicationSchedule(medication.schedule);
  const dosePart = medication.dose ? `${medication.dose} · ` : "";
  const timesPart =
    schedule.timingMode === "interval" && schedule.intervalHours
      ? `cada ${schedule.intervalHours} h desde ${formatTimeLabel(schedule.firstDoseTime ?? schedule.times[0])} (${schedule.times.length} tomas)`
      : schedule.times.length === 1
        ? formatTimeLabel(schedule.times[0])
        : `${schedule.times.length} tomas (${schedule.times.map(formatTimeLabel).join(", ")})`;
  const daysPart = formatDaysSummary(schedule.daysOfWeek);

  let durationPart = "";
  if (medication.start_date) {
    const start = formatDateLabel(medication.start_date);
    if (medication.end_date) {
      durationPart = ` · ${start} – ${formatDateLabel(medication.end_date)}`;
    } else {
      durationPart = ` · desde ${start}`;
    }
  }

  return `${dosePart}${timesPart} · ${daysPart}${durationPart}`;
}

function formatDateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function toIsoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function isDateInTreatmentRange(
  date: Date,
  startDate: string,
  endDate?: string | null
): boolean {
  const start = parseDateOnly(startDate);
  const end = endDate ? parseDateOnly(endDate) : null;
  const current = parseDateOnly(date.toISOString().slice(0, 10));

  if (current < start) return false;
  if (end && current > end) return false;
  return true;
}

export function getNextOccurrence(
  schedule: MedicationSchedule,
  startDate: string,
  endDate?: string | null,
  from: Date = new Date()
): Date | null {
  const cursor = new Date(from);
  cursor.setSeconds(0, 0);

  for (let offset = 0; offset < 366; offset++) {
    const candidate = new Date(cursor);
    candidate.setDate(cursor.getDate() + offset);
    const dateKey = candidate.toISOString().slice(0, 10);

    if (!isDateInTreatmentRange(candidate, startDate, endDate)) {
      if (endDate && parseDateOnly(dateKey) > parseDateOnly(endDate)) {
        return null;
      }
      continue;
    }

    if (!schedule.daysOfWeek.includes(toIsoWeekday(candidate))) {
      continue;
    }

    for (const time of schedule.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const occurrence = new Date(candidate);
      occurrence.setHours(hours, minutes, 0, 0);

      if (occurrence >= from) {
        return occurrence;
      }
    }
  }

  return null;
}

export function buildMedicationRRule(schedule: MedicationSchedule, endDate?: string | null): string {
  const dayMap = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const byDay = schedule.daysOfWeek.map((d) => dayMap[d - 1]).join(",");

  let rule = `FREQ=WEEKLY;BYDAY=${byDay}`;
  if (endDate) {
    const until = new Date(`${endDate}T23:59:59`);
    rule += `;UNTIL=${until.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`;
  }
  return rule;
}

export function buildMedicationCalendarEvents(
  medication: Pick<
    Medication,
    "id" | "name" | "dose" | "notes" | "start_date" | "end_date" | "schedule"
  >
) {
  const schedule = parseMedicationSchedule(medication.schedule);
  const startDate = medication.start_date ?? new Date().toISOString().slice(0, 10);

  return schedule.times.map((time, index) => {
    const [hours, minutes] = time.split(":").map(Number);
    const start = parseDateOnly(startDate);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + 15 * 60 * 1000);

    const doseLine = medication.dose ? `Dosis: ${medication.dose}` : "";
    const notesLine = medication.notes ? medication.notes : "";
    const description = [doseLine, notesLine, `Horario: ${formatTimeLabel(time)}`]
      .filter(Boolean)
      .join("\\n");

    return {
      uid: `carelink-medication-${medication.id}-${index}@carelink.app`,
      summary: `${medication.name}${medication.dose ? ` (${medication.dose})` : ""}`,
      description,
      start,
      end,
      rrule: buildMedicationRRule(schedule, medication.end_date),
    };
  });
}
