import type { LucideIcon } from "lucide-react";
import { Ban, CircleMinus, Heart, TriangleAlert } from "lucide-react";
import type { ElderFoodRuleView } from "@/lib/data/elder-care-plan";
import type { FoodRule } from "@/types/database";
import { cn } from "@/lib/utils";

const CATEGORIES: {
  type: FoodRule["type"];
  title: string;
  icon: LucideIcon;
  headerClass: string;
  iconClass: string;
  boxClass: string;
}[] = [
  {
    type: "prohibited",
    title: "Prohibido",
    icon: Ban,
    headerClass: "bg-red-100 text-red-800",
    iconClass: "bg-red-200/80 text-red-700",
    boxClass: "border-red-200 bg-gradient-to-br from-red-50/80 to-white",
  },
  {
    type: "reduce",
    title: "Reducir",
    icon: CircleMinus,
    headerClass: "bg-care-secondary/70 text-care-foreground",
    iconClass: "bg-care-secondary text-care-foreground",
    boxClass: "border-care-secondary bg-gradient-to-br from-care-primary to-white",
  },
  {
    type: "recommendation",
    title: "Recomendación",
    icon: Heart,
    headerClass: "bg-care-accent/30 text-care-accent-darker",
    iconClass: "bg-care-accent/40 text-care-accent-darker",
    boxClass: "border-care-accent/40 bg-gradient-to-br from-care-accent/10 to-white",
  },
  {
    type: "allergen",
    title: "Alérgeno",
    icon: TriangleAlert,
    headerClass: "bg-orange-100 text-orange-900",
    iconClass: "bg-orange-200/80 text-orange-800",
    boxClass: "border-orange-200 bg-gradient-to-br from-orange-50/80 to-white",
  },
];
interface FoodRulesGridProps {
  foodRules: ElderFoodRuleView[];
}

export function FoodRulesGrid({ foodRules }: FoodRulesGridProps) {
  if (foodRules.length === 0) {
    return (
      <div className="care-surface px-5 py-10 text-center text-lg text-care-muted">
        No hay restricciones alimenticias registradas.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CATEGORIES.map(({ type, title, icon: Icon, headerClass, iconClass, boxClass }) => {
        const items = foodRules.filter((r) => r.type === type);

        return (
          <article
            key={type}
            className={cn(
              "care-surface flex min-h-[10rem] flex-col overflow-hidden border-2 p-0",
              boxClass
            )}
          >
            <header
              className={cn(
                "flex items-center justify-center gap-3 px-4 py-3 text-center",
                headerClass
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                  iconClass
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={2.25} />
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
            </header>
            <ul className="flex flex-1 flex-col gap-2 px-4 py-4">
              {items.length === 0 ? (
                <li className="text-center text-base text-care-muted-light">—</li>
              ) : (
                items.map((rule) => (
                  <li
                    key={rule.id}
                    className="rounded-xl bg-white/70 px-3 py-2 text-center text-lg font-semibold capitalize text-care-foreground"
                  >
                    {rule.label}
                  </li>
                ))
              )}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
