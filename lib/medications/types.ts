export type ScheduleTimingMode = "specific" | "interval";

export interface MedicationSchedule {
  times: string[];
  daysOfWeek: number[];
  timingMode?: ScheduleTimingMode;
  intervalHours?: number;
  firstDoseTime?: string;
}

export const INTERVAL_HOUR_PRESETS = [3, 4, 6, 8, 12] as const;

export interface MedicationScheduleInput {
  name: string;
  dose?: string;
  notes?: string;
  startDate: string;
  endDate?: string | null;
  schedule: MedicationSchedule;
}

export const WEEKDAY_LABELS = [
  { value: 1, short: "L", label: "Lunes" },
  { value: 2, short: "M", label: "Martes" },
  { value: 3, short: "M", label: "Miércoles" },
  { value: 4, short: "J", label: "Jueves" },
  { value: 5, short: "V", label: "Viernes" },
  { value: 6, short: "S", label: "Sábado" },
  { value: 7, short: "D", label: "Domingo" },
] as const;

export const ALL_WEEKDAYS = WEEKDAY_LABELS.map((d) => d.value);
export const WEEKDAYS = [1, 2, 3, 4, 5];
export const WEEKENDS = [6, 7];
