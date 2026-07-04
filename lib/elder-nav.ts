import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Home,
  MessageCircleHeart,
  Pill,
  Salad,
  SmilePlus,
  Volume2,
} from "lucide-react";

export interface ElderNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
}

export interface ElderNavGroup {
  label: string;
  items: ElderNavItem[];
}

export const ELDER_DEFAULT_SECTION = "inicio";

export const ELDER_NAV_GROUPS: ElderNavGroup[] = [
  {
    label: "Principal",
    items: [{ id: "inicio", label: "Inicio", icon: Home }],
  },
  {
    label: "Mi salud",
    items: [
      { id: "medicamentos", label: "Medicamentos", icon: Pill },
      { id: "citas", label: "Citas y exámenes", icon: CalendarClock },
      { id: "alimentacion", label: "Alimentación", icon: Salad },
    ],
  },
  {
    label: "Mi día",
    items: [
      { id: "rutina", label: "Rutina", icon: Volume2 },
      { id: "bienestar", label: "Bienestar", icon: SmilePlus },
      { id: "familia", label: "Familia", icon: MessageCircleHeart },
    ],
  },
];

const ALL_SECTION_IDS = ELDER_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id));

export function elderSectionHref(sectionId: string): string {
  return sectionId === ELDER_DEFAULT_SECTION ? "/adulto" : `/adulto?seccion=${sectionId}`;
}

export function parseElderSection(param: string | null | undefined): string {
  if (!param || !ALL_SECTION_IDS.includes(param)) return ELDER_DEFAULT_SECTION;
  return param;
}

export function getElderSectionLabel(sectionId: string): string {
  return (
    ELDER_NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === sectionId)?.label ??
    "Inicio"
  );
}
