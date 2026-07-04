import type {
  ElderAgendaItem,
  ElderAppointmentView,
  ElderCarePlan,
} from "@/lib/data/elder-care-plan";

/** Appointments within this window (ms) are shown together as "very close". */
const CLOSE_APPOINTMENT_WINDOW_MS = 48 * 60 * 60 * 1000;

export function getUpcomingAppointments(
  appointments: ElderAppointmentView[]
): ElderAppointmentView[] {
  return appointments.filter((a) => !a.isPast);
}

/**
 * Returns the nearest appointment(s) to show on the home view.
 * Shows two when they fall on the same day or within 48 hours of each other.
 */
export function getFeaturedAppointments(
  appointments: ElderAppointmentView[]
): ElderAppointmentView[] {
  const upcoming = getUpcomingAppointments(appointments);
  if (upcoming.length === 0) return [];
  if (upcoming.length === 1) return [upcoming[0]];

  const first = upcoming[0];
  const second = upcoming[1];
  const firstDate = new Date(first.startsAt);
  const secondDate = new Date(second.startsAt);

  const sameDay = firstDate.toDateString() === secondDate.toDateString();
  const withinWindow =
    secondDate.getTime() - firstDate.getTime() <= CLOSE_APPOINTMENT_WINDOW_MS;

  if (sameDay || withinWindow) return [first, second];
  return [first];
}

/** Next medication dose(s) at the nearest scheduled time, including all at the same hour. */
export function getFeaturedMedicationDoses(plan: ElderCarePlan): ElderAgendaItem[] {
  return plan.featuredMedicationDoses;
}

export function hasMoreAppointments(
  appointments: ElderAppointmentView[],
  featured: ElderAppointmentView[]
): boolean {
  return getUpcomingAppointments(appointments).length > featured.length;
}

export function hasMoreMedications(plan: ElderCarePlan): boolean {
  return (
    plan.medications.length > plan.featuredMedicationDoses.length ||
    plan.featuredMedicationDoses.length > 1
  );
}
