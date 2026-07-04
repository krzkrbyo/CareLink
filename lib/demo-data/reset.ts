import { createAdminClient } from "@/lib/supabase/server";
import {
  DEMO_ELDER_ID,
  CAREGIVER_NAME,
  ELDER_NAME,
} from "@/lib/demo-data/seed-ids";
import { FALLBACK_REMINDERS } from "@/lib/demo-data/fallback-messages";

const DEMO_ANA_EMAIL = "ana@carelink.app";
const DEMO_MANUEL_EMAIL = "manuel@carelink.app";
const DEMO_PASSWORD = "CareLink2026!";

function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function tomorrowAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function ensureDemoUser(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  fullName: string,
  role: "caregiver" | "elder"
) {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      user_metadata: { full_name: fullName, role },
    });
    await admin.from("profiles").upsert({ id: existing.id, full_name: fullName, role });
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error || !data.user) throw new Error(error?.message ?? "Failed to create user");
  await admin.from("profiles").upsert({ id: data.user.id, full_name: fullName, role });
  return data.user.id;
}

export async function resetDemoData() {
  const admin = createAdminClient();
  const elderId = DEMO_ELDER_ID;

  const anaId = await ensureDemoUser(admin, DEMO_ANA_EMAIL, CAREGIVER_NAME, "caregiver");
  const manuelAuthId = await ensureDemoUser(admin, DEMO_MANUEL_EMAIL, ELDER_NAME, "elder");

  await admin.from("alerts").delete().eq("elder_id", elderId);
  await admin.from("interactions").delete().eq("elder_id", elderId);
  await admin.from("reminders").delete().eq("elder_id", elderId);
  await admin.from("food_rules").delete().eq("elder_id", elderId);
  await admin.from("appointments").delete().eq("elder_id", elderId);
  await admin.from("medications").delete().eq("elder_id", elderId);
  await admin.from("caregiver_elder_links").delete().eq("elder_id", elderId);

  await admin.from("elders").upsert({
    id: elderId,
    full_name: ELDER_NAME,
    age: 78,
    main_caregiver_name: CAREGIVER_NAME,
    emergency_contact: "Ana - hija",
    last_activity_at: new Date().toISOString(),
    mood_today: "Bien",
    auth_user_id: manuelAuthId,
  });

  await admin.from("caregiver_elder_links").upsert({
    caregiver_id: anaId,
    elder_id: elderId,
    relationship: "hija",
  });

  await admin.from("medications").insert({
    elder_id: elderId,
    name: "Pastilla para la presión",
    dose: "1 tableta",
    time: "08:00",
    scheduled_time: "08:00:00",
    frequency: "1x/día",
    notes: "Tomar con agua",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: null,
    schedule: {
      times: ["08:00"],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    },
    calendar_export_enabled: true,
    active: true,
  });

  const { data: appointment } = await admin
    .from("appointments")
    .insert({
      elder_id: elderId,
      title: "Cita con cardiólogo",
      type: "cita",
      starts_at: todayAt(15, 0).toISOString(),
      notes: "Llevar documentos y exámenes",
      calendar_export_enabled: true,
    })
    .select("id")
    .single();

  await admin.from("appointments").insert({
    elder_id: elderId,
    title: "Examen de sangre en ayunas",
    type: "examen",
    starts_at: tomorrowAt(7, 0).toISOString(),
    notes: "Ayuno de 8 horas",
    calendar_export_enabled: true,
  });

  await admin.from("food_rules").insert([
    { elder_id: elderId, type: "prohibited", label: "tortillas" },
    { elder_id: elderId, type: "reduce", label: "sal" },
    { elder_id: elderId, type: "recommendation", label: "tomar agua" },
    { elder_id: elderId, type: "recommendation", label: "comer fruta" },
  ]);

  await admin.from("reminders").insert([
    {
      elder_id: elderId,
      type: "medication",
      title: "Medicamento de la mañana",
      message_text: FALLBACK_REMINDERS.medication.adultMessage,
      caregiver_message_text: FALLBACK_REMINDERS.medication.caregiverMessage,
      due_at: todayAt(8, 0).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      type: "meal",
      title: "Almuerzo",
      message_text: FALLBACK_REMINDERS.meal.adultMessage,
      caregiver_message_text: FALLBACK_REMINDERS.meal.caregiverMessage,
      due_at: todayAt(13, 0).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      type: "appointment",
      title: "Cita cardiólogo",
      message_text: FALLBACK_REMINDERS.appointment.adultMessage,
      caregiver_message_text: FALLBACK_REMINDERS.appointment.caregiverMessage,
      due_at: todayAt(14, 30).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      type: "exam",
      title: "Examen de sangre",
      message_text: FALLBACK_REMINDERS.exam.adultMessage,
      caregiver_message_text: FALLBACK_REMINDERS.exam.caregiverMessage,
      due_at: tomorrowAt(6, 30).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      type: "mood",
      title: "Check-in emocional",
      message_text: FALLBACK_REMINDERS.mood.adultMessage,
      caregiver_message_text: FALLBACK_REMINDERS.mood.caregiverMessage,
      due_at: todayAt(10, 0).toISOString(),
      status: "pending",
    },
  ]);

  await admin.from("interactions").insert({
    elder_id: elderId,
    type: "checkin",
    value: "Bien",
    metadata: { source: "seed" },
  });

  return {
    elderId,
    caregiverId: anaId,
    appointmentId: appointment?.id,
    demoCredentials: {
      caregiver: { email: DEMO_ANA_EMAIL, password: DEMO_PASSWORD },
      elder: { email: DEMO_MANUEL_EMAIL, password: DEMO_PASSWORD },
    },
  };
}
