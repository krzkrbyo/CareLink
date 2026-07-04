"use client";

import { useState } from "react";
import { User, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBox } from "@/components/ui/icon-box";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarUpload } from "./AvatarUpload";
import { ProfileInfoForm } from "./ProfileInfoForm";
import { NotificationSettingsForm } from "./NotificationSettingsForm";
import { PasswordForm } from "./PasswordForm";
import type { ProfileSettings } from "@/lib/settings/types";

const TABS = [
  {
    id: "perfil",
    label: "Perfil",
    description: "Foto e información personal",
    icon: User,
  },
  {
    id: "notificaciones",
    label: "Notificaciones",
    description: "Alertas y horario de silencio",
    icon: Bell,
  },
  {
    id: "cuenta",
    label: "Cuenta",
    description: "Seguridad y acceso",
    icon: Shield,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SettingsViewProps {
  profile: ProfileSettings;
}

export function SettingsView({ profile }: SettingsViewProps) {
  const [tab, setTab] = useState<TabId>("perfil");

  return (
    <div>
      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        {TABS.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all",
              tab === id
                ? "border-care-accent-dark bg-care-accent-dark text-white shadow-sm"
                : "border-care-secondary/50 bg-white text-care-muted hover:border-care-secondary hover:bg-care-primary"
            )}
          >
            <IconBox
              icon={Icon}
              tone={tab === id ? "muted" : "accent"}
              size="sm"
              className={tab === id ? "bg-white/20 text-white" : undefined}
            />
            <div>
              <p className="font-semibold">{label}</p>
              <p className={cn("text-xs", tab === id ? "text-white/80" : "text-care-muted-light")}>
                {description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <AvatarUpload name={profile.full_name} avatarUrl={profile.avatar_url} />
            </CardContent>
          </Card>
          <ProfileInfoForm
            fullName={profile.full_name}
            phone={profile.phone}
            bio={profile.bio}
            email={profile.email}
          />
        </div>
      )}

      {tab === "notificaciones" && (
        <NotificationSettingsForm settings={profile.notification_settings} />
      )}

      {tab === "cuenta" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="font-semibold text-care-foreground">Cuidador responsable</p>
              <p className="text-sm text-care-muted">
                Puedes gestionar personas a tu cargo y configurar sus perfiles desde el menú de
                seguimiento de cada persona.
              </p>
            </CardContent>
          </Card>
          <PasswordForm />
        </div>
      )}
    </div>
  );
}
