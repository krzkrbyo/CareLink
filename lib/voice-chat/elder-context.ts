import { fetchElderCarePlan, type ElderCarePlan } from "@/lib/data/elder-care-plan";
import { formatCaregiversForChatContext } from "@/lib/data/elder-caregivers";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrentDateTimeForContext,
  formatRelativeUntil,
  isUpcoming,
} from "@/lib/time/relative";
import type { Elder } from "@/types/database";

function formatFoodRules(plan: ElderCarePlan): string[] {
  const groups: Record<string, string[]> = {
    prohibited: [],
    reduce: [],
    recommendation: [],
    allergen: [],
  };

  for (const rule of plan.foodRules) {
    groups[rule.type]?.push(rule.label);
  }

  const lines: string[] = [];
  if (groups.prohibited.length) {
    lines.push(`Evitar: ${groups.prohibited.join(", ")}.`);
  }
  if (groups.reduce.length) {
    lines.push(`Reducir: ${groups.reduce.join(", ")}.`);
  }
  if (groups.recommendation.length) {
    lines.push(`Recomendado: ${groups.recommendation.join(", ")}.`);
  }
  if (groups.allergen.length) {
    lines.push(`Alérgenos: ${groups.allergen.join(", ")}.`);
  }
  return lines;
}

export function formatElderChatContext(
  elder: Elder,
  plan: ElderCarePlan,
  now: Date = new Date()
): string {
  const sections: string[] = [];

  sections.push(`Hora actual: ${formatCurrentDateTimeForContext(now)}.`);

  if (plan.meals.length) {
    const meals = plan.meals
      .map((m) => {
        const due = new Date(m.dueAt);
        let suffix = "";
        if (m.status === "completed") suffix = " (ya registrada)";
        else if (isUpcoming(due, now)) suffix = ` (${formatRelativeUntil(due, now)})`;
        else if (m.status !== "completed") suffix = " (ya pasó)";
        return `${m.label} a las ${m.timeLabel}${suffix}`;
      })
      .join("; ");
    sections.push(`Comidas de hoy: ${meals}.`);

    const nextMeal = plan.meals.find(
      (m) => m.status === "pending" && isUpcoming(new Date(m.dueAt), now)
    );
    if (nextMeal) {
      const due = new Date(nextMeal.dueAt);
      sections.push(
        `Próxima comida: ${nextMeal.label} a las ${nextMeal.timeLabel} (${formatRelativeUntil(due, now)}).`
      );
    }
  }

  if (plan.routineActivities.length) {
    const activities = plan.routineActivities
      .map((a) => {
        const due = new Date(a.dueAt);
        const suffix =
          a.status === "completed"
            ? " (completada)"
            : isUpcoming(due, now)
              ? ` (${formatRelativeUntil(due, now)})`
              : " (ya pasó)";
        return `${a.title} a las ${a.timeLabel}${suffix}`;
      })
      .join("; ");
    sections.push(`Actividades de rutina: ${activities}.`);
  }

  const familyContext = formatCaregiversForChatContext(
    plan.caregivers,
    elder.main_caregiver_name,
    plan.emergencyContact ?? elder.emergency_contact
  );
  if (familyContext) {
    sections.push(`Quién le cuida: ${familyContext}.`);
  }

  if (plan.featuredMedicationDoses.length) {
    const doses = plan.featuredMedicationDoses
      .map((d) => {
        const due = new Date(d.sortKey);
        const relative =
          !d.isPast && isUpcoming(due, now) ? ` (${formatRelativeUntil(due, now)})` : "";
        return `${d.title}${d.subtitle ? ` (${d.subtitle})` : ""} a las ${d.time}${d.dateLabel ? ` (${d.dateLabel})` : ""}${relative}`;
      })
      .join("; ");
    sections.push(`Próximo(s) medicamento(s): ${doses}.`);
  }

  if (plan.medications.length) {
    const allMeds = plan.medications
      .map((m) => {
        const todayTimes =
          m.appliesToday && m.timesTodayLabels.length
            ? ` — hoy: ${m.timesTodayLabels.join(", ")}`
            : "";
        return `${m.name}${m.dose ? ` (${m.dose})` : ""}: ${m.scheduleSummary}${todayTimes}`;
      })
      .join("; ");
    sections.push(`Medicamentos del plan: ${allMeds}.`);
  }

  const upcomingAppts = plan.appointments.filter((a) => !a.isPast);
  if (upcomingAppts.length) {
    const appts = upcomingAppts
      .slice(0, 4)
      .map((a) => {
        const due = new Date(a.startsAt);
        const relative = isUpcoming(due, now) ? ` (${formatRelativeUntil(due, now)})` : "";
        return `${a.title} (${a.typeLabel}) — ${a.dateLabel} ${a.timeLabel}${relative}`;
      })
      .join("; ");
    sections.push(`Citas y exámenes próximos: ${appts}.`);
  }

  const foodLines = formatFoodRules(plan);
  if (foodLines.length) {
    sections.push(`Alimentación (presión alta): ${foodLines.join(" ")}`);
  }

  if (elder.mood_today) {
    sections.push(`Estado de ánimo registrado hoy: ${elder.mood_today}.`);
  }

  return sections.join("\n");
}

export async function loadElderChatContext(elder: Elder): Promise<string> {
  const supabase = await createClient();
  const now = new Date();
  const plan = await fetchElderCarePlan(elder.id, supabase);
  return formatElderChatContext(elder, plan, now);
}
