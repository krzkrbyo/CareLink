import { createClient } from "@/lib/supabase/server";
import type { Elder } from "@/types/database";

export type ElderWithAvatar = Elder & {
  avatar_url: string | null;
  relationship?: string | null;
};

export async function fetchAvatarsForAuthUsers(
  authUserIds: (string | null | undefined)[]
): Promise<Map<string, string | null>> {
  const ids = [...new Set(authUserIds.filter(Boolean))] as string[];
  if (ids.length === 0) return new Map();

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .in("id", ids);

  return new Map(profiles?.map((p) => [p.id, p.avatar_url ?? null]) ?? []);
}

export function attachAvatarToElder<T extends Elder>(
  elder: T,
  avatars: Map<string, string | null>
): T & { avatar_url: string | null } {
  return {
    ...elder,
    avatar_url: elder.auth_user_id ? avatars.get(elder.auth_user_id) ?? null : null,
  };
}

export async function enrichEldersWithAvatars<T extends Elder>(
  elders: T[]
): Promise<(T & { avatar_url: string | null })[]> {
  const avatars = await fetchAvatarsForAuthUsers(elders.map((e) => e.auth_user_id));
  return elders.map((e) => attachAvatarToElder(e, avatars));
}

export async function getElderWithAvatar(elderId: string): Promise<ElderWithAvatar | null> {
  const supabase = await createClient();
  const { data: elder } = await supabase.from("elders").select("*").eq("id", elderId).single();
  if (!elder) return null;

  const avatars = await fetchAvatarsForAuthUsers([elder.auth_user_id]);
  return attachAvatarToElder(elder, avatars);
}
