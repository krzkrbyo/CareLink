import {
  CalendarClock,
  Clock,
  Info,
  Pill,
  Stethoscope,
} from "lucide-react";
import { SectionHeader } from "@/components/layout/section-header";
import { IconBox } from "@/components/ui/icon-box";
import type {
  ElderAppointmentView,
  ElderCarePlan,
  ElderFoodRuleView,
  ElderMedicationView,
} from "@/lib/data/elder-care-plan";
import { FoodRulesGrid } from "@/components/elder/FoodRulesGrid";

interface ElderCarePlanSectionProps {
  plan: ElderCarePlan;
}

/** Legacy full plan section — kept for compatibility. */
export function ElderCarePlanSection({ plan }: ElderCarePlanSectionProps) {
  const upcomingToday = plan.todayAgenda.filter((item) => !item.isPast);
  const pastToday = plan.todayAgenda.filter((item) => item.isPast);

  return (
    <div className="space-y-8">
      {(upcomingToday.length > 0 || pastToday.length > 0) && (
        <div>
          <SectionHeader
            icon={Clock}
            title="Lo que le toca hoy"
            description="Sus medicamentos y citas programadas para este día."
          />
          <div className="space-y-3">
            {upcomingToday.map((item) => (
              <AgendaCard key={item.id} item={item} />
            ))}
            {pastToday.map((item) => (
              <AgendaCard key={item.id} item={item} muted />
            ))}
          </div>
        </div>
      )}

      <ElderMedicationsList medications={plan.medications} />
      <ElderAppointmentsList appointments={plan.appointments} />
      <ElderFoodRulesList foodRules={plan.foodRules} />
    </div>
  );
}

export function ElderMedicationsList({ medications }: { medications: ElderMedicationView[] }) {
  return (
    <div>
      <SectionHeader
        icon={Pill}
        title="Todos mis medicamentos"
        description="Nombre, horarios e indicaciones de cada medicamento."
      />
      {medications.length === 0 ? (
        <EmptyState text="Su cuidador aún no ha registrado medicamentos." />
      ) : (
        <div className="space-y-4">
          {medications.map((med) => (
            <MedicationCard key={med.id} med={med} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ElderAppointmentsList({ appointments }: { appointments: ElderAppointmentView[] }) {
  const upcoming = appointments.filter((a) => !a.isPast);

  return (
    <div>
      <SectionHeader
        icon={CalendarClock}
        title="Todas las citas y exámenes"
        description="Listado completo de visitas médicas y estudios programados."
      />
      {upcoming.length === 0 ? (
        <EmptyState text="No tiene citas ni exámenes próximos registrados." />
      ) : (
        <div className="space-y-4">
          {upcoming.map((appt) => (
            <AppointmentCard key={appt.id} appt={appt} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ElderFoodRulesList({ foodRules }: { foodRules: ElderFoodRuleView[] }) {
  return <FoodRulesGrid foodRules={foodRules} />;
}

function MedicationCard({ med }: { med: ElderMedicationView }) {
  return (
    <article className="care-surface p-5">
      <div className="flex items-start gap-4">
        <IconBox icon={Pill} tone="accent" size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-care-foreground">{med.name}</h3>
          {med.dose && (
            <p className="mt-1 text-lg font-semibold text-care-accent-darker">
              Dosis: {med.dose}
            </p>
          )}
        </div>
      </div>

      <dl className="mt-4 space-y-3 text-base">
        <DetailRow label="Horario" value={med.scheduleSummary} />
        <DetailRow label="Días" value={med.frequencyLabel} />
        {med.appliesToday && med.timesTodayLabels.length > 0 && (
          <DetailRow
            label="Hoy le toca"
            value={med.timesTodayLabels.join(" · ")}
            highlight
          />
        )}
        {med.durationLabel && (
          <DetailRow label="Tratamiento" value={med.durationLabel} />
        )}
        {med.notes && (
          <div className="rounded-xl bg-care-primary/60 px-4 py-3">
            <dt className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-care-muted">
              <Info className="h-4 w-4" />
              Indicaciones
            </dt>
            <dd className="mt-1 text-care-foreground">{med.notes}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

function AppointmentCard({ appt }: { appt: ElderAppointmentView }) {
  return (
    <article
      className={`care-surface p-5 ${appt.isToday ? "ring-2 ring-care-accent/40" : ""}`}
    >
      <div className="flex items-start gap-4">
        <IconBox
          icon={appt.type === "examen" ? Stethoscope : CalendarClock}
          tone={appt.type === "examen" ? "secondary" : "accent"}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-care-muted">
            {appt.typeLabel}
            {appt.isToday && (
              <span className="ml-2 rounded-full bg-care-accent/30 px-2 py-0.5 text-care-accent-darker">
                Hoy
              </span>
            )}
          </p>
          <h3 className="mt-1 text-xl font-bold text-care-foreground">{appt.title}</h3>
          <p className="mt-2 text-lg text-care-foreground">
            <span className="font-semibold capitalize">{appt.dateLabel}</span>
            {" · "}
            <span>{appt.timeLabel}</span>
          </p>
          {appt.notes && (
            <p className="mt-3 rounded-xl bg-care-primary/60 px-4 py-3 text-care-foreground">
              <span className="font-semibold">Indicaciones: </span>
              {appt.notes}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      <dt className="font-semibold text-care-muted">{label}:</dt>
      <dd className={highlight ? "font-bold text-care-accent-darker" : "text-care-foreground"}>
        {value}
      </dd>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="care-surface px-5 py-8 text-center text-lg text-care-muted">{text}</div>
  );
}

function AgendaCard({
  item,
  muted,
}: {
  item: ElderCarePlan["todayAgenda"][number];
  muted?: boolean;
}) {
  const Icon = item.kind === "medication" ? Pill : item.kind === "examen" ? Stethoscope : CalendarClock;

  return (
    <article
      className={`care-surface flex items-center gap-4 p-4 ${muted ? "opacity-60" : ""}`}
    >
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-care-accent/20 text-care-accent-darker">
        <span className="text-xs font-semibold uppercase">{muted ? "Hecho" : "Hora"}</span>
        <span className="text-sm font-bold leading-tight">{item.time}</span>
      </div>
      <IconBox icon={Icon} tone={item.kind === "medication" ? "accent" : "secondary"} size="md" />
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-care-foreground">{item.title}</p>
        <p className="text-base text-care-muted">{item.subtitle}</p>
      </div>
    </article>
  );
}
