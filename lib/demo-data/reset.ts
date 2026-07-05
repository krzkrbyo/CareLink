import { createAdminClient } from "@/lib/supabase/server";
import {
  DEMO_ELDER_ID,
  DEMO_ELDER_SLUG,
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
  await admin.from("medical_professionals").delete().eq("elder_id", elderId);
  await admin.from("medical_facilities").delete().eq("elder_id", elderId);
  await admin.from("medications").delete().eq("elder_id", elderId);
  await admin.from("caregiver_elder_links").delete().eq("elder_id", elderId);

  await admin.from("elders").upsert({
    id: elderId,
    full_name: ELDER_NAME,
    slug: DEMO_ELDER_SLUG,
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

  await admin.from("medications").insert([
    {
      elder_id: elderId,
      name: "Pastilla para la presión",
      dose: "1 tableta",
      time: "08:00",
      scheduled_time: "08:00:00",
      frequency: "1x/día",
      notes: "Tomar con agua, en ayunas",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null,
      schedule: {
        times: ["08:00"],
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      },
      calendar_export_enabled: true,
      active: true,
    },
    {
      elder_id: elderId,
      name: "Protector gástrico",
      dose: "1 cápsula",
      time: "08:00",
      scheduled_time: "08:00:00",
      frequency: "1x/día",
      notes: "Tomar junto con la pastilla para la presión",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null,
      schedule: {
        times: ["08:00"],
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      },
      calendar_export_enabled: true,
      active: true,
    },
    {
      elder_id: elderId,
      name: "Pastilla para la presión (noche)",
      dose: "1 tableta",
      time: "20:00",
      scheduled_time: "20:00:00",
      frequency: "1x/día",
      notes: "Tomar después de la cena",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null,
      schedule: {
        times: ["20:00"],
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      },
      calendar_export_enabled: true,
      active: true,
    },
  ]);

  const { data: hospital } = await admin
    .from("medical_facilities")
    .insert({
      elder_id: elderId,
      name: "Hospital General San José",
      type: "hospital",
      address: "Av. Insurgentes Sur 1234, CDMX",
      phone: "55 5000 1234",
    })
    .select("id")
    .single();

  const { data: lab } = await admin
    .from("medical_facilities")
    .insert({
      elder_id: elderId,
      name: "Laboratorio Clínico Central",
      type: "laboratorio",
      address: "Calle Reforma 456, CDMX",
      phone: "55 5000 5678",
    })
    .select("id")
    .single();

  const { data: cardiologist } = await admin
    .from("medical_professionals")
    .insert({
      elder_id: elderId,
      facility_id: hospital?.id ?? null,
      full_name: "Dr. Roberto Méndez",
      specialty: "Cardiología",
      phone: "55 5000 9999",
    })
    .select("id")
    .single();

  const { data: appointment } = await admin
    .from("appointments")
    .insert({
      elder_id: elderId,
      title: "Consulta — Dr. Roberto Méndez (Cardiología)",
      type: "cita",
      starts_at: todayAt(15, 0).toISOString(),
      notes: "Llevar documentos y exámenes previos",
      facility_id: hospital?.id ?? null,
      professional_id: cardiologist?.id ?? null,
      facility_name: "Hospital General San José",
      professional_name: "Dr. Roberto Méndez",
      location_text: "Av. Insurgentes Sur 1234, CDMX",
      duration_minutes: 60,
      status: "scheduled",
      calendar_export_enabled: true,
    })
    .select("id")
    .single();

  const { data: examAppointment } = await admin
    .from("appointments")
    .insert({
      elder_id: elderId,
      title: "Examen de sangre — Laboratorio Clínico Central",
      type: "examen",
      starts_at: tomorrowAt(7, 0).toISOString(),
      preparation_notes: "Ayuno de 8 horas. Llevar orden médica.",
      notes: "Presentarse 15 minutos antes",
      facility_id: lab?.id ?? null,
      facility_name: "Laboratorio Clínico Central",
      location_text: "Calle Reforma 456, CDMX",
      exam_subtype: "sangre",
      duration_minutes: 30,
      status: "scheduled",
      calendar_export_enabled: true,
    })
    .select("id")
    .single();

  await admin.from("food_rules").insert([
    {
      elder_id: elderId,
      type: "prohibited",
      label: "tortillas",
      notes: "Alto en sodio y carbohidratos refinados",
    },
    {
      elder_id: elderId,
      type: "prohibited",
      label: "embutidos",
      notes: "Salchichas, jamón y carnes frías — muy altos en sodio",
    },
    {
      elder_id: elderId,
      type: "prohibited",
      label: "comida frita",
      notes: "Aumenta colesterol y presión arterial",
    },
    {
      elder_id: elderId,
      type: "prohibited",
      label: "alcohol",
      notes: "Puede elevar la presión y afectar los medicamentos",
    },
    {
      elder_id: elderId,
      type: "reduce",
      label: "sal",
      notes: "Usar hierbas y especias en lugar de sal de mesa",
    },
    {
      elder_id: elderId,
      type: "reduce",
      label: "café",
      notes: "Máximo una taza al día; preferir descafeinado",
    },
    {
      elder_id: elderId,
      type: "reduce",
      label: "quesos salados",
      notes: "Optar por quesos bajos en sodio",
    },
    {
      elder_id: elderId,
      type: "recommendation",
      label: "tomar agua",
      notes: "Al menos 6 a 8 vasos al día, distribuidos en el día",
    },
    {
      elder_id: elderId,
      type: "recommendation",
      label: "comer fruta",
      notes: "Plátano, manzana, sandía — ricas en potasio",
    },
    {
      elder_id: elderId,
      type: "recommendation",
      label: "verduras al vapor",
      notes: "Brócoli, espinaca y calabaza sin sal añadida",
    },
    {
      elder_id: elderId,
      type: "recommendation",
      label: "pescado",
      notes: "Sardina o salmón 2 veces por semana",
    },
    {
      elder_id: elderId,
      type: "recommendation",
      label: "avena",
      notes: "Buena opción para el desayuno, ayuda al colesterol",
    },
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
      title: "Desayuno",
      message_text:
        "Buenos días, Don Manuel. Es hora del desayuno. Prefiera avena, fruta y evite sal.",
      caregiver_message_text: "Hora del desayuno de Don Manuel.",
      due_at: todayAt(7, 30).toISOString(),
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
      type: "meal",
      title: "Merienda",
      message_text:
        "Don Manuel, es hora de la merienda. Una fruta o yogurt bajo en grasa es ideal.",
      caregiver_message_text: "Hora de la merienda de Don Manuel.",
      due_at: todayAt(17, 0).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      type: "meal",
      title: "Cena",
      message_text:
        "Don Manuel, es hora de la cena. Comida ligera: evite frituras y embutidos.",
      caregiver_message_text: "Hora de la cena de Don Manuel.",
      due_at: todayAt(19, 30).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      type: "activity",
      title: "Caminata suave",
      message_text: "15 minutos de caminata tranquila en casa o en el jardín.",
      caregiver_message_text: "Don Manuel tiene caminata suave programada.",
      due_at: todayAt(10, 0).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      type: "activity",
      title: "Ejercicios de equilibrio",
      message_text: "Estiramientos suaves y ejercicios de equilibrio durante 10 minutos.",
      caregiver_message_text: "Don Manuel tiene ejercicios de equilibrio programados.",
      due_at: todayAt(11, 30).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      type: "hydration",
      title: "Beber agua",
      message_text: "Recuerde tomar un vaso de agua. La hidratación ayuda a la presión.",
      caregiver_message_text: "Recordatorio de hidratación para Don Manuel.",
      due_at: todayAt(12, 0).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      type: "activity",
      title: "Lectura o pasatiempo",
      message_text: "Dedique un rato a leer o a una actividad que disfrute.",
      caregiver_message_text: "Don Manuel tiene tiempo de lectura programado.",
      due_at: todayAt(16, 0).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      appointment_id: appointment?.id ?? null,
      type: "appointment",
      title: "Consulta — Dr. Roberto Méndez (Cardiología)",
      message_text:
        "Don Manuel, hoy tiene cita con el Dr. Roberto Méndez en Hospital General San José a las 3:00 PM. Lleve sus documentos y exámenes.",
      caregiver_message_text:
        "Cita cardiólogo programada hoy 3:00 PM — Hospital General San José.",
      due_at: todayAt(14, 30).toISOString(),
      status: "pending",
    },
    {
      elder_id: elderId,
      appointment_id: examAppointment?.id ?? null,
      type: "exam",
      title: "Examen de sangre — Laboratorio Clínico Central",
      message_text:
        "Don Manuel, mañana tiene examen de sangre en Laboratorio Clínico Central. Recuerde ayuno de 8 horas y llevar orden médica.",
      caregiver_message_text: "Examen de sangre programado — ayuno 8 horas.",
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
