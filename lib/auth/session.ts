import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { enrichEldersWithAvatars, type ElderWithAvatar } from "@/lib/data/elder-display";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Elder = Database["public"]["Tables"]["elders"]["Row"];
export type CaregiverElder = ElderWithAvatar;

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile() {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireCaregiver() {
  const user = await requireAuth();
  const profile = await getProfile();
  if (!profile || profile.role !== "caregiver") redirect("/adulto");
  return { user, profile };
}

export async function requireElder() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: elder } = await supabase
    .from("elders")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!elder) redirect("/login?error=no-elder-profile");
  return { user, elder };
}

export async function getCaregiverElders(caregiverId: string): Promise<CaregiverElder[]> {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("caregiver_elder_links")
    .select("elder_id, relationship, elders(*)")
    .eq("caregiver_id", caregiverId);

  const elders =
    links?.flatMap((l) => {
      const raw = l.elders as Elder | Elder[] | null;
      if (!raw) return [];
      const elder = Array.isArray(raw) ? raw[0] : raw;
      return [{ ...elder, relationship: l.relationship }];
    }) ?? [];

  return enrichEldersWithAvatars(elders);
}

export async function requireCaregiverElderAccess(elderId: string) {
  const { user, profile } = await requireCaregiver();
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("caregiver_elder_links")
    .select("id")
    .eq("caregiver_id", user.id)
    .eq("elder_id", elderId)
    .single();

  if (!link) redirect("/cuidador");
  return { user, profile, elderId };
}

export async function verifyCaregiverElderAccess(
  caregiverId: string,
  elderId: string
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("caregiver_elder_links")
    .select("id")
    .eq("caregiver_id", caregiverId)
    .eq("elder_id", elderId)
    .single();
  return !!data;
}
