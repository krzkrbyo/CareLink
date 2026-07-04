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
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
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
    <Checkbox
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      label={label}
      description={description}
    />
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
              <FormField id="quietStart" label="Desde">
                <Input
                  id="quietStart"
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => update("quietHoursStart", e.target.value)}
                />
              </FormField>
              <FormField id="quietEnd" label="Hasta">
                <Input
                  id="quietEnd"
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => update("quietHoursEnd", e.target.value)}
                />
              </FormField>
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
