import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateICSBundle } from "@/lib/calendar/ics";
import { buildMedicationCalendarEvents } from "@/lib/medications/schedule";
import { verifyCaregiverElderAccess } from "@/lib/auth/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: medication, error } = await supabase
    .from("medications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !medication) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  if (medication.calendar_export_enabled === false) {
    return NextResponse.json({ error: "Calendar export disabled" }, { status: 403 });
  }

  const hasAccess =
    (await verifyCaregiverElderAccess(user.id, medication.elder_id)) ||
    (
      await supabase
        .from("elders")
        .select("id")
        .eq("id", medication.elder_id)
        .eq("auth_user_id", user.id)
        .single()
    ).data;

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = buildMedicationCalendarEvents(medication);
  const ics = generateICSBundle(events);
  const filename = medication.name.replace(/\s+/g, "-");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
    },
  });
}
