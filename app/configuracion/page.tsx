import { getProfileSettings } from "@/app/actions/settings";
import { SettingsView } from "@/components/settings/SettingsView";
import { PageHeader } from "@/components/layout/page-header";

export default async function ConfiguracionPage() {
  const profile = await getProfileSettings();

  return (
    <div className="p-4 lg:p-8">
      <PageHeader
        title="Mi cuenta"
        description="Tu perfil como cuidador, foto y preferencias de notificaciones."
        breadcrumbs={[
          { label: "Panel general", href: "/cuidador/resumen" },
          { label: "Mi cuenta" },
        ]}
      />
      <SettingsView profile={profile} />
    </div>
  );
}
