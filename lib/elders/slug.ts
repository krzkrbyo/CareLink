import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Supabase = SupabaseClient<Database>;

export function slugifyElderName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || "persona";
}

export async function createUniqueElderSlug(
  supabase: Supabase,
  fullName: string,
  preferredSlug?: string
): Promise<string> {
  const base = preferredSlug ?? slugifyElderName(fullName);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data } = await supabase
      .from("elders")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export const ELDER_ROUTE_RESERVED = new Set(["resumen", "dashboard", "configuracion"]);

export function isElderUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
