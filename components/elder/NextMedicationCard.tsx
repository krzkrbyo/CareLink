"use client";

import { CheckCircle2, Loader2, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import type { ElderAgendaItem } from "@/lib/data/elder-care-plan";
import { cn } from "@/lib/utils";

interface NextMedicationCardProps {
  doses: ElderAgendaItem[];
  onConfirm: () => void;
  loading?: boolean;
  confirmed?: boolean;
  onViewAll?: () => void;
  showViewAll?: boolean;
  compact?: boolean;
}

export function NextMedicationCard({
  doses,
  onConfirm,
  loading,
  confirmed,
  onViewAll,
  showViewAll,
  compact,
}: NextMedicationCardProps) {
  if (doses.length === 0) {
    return (
      <article className="care-surface flex flex-col items-center justify-center p-6 text-center">
        <IconBox icon={Pill} tone="muted" size="lg" />
        <p className="mt-4 text-lg font-semibold text-care-muted">
          No tiene medicamentos programados
        </p>
        {showViewAll && onViewAll && (
          <Button variant="outline" size="default" className="mt-4" onClick={onViewAll}>
            Ver todos los medicamentos
          </Button>
        )}
      </article>
    );
  }

  const first = doses[0];
  const sameTime = doses.every((d) => d.sortKey === first.sortKey);

  return (
    <article
      className={cn(
        "care-surface flex flex-col gap-5 border-care-accent/30 bg-gradient-to-br from-care-accent/10 to-white p-5",
        !compact && "lg:p-8"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-care-accent/25 text-care-accent-darker">
          <span className="text-xs font-semibold uppercase">Hora</span>
          <span className="text-lg font-bold leading-tight">{first.time}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-care-muted">
            {doses.length > 1 ? "Próximos medicamentos" : "Próximo medicamento"}
          </p>
          {first.dateLabel && (
            <p className="mt-0.5 text-base font-semibold capitalize text-care-accent-darker">
              {first.dateLabel}
            </p>
          )}
        </div>
        <IconBox icon={Pill} tone="accent" size="lg" />
      </div>

      <div className="space-y-3">
        {doses.map((dose) => (
          <div
            key={dose.id}
            className="rounded-2xl border-2 border-care-secondary/50 bg-white/80 px-4 py-3"
          >
            <h3 className="text-xl font-bold text-care-foreground">{dose.title}</h3>
            <p className="text-lg text-care-muted">{dose.subtitle}</p>
          </div>
        ))}
      </div>

      {sameTime && doses.length > 1 && (
        <p className="text-center text-sm font-medium text-care-muted">
          Tiene {doses.length} medicamentos a esta hora
        </p>
      )}

      {confirmed ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-green-300 bg-green-50 p-5">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <p className="text-xl font-bold text-green-800">¡Muy bien! Medicamento registrado</p>
        </div>
      ) : (
        <Button
          variant="default"
          size="xl"
          onClick={onConfirm}
          disabled={loading}
          className="text-xl"
        >
          {loading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              Un momento...
            </>
          ) : doses.length > 1 ? (
            "Ya me tomé las pastillas"
          ) : (
            "Ya me tomé la pastilla"
          )}
        </Button>
      )}

      {showViewAll && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-center text-base font-semibold text-care-accent-dark underline-offset-2 hover:underline"
        >
          Ver todos los medicamentos
        </button>
      )}
    </article>
  );
}
