"use client";

import { useState } from "react";
import { User, Bell, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBox } from "@/components/ui/icon-box";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarUpload } from "./AvatarUpload";
import { ProfileInfoForm } from "./ProfileInfoForm";
import { NotificationSettingsForm } from "./NotificationSettingsForm";
import { PasswordForm } from "./PasswordForm";
import type { ManagedElderSettings } from "@/lib/settings/types";

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
    description: "Avisos del portal",
    icon: Bell,
  },
  {
    id: "acceso",
    label: "Acceso",
    description: "Contraseña de la cuenta",
    icon: Shield,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface ElderSettingsViewProps {
  settings: ManagedElderSettings;
}

export function ElderSettingsView({ settings }: ElderSettingsViewProps) {
  const [tab, setTab] = useState<TabId>("perfil");

  return (
    <div>
      <Card className="mb-6 border-care-accent/40 bg-care-accent/10">
        <CardContent className="flex items-start gap-3 pt-5">
          <IconBox icon={Lock} tone="accent" size="sm" />
          <div>
            <p className="font-semibold text-care-foreground">Administrado por el cuidador</p>
            <p className="text-sm text-care-muted">
              El adulto mayor no puede modificar estos ajustes. Solo tú, como responsable, puedes
              gestionar su foto, datos y preferencias.
            </p>
          </div>
        </CardContent>
      </Card>

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
              <AvatarUpload
                name={settings.full_name}
                avatarUrl={settings.avatar_url}
                elderId={settings.elderId}
              />
            </CardContent>
          </Card>
          <ProfileInfoForm
            fullName={settings.full_name}
            phone={settings.phone}
            bio={settings.bio}
            email={settings.email}
            elderId={settings.elderId}
            managedByCaregiver
          />
        </div>
      )}

      {tab === "notificaciones" && (
        <NotificationSettingsForm
          settings={settings.notification_settings}
          elderId={settings.elderId}
          forElderPortal
        />
      )}

      {tab === "acceso" && (
        <PasswordForm elderId={settings.elderId} managedByCaregiver />
      )}
    </div>
  );
}
