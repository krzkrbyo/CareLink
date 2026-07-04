import Link from "next/link";
import { ChevronRight, User, UserPlus } from "lucide-react";
import { requireCaregiver, getCaregiverElders } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { AddElderForm } from "@/components/caregiver/AddElderForm";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { IconBox } from "@/components/ui/icon-box";
import { UserAvatar } from "@/components/ui/user-avatar";
import { elderCarePath } from "@/lib/elders/routes";

export default async function CuidadorPage() {
  const { user, profile } = await requireCaregiver();
  const elders = await getCaregiverElders(user.id);

  return (
    <div className="p-4 pb-24 lg:p-8 lg:pb-8">
      <PageHeader
        title={`Hola, ${profile.full_name}`}
        description={
          elders.length === 0
            ? "Comience registrando a la primera persona que cuida. Después podrá ver su resumen y configurar medicamentos."
            : `Administra el cuidado de ${elders.length} persona${elders.length === 1 ? "" : "s"}. Seleccione una para ver alertas y actividad.`
        }
      />

      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <SectionHeader
            icon={User}
            title="Personas a tu cargo"
            description="Selecciona una persona para ver su resumen diario."
          />
          {elders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-care-muted">
                <IconBox icon={UserPlus} tone="muted" size="lg" />
                <p>Aún no hay personas registradas. Use el formulario para crear la primera.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {elders.map((elder) => (
                <Link key={elder.id} href={elderCarePath(elder.slug, "dashboard")}>
                  <Card className="transition-all hover:border-care-accent/50 hover:shadow-md">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <UserAvatar
                          name={elder.full_name}
                          avatarUrl={elder.avatar_url}
                          size="md"
                          className="rounded-2xl"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-lg font-bold text-care-foreground">
                            {elder.full_name}
                          </p>
                          <p className="truncate text-sm text-care-muted">
                            {[elder.age ? `${elder.age} años` : null, elder.mood_today, elder.relationship]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-care-accent-dark">
                        <span className="hidden text-sm font-semibold sm:inline">Ver resumen</span>
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="agregar">
          <SectionHeader
            icon={UserPlus}
            title="Registrar nueva persona"
            description="Crea el perfil y las credenciales de acceso al portal del adulto mayor."
          />
          <AddElderForm />
        </section>
      </div>
    </div>
  );
}
