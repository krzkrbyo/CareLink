"use client";

import { CalendarClock, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import type { ElderAppointmentView } from "@/lib/data/elder-care-plan";

interface NextAppointmentCardProps {
  appointments: ElderAppointmentView[];
  onViewAll?: () => void;
  showViewAll?: boolean;
}

export function NextAppointmentCard({
  appointments,
  onViewAll,
  showViewAll,
}: NextAppointmentCardProps) {
  if (appointments.length === 0) {
    return (
      <article className="care-surface flex flex-col items-center justify-center p-6 text-center">
        <IconBox icon={CalendarClock} tone="muted" size="lg" />
        <p className="mt-4 text-lg font-semibold text-care-muted">
          No tiene citas ni exámenes próximos
        </p>
        {showViewAll && onViewAll && (
          <Button variant="outline" size="default" className="mt-4" onClick={onViewAll}>
            Ver todas las citas
          </Button>
        )}
      </article>
    );
  }

  const isMultiple = appointments.length > 1;

  return (
    <div className="space-y-4">
      {appointments.map((appt) => (
        <AppointmentHighlight key={appt.id} appt={appt} isMultiple={isMultiple} />
      ))}

      {showViewAll && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="w-full text-center text-base font-semibold text-care-accent-dark underline-offset-2 hover:underline"
        >
          Ver todas las citas y exámenes
        </button>
      )}
    </div>
  );
}

function AppointmentHighlight({
  appt,
  isMultiple,
}: {
  appt: ElderAppointmentView;
  isMultiple: boolean;
}) {
  const Icon = appt.type === "examen" ? Stethoscope : CalendarClock;

  return (
    <article
      className={`care-surface flex flex-col gap-4 p-6 lg:p-8 ${
        appt.isToday ? "ring-2 ring-care-accent/50 bg-gradient-to-br from-care-accent/10 to-white" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <IconBox
          icon={Icon}
          tone={appt.type === "examen" ? "secondary" : "accent"}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-care-muted">
            {isMultiple ? "Próxima cita" : "Su próxima cita"}
            {appt.isToday && (
              <span className="ml-2 rounded-full bg-care-accent/30 px-2 py-0.5 text-care-accent-darker">
                Hoy
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm font-medium text-care-muted">{appt.typeLabel}</p>
          <h3 className="mt-2 text-2xl font-bold text-care-foreground">{appt.title}</h3>
          <p className="mt-2 text-xl text-care-foreground">
            <span className="font-bold capitalize">{appt.dateLabel}</span>
            {" · "}
            <span className="font-semibold">{appt.timeLabel}</span>
          </p>
          {appt.notes && (
            <p className="mt-3 rounded-xl bg-care-primary/60 px-4 py-3 text-base text-care-foreground">
              {appt.notes}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
