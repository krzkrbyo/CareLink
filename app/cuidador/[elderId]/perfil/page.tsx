import { requireCaregiverElderAccess } from "@/lib/auth/session";
import { getManagedElderSettings } from "@/app/actions/elder-settings";
import { ElderSettingsView } from "@/components/settings/ElderSettingsView";
import { PageHeader } from "@/components/layout/page-header";
import { getElderWithAvatar } from "@/lib/data/elder-display";

export default async function ElderPerfilPage({
  params,
}: {
  params: Promise<{ elderId: string }>;
}) {
  const { elderId } = await params;
  await requireCaregiverElderAccess(elderId);

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
          { label: elder?.full_name ?? "Persona", href: `/cuidador/${elderId}/dashboard` },
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
