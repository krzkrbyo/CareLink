"use client";

import { CheckCircle2, Loader2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import type { ElderMealView } from "@/lib/data/elder-care-plan";
import { cn } from "@/lib/utils";

interface MealCardsProps {
  meals: ElderMealView[];
  onConfirm: (mealLabel: string) => void;
  loading?: boolean;
  confirmedMeals?: Set<string>;
}

const MEAL_HINTS: Record<string, string> = {
  Desayuno: "Avena, fruta y té sin azúcar son buenas opciones.",
  Almuerzo: "Prefiera verduras, pescado y poca sal.",
  Merienda: "Una fruta o yogurt bajo en grasa.",
  Cena: "Comida ligera, evite frituras y embutidos.",
};

export function MealCards({ meals, onConfirm, loading, confirmedMeals }: MealCardsProps) {
  if (meals.length === 0) {
    return (
      <article className="care-surface px-5 py-8 text-center text-lg text-care-muted">
        Su cuidador aún no ha registrado horarios de comida.
      </article>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {meals.map((meal) => {
        const confirmed = confirmedMeals?.has(meal.label) || meal.status === "completed";
        return (
          <article
            key={meal.id}
            className={cn(
              "care-surface flex flex-col gap-4 p-5",
              confirmed && "border-green-300 bg-green-50/50"
            )}
          >
            <div className="flex items-start gap-4">
              <IconBox icon={UtensilsCrossed} tone="secondary" size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-care-muted">
                  {meal.timeLabel}
                </p>
                <h3 className="text-xl font-bold text-care-foreground">{meal.label}</h3>
                <p className="mt-1 text-base text-care-muted">
                  {MEAL_HINTS[meal.label] ?? meal.message ?? "Recuerde seguir su plan alimenticio."}
                </p>
              </div>
            </div>

            {confirmed ? (
              <div className="flex items-center gap-2 rounded-xl bg-green-100 px-4 py-3 text-green-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-semibold">Comida registrada</span>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onConfirm(meal.label)}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Un momento...
                  </>
                ) : (
                  `Ya comí (${meal.label.toLowerCase()})`
                )}
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
