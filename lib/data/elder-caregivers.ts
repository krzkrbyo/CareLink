import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface ElderCaregiverView {
  id: string;
  fullName: string;
  relationship: string | null;
  /** Ej: "Ana es su hija", "Carlos es su enfermero" */
  description: string;
  /** Ej: "su hija", "su enfermero" */
  relationshipPhrase: string | null;
  isPrimary: boolean;
}

function normalizeRelationship(relationship: string): string {
  const trimmed = relationship.trim().toLowerCase();
  return trimmed.startsWith("su ") ? trimmed.slice(3) : trimmed;
}

export function describeCaregiverRelationship(
  caregiverName: string,
  relationship: string | null
): { description: string; relationshipPhrase: string | null } {
  if (!relationship?.trim()) {
    return {
      description: `${caregiverName} es su cuidador/a`,
      relationshipPhrase: null,
    };
  }

  const phrase = `su ${normalizeRelationship(relationship)}`;
  return {
    description: `${caregiverName} es ${phrase}`,
    relationshipPhrase: phrase,
  };
}

export async function fetchElderCaregivers(
  elderId: string,
  supabase: Supabase,
  mainCaregiverName?: string | null
): Promise<ElderCaregiverView[]> {
  const { data: links } = await supabase
    .from("caregiver_elder_links")
    .select("caregiver_id, relationship, profiles(full_name)")
    .eq("elder_id", elderId);

  if (!links?.length) {
    if (mainCaregiverName) {
      return [
        {
          id: "primary",
          fullName: mainCaregiverName,
          relationship: null,
          description: `${mainCaregiverName} es su cuidador/a principal`,
          relationshipPhrase: null,
          isPrimary: true,
        },
      ];
    }
    return [];
  }

  const caregivers = links
    .map((link, index) => {
      const profile = link.profiles as { full_name: string } | { full_name: string }[] | null;
      const profileName = Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name;
      const fullName =
        profileName ??
        (links.length === 1 ? mainCaregiverName : null) ??
        (index === 0 ? mainCaregiverName : null);
      if (!fullName) return null;

      const { description, relationshipPhrase } = describeCaregiverRelationship(
        fullName,
        link.relationship
      );

      return {
        id: link.caregiver_id,
        fullName,
        relationship: link.relationship,
        description,
        relationshipPhrase,
        isPrimary: Boolean(mainCaregiverName && fullName === mainCaregiverName),
      };
    })
    .filter((c): c is ElderCaregiverView => c !== null);

  caregivers.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.fullName.localeCompare(b.fullName, "es");
  });

  if (mainCaregiverName && !caregivers.some((c) => c.isPrimary)) {
    const match = caregivers.find((c) => c.fullName === mainCaregiverName);
    if (match) match.isPrimary = true;
  }

  return caregivers;
}

export function formatCaregiversForChatContext(
  caregivers: ElderCaregiverView[],
  mainCaregiverName?: string | null,
  emergencyContact?: string | null
): string | null {
  const parts: string[] = [];

  if (caregivers.length) {
    const descriptions = caregivers.map((c) =>
      c.isPrimary ? `${c.description} (cuidador/a principal)` : c.description
    );
    parts.push(descriptions.join("; "));
  } else if (mainCaregiverName) {
    parts.push(`su cuidador/a principal es ${mainCaregiverName}`);
  }

  if (emergencyContact) {
    parts.push(`contacto de emergencia: ${emergencyContact}`);
  }

  return parts.length ? parts.join("; ") : null;
}

export function getPrimaryCaregiverHint(caregivers: ElderCaregiverView[]): string | null {
  const primary = caregivers.find((c) => c.isPrimary) ?? caregivers[0];
  if (!primary) return null;
  if (primary.relationshipPhrase) {
    return `${primary.fullName}, ${primary.relationshipPhrase}`;
  }
  return primary.fullName;
}
