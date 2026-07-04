import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateICS } from "@/lib/calendar/ics";
import { verifyCaregiverElderAccess } from "@/lib/auth/session";
import { EXAM_SUBTYPE_LABELS } from "@/lib/appointments/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (appointment.calendar_export_enabled === false) {
    return NextResponse.json({ error: "Export disabled" }, { status: 403 });
  }

  const hasAccess =
    (await verifyCaregiverElderAccess(user.id, appointment.elder_id)) ||
    (await supabase
      .from("elders")
      .select("id")
      .eq("id", appointment.elder_id)
      .eq("auth_user_id", user.id)
      .single()).data;

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const start = new Date(appointment.starts_at);
  const durationMs = (appointment.duration_minutes ?? 60) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  const descriptionParts: string[] = [];
  if (appointment.professional_name) {
    descriptionParts.push(`Doctor: ${appointment.professional_name}`);
  }
  if (appointment.facility_name) {
    descriptionParts.push(`Lugar: ${appointment.facility_name}`);
  }
  if (appointment.exam_subtype) {
    descriptionParts.push(
      `Tipo: ${EXAM_SUBTYPE_LABELS[appointment.exam_subtype as keyof typeof EXAM_SUBTYPE_LABELS] ?? appointment.exam_subtype}`
    );
  }
  if (appointment.preparation_notes) {
    descriptionParts.push(`Preparación: ${appointment.preparation_notes}`);
  }
  if (appointment.notes) {
    descriptionParts.push(appointment.notes);
  }

  const ics = generateICS({
    uid: `carelink-${appointment.id}@carelink.app`,
    summary: appointment.title,
    description: descriptionParts.join("\\n") || `CareLink — ${appointment.type}`,
    location: appointment.location_text ?? appointment.facility_name ?? undefined,
    start,
    end,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${appointment.title.replace(/\s+/g, "-")}.ics"`,
    },
  });
}
