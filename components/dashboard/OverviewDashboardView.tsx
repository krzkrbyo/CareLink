import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  LayoutGrid,
  Users,
  Activity,
  BellRing,
} from "lucide-react";
import { getCaregiverOverview } from "@/lib/data/overview";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { BarChart } from "@/components/charts/BarChart";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { IconBox } from "@/components/ui/icon-box";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { elderCarePath } from "@/lib/elders/routes";

export async function OverviewDashboardView() {
  const overview = await getCaregiverOverview();
  const { totals, summaries, combinedByDay, combinedByType } = overview;

  return (
    <div className="p-4 pb-10 lg:p-8">
      <PageHeader
        title="Panel general"
        description="Resumen consolidado de todas las personas bajo su cuidado: alertas, actividad y tendencias."
        breadcrumbs={[{ label: "Panel general" }]}
      />

      <section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryKpi
          icon={Users}
          label="Personas a cargo"
          value={String(totals.elders)}
          tone="accent"
        />
        <SummaryKpi
          icon={BellRing}
          label="Alertas activas"
          value={String(totals.activeAlerts)}
          tone={totals.activeAlerts > 0 ? "danger" : "success"}
          detail={
            totals.eldersNeedingAttention > 0
              ? `${totals.eldersNeedingAttention} requieren atención`
              : "Todo en orden"
          }
        />
        <SummaryKpi
          icon={Activity}
          label="Actividad hoy"
          value={String(totals.interactionsToday)}
          detail={`${totals.interactionsWeek} esta semana`}
          tone="secondary"
        />
        <SummaryKpi
          icon={BarChart3}
          label="Promedio semanal"
          value={String(totals.avgActivityPerPerson)}
          detail="Interacciones por persona"
          tone="muted"
        />
      </section>

      {summaries.length > 0 && (
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="care-surface p-4 lg:p-5">
            <SectionHeader
              icon={BarChart3}
              title="Actividad combinada por día"
              description="Todas las personas — últimos 7 días"
            />
            <BarChart data={combinedByDay.map((d) => ({ label: d.label, value: d.count }))} />
          </div>
          <div className="care-surface p-4 lg:p-5">
            <SectionHeader
              icon={LayoutGrid}
              title="Actividades más frecuentes"
              description="Suma de todas las personas a cargo"
            />
            <HorizontalBarChart
              data={combinedByType.map((t) => ({ label: t.label, value: t.count }))}
            />
          </div>
        </section>
      )}

      <section>
        <SectionHeader
          icon={Users}
          title="Resumen por persona"
          description="Estado actual y acceso rápido al detalle de cada persona."
        />

        {summaries.length === 0 ? (
          <div className="care-surface py-12 text-center">
            <p className="text-care-muted">Aún no tiene personas registradas.</p>
            <Button asChild className="mt-4">
              <Link href="/cuidador#agregar">Agregar primera persona</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summaries.map((s) => (
              <Link
                key={s.elder.id}
                href={elderCarePath(s.elder.slug, "dashboard")}
                className="group block"
              >
                <article
                  className={`care-surface h-full p-4 transition-shadow hover:shadow-md ${
                    s.needsAttention ? "ring-2 ring-care-secondary" : ""
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={s.elder.full_name}
                        avatarUrl={s.elder.avatar_url ?? null}
                        size="md"
                      />
                      <div>
                        <h3 className="font-bold text-care-foreground group-hover:text-care-accent-darker">
                          {s.elder.full_name}
                        </h3>
                        <p className="text-sm text-care-muted">
                          {s.elder.age ? `${s.elder.age} años` : ""}
                          {s.elder.relationship ? ` · ${s.elder.relationship}` : ""}
                        </p>
                      </div>
                    </div>
                    {s.needsAttention && (
                      <IconBox icon={AlertTriangle} tone="danger" size="sm" />
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <Stat label="Estado de ánimo" value={s.mood} />
                    <Stat label="Alertas" value={String(s.activeAlerts)} highlight={s.activeAlerts > 0} />
                    <Stat label="Check-in hoy" value={s.checkinToday ? "Sí ✓" : "Pendiente"} />
                    <Stat label="Medicamento" value={s.medPending ? "Pendiente" : "Al día"} />
                    <Stat label="Actividad hoy" value={String(s.interactionsToday)} />
                    <Stat label="Última actividad" value={s.lastActivity} />
                  </dl>

                  <div className="mt-3 flex items-center justify-between border-t border-care-secondary/40 pt-3 text-sm">
                    <span className="text-care-muted">
                      {s.analytics.totalLast7Days} actividades / 7 días
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-care-accent-darker">
                      Ver detalle
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryKpi({
  icon: Icon,
  label,
  value,
  detail,
  tone = "accent",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail?: string;
  tone?: "accent" | "secondary" | "success" | "danger" | "muted";
}) {
  return (
    <div className="care-surface flex gap-3 p-4">
      <IconBox icon={Icon} tone={tone} size="sm" />
      <div>
        <p className="text-sm text-care-muted">{label}</p>
        <p className="text-2xl font-bold text-care-foreground">{value}</p>
        {detail && <p className="text-xs text-care-muted-light">{detail}</p>}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-care-primary/50 px-2 py-1.5">
      <dt className="text-xs text-care-muted-light">{label}</dt>
      <dd
        className={`truncate font-semibold ${highlight ? "text-red-700" : "text-care-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}
