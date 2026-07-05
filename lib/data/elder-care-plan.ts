import { requireElder } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  formatDaysSummary,
  formatTimeLabel,
  getNextOccurrence,
  isDateInTreatmentRange,
  parseMedicationSchedule,
} from "@/lib/medications/schedule";
import { EXAM_SUBTYPE_LABELS } from "@/lib/appointments/types";
import { fetchElderCaregivers, type ElderCaregiverView } from "@/lib/data/elder-caregivers";
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
  examSubtypeLabel: string | null;
  startsAt: string;
  dateLabel: string;
  timeLabel: string;
  isToday: boolean;
  isPast: boolean;
  notes: string | null;
  preparationNotes: string | null;
  facilityName: string | null;
  professionalName: string | null;
  locationText: string | null;
  facilityPhone: string | null;
  professionalPhone: string | null;
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
  dateLabel?: string;
}

export interface ElderMealView {
  id: string;
  label: string;
  timeLabel: string;
  dueAt: string;
  status: "pending" | "completed" | "missed";
  message: string | null;
}

export interface ElderRoutineView {
  id: string;
  title: string;
  timeLabel: string;
  dueAt: string;
  status: "pending" | "completed" | "missed";
  message: string | null;
}

export interface ElderCarePlan {
  medications: ElderMedicationView[];
  appointments: ElderAppointmentView[];
  foodRules: ElderFoodRuleView[];
  todayAgenda: ElderAgendaItem[];
  featuredMedicationDoses: ElderAgendaItem[];
  meals: ElderMealView[];
  routineActivities: ElderRoutineView[];
  caregivers: ElderCaregiverView[];
  emergencyContact: string | null;
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

function formatDoseDateLabel(date: Date, now: Date): string {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === tomorrow.toDateString()) return "Mañana";

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function buildFeaturedMedicationDoses(medications: Medication[], now: Date): ElderAgendaItem[] {
  const occurrences: { med: Medication; at: Date }[] = [];

  for (const med of medications) {
    if (med.active === false) continue;
    const schedule = parseMedicationSchedule(med.schedule);
    const next = getNextOccurrence(schedule, med.start_date, med.end_date, now);
    if (next) occurrences.push({ med, at: next });
  }

  if (occurrences.length === 0) return [];

  const minTime = Math.min(...occurrences.map((o) => o.at.getTime()));
  const atSameSlot = occurrences.filter((o) => o.at.getTime() === minTime);

  return atSameSlot.map(({ med, at }) => {
    const hours = String(at.getHours()).padStart(2, "0");
    const minutes = String(at.getMinutes()).padStart(2, "0");
    return {
      id: `${med.id}-${at.getTime()}`,
      kind: "medication" as const,
      title: med.name,
      subtitle: med.dose ? `Dosis: ${med.dose}` : "Medicamento",
      time: formatTimeLabel(`${hours}:${minutes}`),
      sortKey: at.getTime(),
      isPast: at.getTime() < now.getTime(),
      dateLabel: formatDoseDateLabel(at, now),
    };
  });
}

const MEAL_ORDER = ["Desayuno", "Almuerzo", "Merienda", "Cena"] as const;

function buildMealViews(
  reminders: { id: string; title: string; due_at: string | null; status: string; message_text: string | null }[],
  now: Date
): ElderMealView[] {
  const mealReminders = reminders.filter((r) => MEAL_ORDER.includes(r.title as (typeof MEAL_ORDER)[number]));
  const meals: ElderMealView[] = [];

  for (const label of MEAL_ORDER) {
    const reminder = mealReminders.find((r) => r.title === label);
    if (!reminder) continue;

    const due = reminder.due_at ? new Date(reminder.due_at) : now;
    meals.push({
      id: reminder.id,
      label,
      timeLabel: due.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      dueAt: reminder.due_at ?? now.toISOString(),
      status: reminder.status as ElderMealView["status"],
      message: reminder.message_text,
    });
  }

  return meals;
}

function buildRoutineViews(
  reminders: { id: string; title: string; due_at: string | null; status: string; message_text: string | null; type: string }[]
): ElderRoutineView[] {
  return reminders
    .filter((r) => r.type === "activity" || r.type === "hydration")
    .sort((a, b) => {
      const ta = a.due_at ? new Date(a.due_at).getTime() : 0;
      const tb = b.due_at ? new Date(b.due_at).getTime() : 0;
      return ta - tb;
    })
    .map((r) => {
      const due = r.due_at ? new Date(r.due_at) : new Date();
      return {
        id: r.id,
        title: r.title,
        timeLabel: due.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
        dueAt: r.due_at ?? new Date().toISOString(),
        status: r.status as ElderRoutineView["status"],
        message: r.message_text,
      };
    });
}

export async function getElderCarePlan(): Promise<ElderCarePlan> {
  const { elder } = await requireElder();
  const supabase = await createClient();
  return fetchElderCarePlan(elder.id, supabase);
}

export async function fetchElderCarePlan(
  elderId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ElderCarePlan> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [
    { data: medications },
    { data: appointments },
    { data: foodRules },
    { data: reminders },
    { data: elderRow },
  ] = await Promise.all([
      supabase
        .from("medications")
        .select("*")
        .eq("elder_id", elderId)
        .order("created_at"),
      supabase
        .from("appointments")
        .select("*")
        .eq("elder_id", elderId)
        .gte("starts_at", startOfToday.toISOString())
        .order("starts_at"),
      supabase
        .from("food_rules")
        .select("*")
        .eq("elder_id", elderId)
        .order("created_at"),
      supabase
        .from("reminders")
        .select("id, title, type, due_at, status, message_text")
        .eq("elder_id", elderId)
        .in("type", ["meal", "activity", "hydration"])
        .order("due_at"),
      supabase
        .from("elders")
        .select("main_caregiver_name, emergency_contact")
        .eq("id", elderId)
        .single(),
    ]);

  const caregivers = await fetchElderCaregivers(
    elderId,
    supabase,
    elderRow?.main_caregiver_name
  );

  const apptList = (appointments ?? []) as Appointment[];
  const facilityIds = apptList.map((a) => a.facility_id).filter(Boolean) as string[];
  const professionalIds = apptList.map((a) => a.professional_id).filter(Boolean) as string[];

  const [{ data: facilities }, { data: professionals }] = await Promise.all([
    facilityIds.length
      ? supabase.from("medical_facilities").select("id, phone").in("id", facilityIds)
      : Promise.resolve({ data: [] }),
    professionalIds.length
      ? supabase.from("medical_professionals").select("id, phone, specialty").in("id", professionalIds)
      : Promise.resolve({ data: [] }),
  ]);

  const facilityPhoneMap = new Map(facilities?.map((f) => [f.id, f.phone]) ?? []);
  const professionalPhoneMap = new Map(professionals?.map((p) => [p.id, p.phone]) ?? []);

  const activeMeds = (medications ?? []).filter((m) => m.active !== false);
  const medicationViews = activeMeds.map((m) => buildMedicationView(m as Medication, now));

  const appointmentViews: ElderAppointmentView[] = apptList
    .filter((a) => a.status !== "cancelled" && a.status !== "completed")
    .map((appt) => {
    const date = new Date(appt.starts_at);
    const isToday = date.toDateString() === now.toDateString();
    return {
      id: appt.id,
      title: appt.title,
      type: appt.type,
      typeLabel: appt.type === "examen" ? "Examen médico" : "Cita médica",
      examSubtypeLabel: appt.exam_subtype
        ? EXAM_SUBTYPE_LABELS[appt.exam_subtype as keyof typeof EXAM_SUBTYPE_LABELS]
        : null,
      startsAt: appt.starts_at,
      dateLabel: formatAppointmentDate(date),
      timeLabel: date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      isToday,
      isPast: date.getTime() < now.getTime(),
      notes: appt.notes,
      preparationNotes: appt.preparation_notes,
      facilityName: appt.facility_name,
      professionalName: appt.professional_name,
      locationText: appt.location_text,
      facilityPhone: appt.facility_id ? facilityPhoneMap.get(appt.facility_id) ?? null : null,
      professionalPhone: appt.professional_id
        ? professionalPhoneMap.get(appt.professional_id) ?? null
        : null,
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
    featuredMedicationDoses: buildFeaturedMedicationDoses(activeMeds as Medication[], now),
    meals: buildMealViews(reminders ?? [], now),
    routineActivities: buildRoutineViews(reminders ?? []),
    caregivers,
    emergencyContact: elderRow?.emergency_contact ?? null,
  };
}
