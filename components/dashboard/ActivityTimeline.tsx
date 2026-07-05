import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  CheckCircle2,
  HelpCircle,
  MessageCircleHeart,
  Mic,
  Pill,
  SmilePlus,
  UtensilsCrossed,
} from "lucide-react";
import { Interaction } from "@/types/database";
import { formatRelative } from "@/lib/utils";
import { IconBox } from "@/components/ui/icon-box";

interface ActivityTimelineProps {
  interactions: Interaction[];
}

const typeConfig: Record<string, { label: string; icon: LucideIcon; tone: "accent" | "secondary" | "success" | "danger" | "muted" }> = {
  medication_confirmed: { label: "Medicamento confirmado", icon: Pill, tone: "accent" },
  meal_confirmed: { label: "Comida registrada", icon: UtensilsCrossed, tone: "secondary" },
  mood: { label: "Estado de ánimo", icon: SmilePlus, tone: "accent" },
  checkin: { label: "Check-in diario", icon: CheckCircle2, tone: "success" },
  help: { label: "Ayuda solicitada", icon: HelpCircle, tone: "danger" },
  family_notified: { label: "Familia avisada", icon: MessageCircleHeart, tone: "accent" },
  voice_message: { label: "Mensaje de voz", icon: Mic, tone: "muted" },
};

export function ActivityTimeline({ interactions }: ActivityTimelineProps) {
  if (interactions.length === 0) {
    return (
      <div className="care-surface py-8 text-center text-care-muted">
        Aún no hay actividad registrada hoy.
      </div>
    );
  }

  return (
    <ul className="care-list">
      {interactions.map((item) => {
        const config = typeConfig[item.type] ?? {
          label: item.type,
          icon: BellRing,
          tone: "muted" as const,
        };
        const Icon = config.icon;

        return (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 !border-care-secondary/50 !p-3"
          >
            <IconBox icon={Icon} tone={config.tone} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-care-foreground">{config.label}</p>
              {item.value && <p className="text-care-muted">{item.value}</p>}
            </div>
            <span className="shrink-0 text-sm text-care-muted-light">
              {formatRelative(item.created_at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
