import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { elderCarePath } from "@/lib/elders/routes";

export async function revalidateElderCarePaths(elderId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("elders").select("slug").eq("id", elderId).single();

  if (data?.slug) {
    revalidatePath(elderCarePath(data.slug, "dashboard"));
    revalidatePath(elderCarePath(data.slug, "configuracion"));
    revalidatePath(elderCarePath(data.slug, "perfil"));
  }

  revalidatePath("/cuidador");
  revalidatePath("/cuidador/resumen");
  revalidatePath("/cuidador/dashboard");
  revalidatePath("/cuidador/configuracion");
  revalidatePath("/adulto");
}
