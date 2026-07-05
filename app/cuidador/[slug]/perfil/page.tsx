import { getManagedElderSettings } from "@/app/actions/elder-settings";
import { ElderSettingsView } from "@/components/settings/ElderSettingsView";
import { PageHeader } from "@/components/layout/page-header";
import { getElderWithAvatar } from "@/lib/data/elder-display";
import { requireElderCarePage } from "@/lib/elders/page-access";
import { elderCarePath } from "@/lib/elders/routes";

export default async function ElderPerfilPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { elderId } = await requireElderCarePage(slug, "perfil");

  const [elder, settings] = await Promise.all([
    getElderWithAvatar(elderId),
    getManagedElderSettings(elderId),
  ]);

  return (
    <div className="p-4 pb-24 lg:p-8 lg:pb-8">
      <PageHeader
        title={`Perfil y ajustes · ${elder?.full_name ?? settings.full_name}`}
        description="Administra la foto, datos personales, notificaciones y contraseña de acceso de esta persona."
        breadcrumbs={[
          { label: "Mis personas", href: "/cuidador" },
          { label: elder?.full_name ?? "Persona", href: elderCarePath(slug, "dashboard") },
          { label: "Perfil y ajustes" },
        ]}
        avatar={
          elder
            ? { name: elder.full_name, url: elder.avatar_url }
            : { name: settings.full_name, url: settings.avatar_url }
        }
      />
      <ElderSettingsView settings={settings} />
    </div>
  );
}
