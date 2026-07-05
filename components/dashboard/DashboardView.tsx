import {
  Activity,
  BellRing,
  CalendarClock,
  ClipboardList,
  Clock3,
  Lightbulb,
  Pill,
  Salad,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { MoodCard } from "@/components/dashboard/MoodCard";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { CalendarExportButton } from "@/components/caregiver/CalendarExportButton";
import { DashboardLive } from "@/components/dashboard/DashboardLive";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { ActivityChartsSection } from "@/components/dashboard/ActivityChartsSection";
import { getDashboardData, formatTime } from "@/lib/data/dashboard";

interface DashboardViewProps {
  elderId: string;
}

export async function DashboardView({ elderId }: DashboardViewProps) {
  const data = await getDashboardData(elderId);

  return (
    <div className="p-4 pb-10 lg:p-8">
      <DashboardLive elderId={elderId} />

      <PageHeader
        title={`Resumen de ${data.elder?.full_name}`}
        description="Vista en tiempo real del estado de la persona a su cargo: alertas, rutina diaria y actividad reciente."
        breadcrumbs={[
          { label: "Mis personas", href: "/cuidador" },
          { label: data.elder?.full_name ?? "Resumen" },
        ]}
        avatar={
          data.elder
            ? { name: data.elder.full_name, url: data.elder.avatar_url }
            : undefined
        }
      />

      <section className="mb-8">
        <SectionHeader
          icon={BellRing}
          tone="danger"
          title="Alertas que requieren atención"
          description="Revise y marque como resueltas cuando haya actuado."
        />
        <AlertsPanel alerts={data.alerts} elderId={elderId} />
      </section>

      <section className="mb-8">
        <SectionHeader
          icon={UserCheck}
          title="Resumen de hoy"
          description="Medicamento, check-in y estado de ánimo del día."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatusCard
            icon={Pill}
            title="Medicamento"
            status={data.medReminder?.status === "completed" ? "Tomado" : "Pendiente"}
            detail={data.medReminder?.title}
            variant={data.medReminder?.status === "completed" ? "success" : "warning"}
          />
          <StatusCard
            icon={UserCheck}
            title="Check-in diario"
            status={data.checkinToday ? "Realizado" : "Pendiente"}
            variant={data.checkinToday ? "success" : "pending"}
          />
          <MoodCard mood={data.elder?.mood_today ?? "Bien"} />
        </div>
      </section>

      <section className="mb-8">
        <SectionHeader
          icon={Activity}
          title="Seguimiento y próximos eventos"
          description="Actividad, citas, exámenes y restricciones alimenticias."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatusCard
            icon={Clock3}
            title="Última actividad"
            status={data.lastActivity}
            variant={data.inactiveMins > 120 ? "danger" : "success"}
          />
          <StatusCard
            icon={Activity}
            title="Tiempo sin actividad"
            status={data.inactiveMins < 60 ? "Activo ahora" : `${data.inactiveMins} min`}
            variant={data.inactiveMins > 120 ? "danger" : "success"}
          />
          {data.nextAppointment && (
            <StatusCard
              icon={Stethoscope}
              title="Próxima cita"
              status={data.nextAppointment.title}
              detail={[
                data.nextAppointment.facility_name,
                formatTime(data.nextAppointment.starts_at),
              ]
                .filter(Boolean)
                .join(" · ")}
              variant="pending"
            />
          )}
          {data.nextExam && (
            <StatusCard
              icon={CalendarClock}
              title="Próximo examen"
              status={data.nextExam.title}
              detail={[
                data.nextExam.facility_name,
                formatTime(data.nextExam.starts_at),
              ]
                .filter(Boolean)
                .join(" · ")}
              variant="pending"
            />
          )}
          <StatusCard
            icon={Salad}
            title="Restricciones alimenticias"
            status={`Evitar: ${data.prohibited.join(", ") || "—"}`}
            detail={`Reducir: ${data.reduce.join(", ") || "—"}`}
            variant="pending"
          />
        </div>
      </section>

      {data.nextAppointment && (
        <div className="mb-8 flex flex-wrap gap-3">
          <CalendarExportButton eventId={data.nextAppointment.id} />
          {data.nextExam && (
            <CalendarExportButton eventId={data.nextExam.id} label="Exportar examen al calendario" />
          )}
        </div>
      )}
      {!data.nextAppointment && data.nextExam && (
        <div className="mb-8">
          <CalendarExportButton eventId={data.nextExam.id} label="Exportar examen al calendario" />
        </div>
      )}

      <section className="mb-8">
        <SectionHeader
          icon={Lightbulb}
          title="Acción sugerida"
          description="Recomendación basada en la actividad reciente."
        />
        <p className="care-surface p-4 text-lg text-care-foreground lg:p-6">
          {data.suggestedAction}
        </p>
      </section>

      <ActivityChartsSection analytics={data.analytics} />

      <section>
        <SectionHeader
          icon={ClipboardList}
          title="Historial de actividad"
          description="Registro de interacciones más recientes en el portal."
        />
        <ActivityTimeline interactions={data.interactions} />
      </section>

      <form action="/api/demo/reset" method="POST" className="mt-8">
        <button
          type="submit"
          className="rounded-xl border-2 border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Reiniciar demo Don Manuel
        </button>
      </form>
    </div>
  );
}
