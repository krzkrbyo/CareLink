import { createClient } from "@/lib/supabase/server";
import { requireCaregiverElderAccess } from "@/lib/auth/session";
import { formatRelative, formatTime } from "@/lib/utils";
import { computeActivityAnalytics } from "@/lib/data/analytics";
import type { Alert, Interaction } from "@/types/database";
import { attachAvatarToElder, fetchAvatarsForAuthUsers } from "@/lib/data/elder-display";

export async function getDashboardData(elderId: string) {
  await requireCaregiverElderAccess(elderId);
  const supabase = await createClient();

  const [
    { data: elder },
    { data: reminders },
    { data: alerts },
    { data: interactions },
    { data: appointments },
    { data: foodRules },
  ] = await Promise.all([
    supabase.from("elders").select("*").eq("id", elderId).single(),
    supabase.from("reminders").select("*").eq("elder_id", elderId),
    supabase
      .from("alerts")
      .select("*")
      .eq("elder_id", elderId)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("interactions")
      .select("*")
      .eq("elder_id", elderId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("appointments")
      .select("*")
      .eq("elder_id", elderId)
      .order("starts_at", { ascending: true }),
    supabase.from("food_rules").select("*").eq("elder_id", elderId),
  ]);

  const medReminder = reminders?.find((r) => r.type === "medication");
  const checkinToday = interactions?.some(
    (i) =>
      i.type === "checkin" &&
      new Date(i.created_at).toDateString() === new Date().toDateString()
  );
  const nextAppointment = appointments?.find(
    (a) =>
      a.type === "cita" &&
      new Date(a.starts_at) >= new Date() &&
      a.status !== "cancelled" &&
      a.status !== "completed"
  );
  const nextExam = appointments?.find(
    (a) =>
      a.type === "examen" &&
      new Date(a.starts_at) >= new Date() &&
      a.status !== "cancelled" &&
      a.status !== "completed"
  );

  const prohibited =
    foodRules?.filter((f) => f.type === "prohibited").map((f) => f.label) ?? [];
  const reduce =
    foodRules?.filter((f) => f.type === "reduce").map((f) => f.label) ?? [];

  const lastActivity = elder?.last_activity_at
    ? formatRelative(elder.last_activity_at)
    : "Sin registro";

  const inactiveMins = elder?.last_activity_at
    ? Math.floor(
        (Date.now() - new Date(elder.last_activity_at).getTime()) / 60000
      )
    : 999;

  let suggestedAction = `Todo en orden. Puede llamar a ${elder?.full_name ?? "la persona"} para saludar.`;
  if (alerts && alerts.length > 0) {
    suggestedAction =
      alerts[0].severity === "high"
        ? "Contactar de inmediato."
        : "Revisar alerta y llamar con cariño.";
  } else if (medReminder?.status === "pending") {
    suggestedAction = "Recordar medicamento si aún no lo ha tomado.";
  }

  const allInteractions = (interactions ?? []) as Interaction[];
  const analytics = computeActivityAnalytics(allInteractions);

  const avatars = await fetchAvatarsForAuthUsers([elder?.auth_user_id]);
  const elderWithAvatar = elder
    ? attachAvatarToElder(elder, avatars)
    : null;

  return {
    elder: elderWithAvatar,
    medReminder,
    checkinToday,
    nextAppointment,
    nextExam,
    alerts: (alerts ?? []) as Alert[],
    interactions: allInteractions.slice(0, 10),
    analytics,
    prohibited,
    reduce,
    lastActivity,
    inactiveMins,
    suggestedAction,
  };
}

export { formatTime };
