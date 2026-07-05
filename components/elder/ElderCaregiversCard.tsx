import { HeartHandshake } from "lucide-react";
import { IconBox } from "@/components/ui/icon-box";
import type { ElderCaregiverView } from "@/lib/data/elder-caregivers";

interface ElderCaregiversCardProps {
  caregivers: ElderCaregiverView[];
  emergencyContact?: string | null;
}

export function ElderCaregiversCard({ caregivers, emergencyContact }: ElderCaregiversCardProps) {
  if (caregivers.length === 0 && !emergencyContact) {
    return null;
  }

  return (
    <article className="care-surface p-5">
      <div className="flex items-start gap-4">
        <IconBox icon={HeartHandshake} tone="accent" size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-care-foreground">Quién le cuida</h3>
          {caregivers.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {caregivers.map((caregiver) => (
                <li key={caregiver.id} className="text-lg text-care-foreground">
                  <span className="font-semibold">{caregiver.description}</span>
                  {caregiver.isPrimary && (
                    <span className="ml-2 text-sm font-semibold uppercase tracking-wide text-care-accent-darker">
                      Principal
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-base text-care-muted">
              Su cuidador aún no tiene una relación registrada en el sistema.
            </p>
          )}
          {emergencyContact && (
            <p className="mt-3 text-base text-care-muted">
              Contacto de emergencia:{" "}
              <span className="font-semibold text-care-foreground">{emergencyContact}</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
