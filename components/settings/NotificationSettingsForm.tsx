"use client";

import { useState, useTransition } from "react";
import {
  updateNotificationSettings,
  resetNotificationSettings,
} from "@/app/actions/settings";
import {
  updateManagedElderNotifications,
  resetManagedElderNotifications,
} from "@/app/actions/elder-settings";
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from "@/lib/settings/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Moon } from "lucide-react";

interface NotificationSettingsFormProps {
  settings: NotificationSettings;
  elderId?: string;
  forElderPortal?: boolean;
}

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ id, label, description, checked, onChange }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-care-secondary/50 bg-care-primary/30 p-4 transition-colors hover:bg-care-primary/50"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-care-accent-dark"
      />
      <div>
        <p className="font-semibold text-care-foreground">{label}</p>
        <p className="text-sm text-care-muted">{description}</p>
      </div>
    </label>
  );
}

export function NotificationSettingsForm({
  settings: initial,
  elderId,
  forElderPortal = false,
}: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function update<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function handleSave() {
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        if (elderId) {
          await updateManagedElderNotifications(elderId, settings);
        } else {
          await updateNotificationSettings(settings);
        }
        setMessage("Preferencias guardadas");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleReset() {
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        if (elderId) {
          await resetManagedElderNotifications(elderId);
        } else {
          await resetNotificationSettings();
        }
        setSettings(DEFAULT_NOTIFICATION_SETTINGS);
        setMessage("Preferencias restauradas");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al restaurar");
      }
    });
  }

  const caregiverToggles = [
    {
      key: "medicationMissed" as const,
      label: "Medicamento no tomado",
      description: "Aviso cuando la persona olvida o pospone un medicamento.",
    },
    {
      key: "moodAlerts" as const,
      label: "Cambios de ánimo",
      description: "Notificación cuando registra un estado de ánimo bajo o preocupante.",
    },
    {
      key: "helpRequested" as const,
      label: "Solicitud de ayuda",
      description: "Alerta inmediata cuando pide ayuda desde su portal.",
    },
    {
      key: "inactivityAlerts" as const,
      label: "Inactividad prolongada",
      description: "Aviso si no hay actividad registrada en varias horas.",
    },
    {
      key: "dailySummary" as const,
      label: "Resumen diario por correo",
      description: "Recibe un resumen al final del día con la actividad registrada.",
    },
  ];

  const elderPortalToggles = [
    {
      key: "medicationMissed" as const,
      label: "Recordatorios de medicamentos",
      description: "Avisos cuando sea hora de tomar el medicamento.",
    },
    {
      key: "dailySummary" as const,
      label: "Resumen del día",
      description: "Mensaje con la rutina y citas del día.",
    },
  ];

  const toggles = forElderPortal ? elderPortalToggles : caregiverToggles;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-care-accent-dark" />
            {forElderPortal ? "Notificaciones del portal" : "Alertas y avisos"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Toggle
            id="emailAlerts"
            label="Notificaciones por correo"
            description={
              forElderPortal
                ? "Correos que recibirá la persona en su cuenta."
                : "Activa o desactiva todos los avisos por email."
            }
            checked={settings.emailAlerts}
            onChange={(v) => update("emailAlerts", v)}
          />

          {settings.emailAlerts &&
            toggles.map(({ key, label, description }) => (
              <Toggle
                key={key}
                id={key}
                label={label}
                description={description}
                checked={settings[key]}
                onChange={(v) => update(key, v)}
              />
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-care-accent-dark" />
            Horario de silencio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            id="quietHours"
            label="Activar horario de silencio"
            description="Durante este periodo no se enviarán notificaciones."
            checked={settings.quietHoursEnabled}
            onChange={(v) => update("quietHoursEnabled", v)}
          />

          {settings.quietHoursEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="quietStart" className="mb-1 block text-sm font-semibold">
                  Desde
                </label>
                <input
                  id="quietStart"
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => update("quietHoursStart", e.target.value)}
                  className="w-full rounded-xl border-2 border-care-secondary/60 px-4 py-3"
                />
              </div>
              <div>
                <label htmlFor="quietEnd" className="mb-1 block text-sm font-semibold">
                  Hasta
                </label>
                <input
                  id="quietEnd"
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => update("quietHoursEnd", e.target.value)}
                  className="w-full rounded-xl border-2 border-care-secondary/60 px-4 py-3"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={pending} className="h-11 text-base">
          {pending ? "Guardando..." : "Guardar preferencias"}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={pending}
          className="h-11 text-base"
        >
          Restaurar valores
        </Button>
      </div>
    </div>
  );
}
