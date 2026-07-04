import { Activity, Droplets } from "lucide-react";
import { SectionHeader } from "@/components/layout/section-header";
import { IconBox } from "@/components/ui/icon-box";
import type { ElderRoutineView } from "@/lib/data/elder-care-plan";

interface RoutineActivitiesListProps {
  activities: ElderRoutineView[];
}

export function RoutineActivitiesList({ activities }: RoutineActivitiesListProps) {
  if (activities.length === 0) {
    return (
      <div className="care-surface px-5 py-8 text-center text-lg text-care-muted">
        No hay actividades de rutina registradas por ahora.
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        icon={Activity}
        title="Actividades de rutina"
        description="Ejercicios, hidratación y hábitos saludables del día."
      />
      <div className="mt-4 space-y-3">
        {activities.map((activity) => {
          const isHydration = activity.title.toLowerCase().includes("agua");
          const Icon = isHydration ? Droplets : Activity;
          const done = activity.status === "completed";

          return (
            <article
              key={activity.id}
              className={`care-surface flex items-center gap-4 p-4 ${done ? "opacity-60" : ""}`}
            >
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-care-accent/20 text-care-accent-darker">
                <span className="text-xs font-semibold uppercase">{done ? "Hecho" : "Hora"}</span>
                <span className="text-sm font-bold leading-tight">{activity.timeLabel}</span>
              </div>
              <IconBox icon={Icon} tone={isHydration ? "accent" : "secondary"} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-care-foreground">{activity.title}</p>
                {activity.message && (
                  <p className="text-base text-care-muted">{activity.message}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
