import { createClient } from "@/lib/supabase/server";
import { ConfigTabs } from "@/components/caregiver/ConfigTabs";
import { PageHeader } from "@/components/layout/page-header";
import { getElderWithAvatar } from "@/lib/data/elder-display";
import { getMedicalCatalog } from "@/app/actions/medical-catalog";
import { requireElderCarePage } from "@/lib/elders/page-access";
import { elderCarePath } from "@/lib/elders/routes";

export default async function ConfiguracionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { elderId } = await requireElderCarePage(slug, "configuracion");
  const supabase = await createClient();

  const elder = await getElderWithAvatar(elderId);

  const [
    { data: medications },
    { data: appointments },
    { data: foodRules },
    catalog,
  ] = await Promise.all([
    supabase.from("medications").select("*").eq("elder_id", elderId).order("created_at"),
    supabase.from("appointments").select("*").eq("elder_id", elderId).order("starts_at"),
    supabase.from("food_rules").select("*").eq("elder_id", elderId).order("created_at"),
    getMedicalCatalog(elderId),
  ]);

  return (
    <div className="p-4 pb-24 lg:p-8 lg:pb-8">
      <PageHeader
        title={`Plan de cuidado · ${elder?.full_name}`}
        description="Configure medicamentos, citas médicas y reglas alimenticias. Los cambios se reflejan en el portal del adulto mayor y en las alertas."
        breadcrumbs={[
          { label: "Mis personas", href: "/cuidador" },
          { label: elder?.full_name ?? "Plan", href: elderCarePath(slug, "dashboard") },
          { label: "Plan de cuidado" },
        ]}
        avatar={
          elder ? { name: elder.full_name, url: elder.avatar_url } : undefined
        }
      />

      <ConfigTabs
        elderId={elderId}
        medications={medications ?? []}
        appointments={appointments ?? []}
        foodRules={foodRules ?? []}
        catalog={catalog}
      />
    </div>
  );
}
