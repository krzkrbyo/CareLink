import { requireElder } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  formatDaysSummary,
  formatTimeLabel,
  isDateInTreatmentRange,
  parseMedicationSchedule,
} from "@/lib/medications/schedule";
import type { Appointment, FoodRule, Medication } from "@/types/database";

export interface ElderMedicationView {
  id: string;
  name: string;
  dose: string | null;
  notes: string | null;
  scheduleSummary: string;
  timesToday: string[];
  timesTodayLabels: string[];
  appliesToday: boolean;
  frequencyLabel: string;
  durationLabel: string | null;
}

export interface ElderAppointmentView {
  id: string;
  title: string;
  type: "cita" | "examen";
  typeLabel: string;
  startsAt: string;
  dateLabel: string;
  timeLabel: string;
  isToday: boolean;
  isPast: boolean;
  notes: string | null;
}

export interface ElderFoodRuleView {
  id: string;
  label: string;
  type: FoodRule["type"];
  typeLabel: string;
  notes: string | null;
}

export interface ElderAgendaItem {
  id: string;
  kind: "medication" | "cita" | "examen";
  title: string;
  subtitle: string;
  time: string;
  sortKey: number;
  isPast: boolean;
}

export interface ElderCarePlan {
  medications: ElderMedicationView[];
  appointments: ElderAppointmentView[];
  foodRules: ElderFoodRuleView[];
  todayAgenda: ElderAgendaItem[];
}

const FOOD_TYPE_LABELS: Record<FoodRule["type"], string> = {
  allergen: "Alérgeno",
  prohibited: "Evitar",
  reduce: "Reducir",
  recommendation: "Recomendado",
};

function toIsoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function formatAppointmentDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === tomorrow.toDateString()) return "Mañana";

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function buildMedicationView(med: Medication, now: Date): ElderMedicationView {
  const schedule = parseMedicationSchedule(med.schedule);
  const appliesToday =
    med.active !== false &&
    isDateInTreatmentRange(now, med.start_date, med.end_date) &&
    schedule.daysOfWeek.includes(toIsoWeekday(now));

  const timesToday = appliesToday ? schedule.times : [];
  const timesTodayLabels = timesToday.map(formatTimeLabel);

  let durationLabel: string | null = null;
  if (med.start_date) {
    const start = new Date(`${med.start_date}T12:00:00`).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
    if (med.end_date) {
      const end = new Date(`${med.end_date}T12:00:00`).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      durationLabel = `Del ${start} al ${end}`;
    } else {
      durationLabel = `Desde el ${start}`;
    }
  }

  const frequencyLabel = formatDaysSummary(schedule.daysOfWeek);

  let scheduleSummary = "";
  if (schedule.timingMode === "interval" && schedule.intervalHours) {
    scheduleSummary = `Cada ${schedule.intervalHours} horas`;
  } else if (schedule.times.length === 1) {
    scheduleSummary = `A las ${formatTimeLabel(schedule.times[0])}`;
  } else {
    scheduleSummary = `${schedule.times.length} tomas: ${schedule.times.map(formatTimeLabel).join(", ")}`;
  }

  return {
    id: med.id,
    name: med.name,
    dose: med.dose,
    notes: med.notes,
    scheduleSummary,
    timesToday,
    timesTodayLabels,
    appliesToday,
    frequencyLabel,
    durationLabel,
  };
}

function buildTodayAgenda(
  medications: ElderMedicationView[],
  appointments: ElderAppointmentView[],
  now: Date
): ElderAgendaItem[] {
  const items: ElderAgendaItem[] = [];

  for (const med of medications) {
    if (!med.appliesToday) continue;
    for (const [index, time] of med.timesToday.entries()) {
      const [hours, minutes] = time.split(":").map(Number);
      const at = new Date(now);
      at.setHours(hours, minutes, 0, 0);
      items.push({
        id: `${med.id}-${index}`,
        kind: "medication",
        title: med.name,
        subtitle: med.dose ? `Dosis: ${med.dose}` : "Medicamento",
        time: formatTimeLabel(time),
        sortKey: at.getTime(),
        isPast: at.getTime() < now.getTime(),
      });
    }
  }

  for (const appt of appointments) {
    if (!appt.isToday || appt.isPast) continue;
    const at = new Date(appt.startsAt);
    items.push({
      id: appt.id,
      kind: appt.type === "examen" ? "examen" : "cita",
      title: appt.title,
      subtitle: appt.typeLabel,
      time: appt.timeLabel,
      sortKey: at.getTime(),
      isPast: false,
    });
  }

  return items.sort((a, b) => a.sortKey - b.sortKey);
}

export async function getElderCarePlan(): Promise<ElderCarePlan> {
  const { elder } = await requireElder();
  const supabase = await createClient();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [{ data: medications }, { data: appointments }, { data: foodRules }] =
    await Promise.all([
      supabase
        .from("medications")
        .select("*")
        .eq("elder_id", elder.id)
        .order("created_at"),
      supabase
        .from("appointments")
        .select("*")
        .eq("elder_id", elder.id)
        .gte("starts_at", startOfToday.toISOString())
        .order("starts_at"),
      supabase
        .from("food_rules")
        .select("*")
        .eq("elder_id", elder.id)
        .order("created_at"),
    ]);

  const activeMeds = (medications ?? []).filter((m) => m.active !== false);
  const medicationViews = activeMeds.map((m) => buildMedicationView(m as Medication, now));

  const appointmentViews: ElderAppointmentView[] = (appointments ?? []).map((a) => {
    const appt = a as Appointment;
    const date = new Date(appt.starts_at);
    const isToday = date.toDateString() === now.toDateString();
    return {
      id: appt.id,
      title: appt.title,
      type: appt.type,
      typeLabel: appt.type === "examen" ? "Examen médico" : "Cita médica",
      startsAt: appt.starts_at,
      dateLabel: formatAppointmentDate(date),
      timeLabel: date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      isToday,
      isPast: date.getTime() < now.getTime(),
      notes: appt.notes,
    };
  });

  const foodRuleViews: ElderFoodRuleView[] = (foodRules ?? []).map((rule) => ({
    id: rule.id,
    label: rule.label,
    type: rule.type as FoodRule["type"],
    typeLabel: FOOD_TYPE_LABELS[rule.type as FoodRule["type"]],
    notes: rule.notes,
  }));

  return {
    medications: medicationViews,
    appointments: appointmentViews,
    foodRules: foodRuleViews,
    todayAgenda: buildTodayAgenda(medicationViews, appointmentViews, now),
  };
}
