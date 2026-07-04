import { createClient } from "@/lib/supabase/server";
import { requireCaregiver, getCaregiverElders } from "@/lib/auth/session";
import { formatRelative } from "@/lib/utils";
import { computeActivityAnalytics, type ActivityAnalytics } from "@/lib/data/analytics";
import type { Alert, Interaction } from "@/types/database";
import type { ElderWithAvatar } from "@/lib/data/elder-display";
import { isSameDay } from "date-fns";

export interface ElderSummary {
  elder: ElderWithAvatar;
  activeAlerts: number;
  alerts: Alert[];
  mood: string;
  inactiveMins: number;
  lastActivity: string;
  checkinToday: boolean;
  medPending: boolean;
  interactionsToday: number;
  analytics: ActivityAnalytics;
  needsAttention: boolean;
}

export interface CaregiverOverview {
  summaries: ElderSummary[];
  totals: {
    elders: number;
    activeAlerts: number;
    interactionsToday: number;
    interactionsWeek: number;
    eldersNeedingAttention: number;
    avgActivityPerPerson: number;
  };
  combinedByType: { label: string; count: number }[];
  combinedByDay: { label: string; count: number }[];
}

export async function getCaregiverOverview(): Promise<CaregiverOverview> {
  const { user } = await requireCaregiver();
  const elders = await getCaregiverElders(user.id);
  const supabase = await createClient();

  const summaries: ElderSummary[] = await Promise.all(
    elders.map(async (elder) => {
      const [
        { data: alerts },
        { data: interactions },
        { data: reminders },
      ] = await Promise.all([
        supabase
          .from("alerts")
          .select("*")
          .eq("elder_id", elder.id)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase
          .from("interactions")
          .select("*")
          .eq("elder_id", elder.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("reminders")
          .select("*")
          .eq("elder_id", elder.id)
          .eq("type", "medication")
          .eq("status", "pending"),
      ]);

      const list = (interactions ?? []) as Interaction[];
      const analytics = computeActivityAnalytics(list);
      const now = new Date();

      const checkinToday = list.some(
        (i) => i.type === "checkin" && isSameDay(new Date(i.created_at), now)
      );

      const inactiveMins = elder.last_activity_at
        ? Math.floor(
            (Date.now() - new Date(elder.last_activity_at).getTime()) / 60000
          )
        : 999;

      const activeAlerts = alerts?.length ?? 0;
      const needsAttention =
        activeAlerts > 0 || inactiveMins > 120 || !checkinToday;

      return {
        elder,
        activeAlerts,
        alerts: (alerts ?? []) as Alert[],
        mood: elder.mood_today ?? "—",
        inactiveMins,
        lastActivity: elder.last_activity_at
          ? formatRelative(elder.last_activity_at)
          : "Sin registro",
        checkinToday,
        medPending: (reminders?.length ?? 0) > 0,
        interactionsToday: analytics.interactionsToday,
        analytics,
        needsAttention,
      };
    })
  );

  const combinedTypeMap = new Map<string, number>();
  const combinedDayMap = new Map<string, number>();

  for (const s of summaries) {
    for (const t of s.analytics.byType) {
      combinedTypeMap.set(t.label, (combinedTypeMap.get(t.label) ?? 0) + t.count);
    }
    for (const d of s.analytics.byDay) {
      combinedDayMap.set(d.label, (combinedDayMap.get(d.label) ?? 0) + d.count);
    }
  }

  const interactionsWeek = summaries.reduce(
    (acc, s) => acc + s.analytics.totalLast7Days,
    0
  );
  const interactionsToday = summaries.reduce(
    (acc, s) => acc + s.interactionsToday,
    0
  );

  return {
    summaries: summaries.sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      return b.activeAlerts - a.activeAlerts;
    }),
    totals: {
      elders: summaries.length,
      activeAlerts: summaries.reduce((acc, s) => acc + s.activeAlerts, 0),
      interactionsToday,
      interactionsWeek,
      eldersNeedingAttention: summaries.filter((s) => s.needsAttention).length,
      avgActivityPerPerson:
        summaries.length > 0
          ? Math.round((interactionsWeek / summaries.length) * 10) / 10
          : 0,
    },
    combinedByType: Array.from(combinedTypeMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    combinedByDay: summaries[0]?.analytics.byDay.map((d) => ({
      label: d.label,
      count: combinedDayMap.get(d.label) ?? 0,
    })) ?? [],
  };
}
