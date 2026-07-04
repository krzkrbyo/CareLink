import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateAppointmentTitle,
  type AppointmentInput,
  EXAM_SUBTYPE_LABELS,
} from "@/lib/appointments/types";

interface ResolvedSnapshots {
  facilityId: string | null;
  professionalId: string | null;
  facilityName: string | null;
  professionalName: string | null;
  professionalSpecialty: string | null;
  locationText: string | null;
  title: string;
}

export async function resolveAppointmentSnapshots(
  supabase: SupabaseClient,
  elderId: string,
  data: AppointmentInput
): Promise<ResolvedSnapshots> {
  let facilityName: string | null = null;
  let professionalName: string | null = null;
  let professionalSpecialty: string | null = null;
  let locationText = data.locationText?.trim() || null;

  if (data.facilityId) {
    const { data: facility } = await supabase
      .from("medical_facilities")
      .select("name, address")
      .eq("id", data.facilityId)
      .eq("elder_id", elderId)
      .single();
    if (facility) {
      facilityName = facility.name;
      if (!locationText && facility.address) locationText = facility.address;
    }
  }

  if (data.professionalId) {
    const { data: professional } = await supabase
      .from("medical_professionals")
      .select("full_name, specialty, facility_id")
      .eq("id", data.professionalId)
      .eq("elder_id", elderId)
      .single();
    if (professional) {
      professionalName = professional.full_name;
      professionalSpecialty = professional.specialty;
      if (!data.facilityId && professional.facility_id) {
        const { data: linkedFacility } = await supabase
          .from("medical_facilities")
          .select("name, address")
          .eq("id", professional.facility_id)
          .single();
        if (linkedFacility) {
          facilityName = linkedFacility.name;
          if (!locationText && linkedFacility.address) locationText = linkedFacility.address;
        }
      }
    }
  }

  const title = generateAppointmentTitle({
    type: data.type,
    professionalName,
    professionalSpecialty,
    facilityName,
    examSubtype: data.examSubtype ?? null,
    customTitle: data.title,
  });

  return {
    facilityId: data.facilityId ?? null,
    professionalId: data.professionalId ?? null,
    facilityName,
    professionalName,
    professionalSpecialty,
    locationText,
    title,
  };
}

export function buildReminderMessages(
  data: AppointmentInput,
  resolved: ResolvedSnapshots
): { adultMessage: string; caregiverMessage: string } {
  const when = new Date(data.startsAt).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (data.type === "examen") {
    const examLabel = data.examSubtype
      ? EXAM_SUBTYPE_LABELS[data.examSubtype]
      : "examen médico";
    const place = resolved.facilityName ? ` en ${resolved.facilityName}` : "";
    const prep = data.preparationNotes?.trim()
      ? ` ${data.preparationNotes.trim()}`
      : "";
    return {
      adultMessage: `Tiene ${examLabel}${place} el ${when}.${prep}`,
      caregiverMessage: `${resolved.title} programado para ${when}.${prep}`,
    };
  }

  const doctor = resolved.professionalName ? ` con ${resolved.professionalName}` : "";
  const place = resolved.facilityName ? ` en ${resolved.facilityName}` : "";
  const notes = data.notes?.trim() ? ` ${data.notes.trim()}` : "";
  return {
    adultMessage: `Tiene cita médica${doctor}${place} el ${when}.${notes}`,
    caregiverMessage: `${resolved.title} programada para ${when}.${notes}`,
  };
}
