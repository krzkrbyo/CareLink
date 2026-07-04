import type {
  Appointment,
  MedicalFacility,
  MedicalProfessional,
} from "@/types/database";

export type AppointmentType = "cita" | "examen";
export type ExamSubtype = "sangre" | "imagen" | "cardiaco" | "otro";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type FacilityType = "hospital" | "clinica" | "laboratorio" | "otro";

export const EXAM_SUBTYPE_LABELS: Record<ExamSubtype, string> = {
  sangre: "Examen de sangre",
  imagen: "Estudio de imagen",
  cardiaco: "Estudio cardíaco",
  otro: "Otro examen",
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
  rescheduled: "Reprogramada",
};

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "rescheduled",
  "completed",
  "cancelled",
];

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  hospital: "Hospital",
  clinica: "Clínica",
  laboratorio: "Laboratorio",
  otro: "Otro lugar",
};

export interface AppointmentInput {
  title?: string;
  type: AppointmentType;
  startsAt: string;
  notes?: string;
  facilityId?: string | null;
  professionalId?: string | null;
  locationText?: string;
  examSubtype?: ExamSubtype | null;
  preparationNotes?: string;
  durationMinutes?: number;
  status?: AppointmentStatus;
}

export interface MedicalCatalog {
  facilities: MedicalFacility[];
  professionals: MedicalProfessional[];
}

export function generateAppointmentTitle(params: {
  type: AppointmentType;
  professionalName?: string | null;
  professionalSpecialty?: string | null;
  facilityName?: string | null;
  examSubtype?: ExamSubtype | null;
  customTitle?: string;
}): string {
  if (params.customTitle?.trim()) return params.customTitle.trim();

  if (params.type === "cita") {
    const doctor = params.professionalName?.trim();
    const specialty = params.professionalSpecialty?.trim();
    if (doctor && specialty) return `Consulta — ${doctor} (${specialty})`;
    if (doctor) return `Consulta — ${doctor}`;
    if (params.facilityName) return `Cita médica — ${params.facilityName}`;
    return "Cita médica";
  }

  const examLabel = params.examSubtype
    ? EXAM_SUBTYPE_LABELS[params.examSubtype]
    : "Examen médico";
  if (params.facilityName) return `${examLabel} — ${params.facilityName}`;
  return examLabel;
}

export function formatAppointmentLocation(appt: Pick<
  Appointment,
  "facility_name" | "location_text"
>): string | null {
  return appt.location_text?.trim() || appt.facility_name?.trim() || null;
}

export function buildAppointmentSubtitle(appt: Appointment): string {
  const parts: string[] = [];
  if (appt.professional_name) parts.push(appt.professional_name);
  if (appt.facility_name) parts.push(appt.facility_name);
  parts.push(new Date(appt.starts_at).toLocaleString("es-MX"));
  if (appt.status && appt.status !== "scheduled") {
    parts.push(STATUS_LABELS[appt.status as AppointmentStatus] ?? appt.status);
  }
  return parts.join(" · ");
}
