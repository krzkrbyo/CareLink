"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  HeartHandshake,
  MessageCircleHeart,
  Pill,
  Salad,
  SmilePlus,
  UtensilsCrossed,
  Volume2,
} from "lucide-react";
import { ActionCard } from "@/components/elder/action-card";
import {
  ElderMedicationsList,
  ElderAppointmentsList,
  ElderFoodRulesList,
} from "@/components/elder/ElderCarePlanSection";
import { HelpHeroCard } from "@/components/elder/HelpHeroCard";
import { MealCards } from "@/components/elder/MealCards";
import { MoodSelector } from "@/components/elder/MoodSelector";
import { NextAppointmentCard } from "@/components/elder/NextAppointmentCard";
import { NextMedicationCard } from "@/components/elder/NextMedicationCard";
import { VoiceChatCompanion } from "@/components/elder/VoiceChatCompanion";
import { ReminderPlayer } from "@/components/elder/ReminderPlayer";
import { RoutineActivitiesList } from "@/components/elder/RoutineActivitiesList";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import {
  confirmMedication,
  confirmMeal,
  dailyCheckin,
  registerMood,
  requestHelp,
  notifyFamily,
} from "@/app/actions/elder";
import type { ElderCarePlan } from "@/lib/data/elder-care-plan";
import {
  getFeaturedAppointments,
  getFeaturedMedicationDoses,
  hasMoreAppointments,
  hasMoreMedications,
} from "@/lib/data/elder-care-plan-helpers";
import { elderSectionHref, parseElderSection } from "@/lib/elder-nav";

interface AdultoPortalProps {
  elderName: string;
  carePlan: ElderCarePlan;
}

export function AdultoPortal({ elderName, carePlan }: AdultoPortalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = parseElderSection(searchParams.get("seccion"));

  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [showMood, setShowMood] = useState(false);
  const [medConfirmed, setMedConfirmed] = useState(false);
  const [confirmedMeals, setConfirmedMeals] = useState<Set<string>>(() => {
    const done = carePlan.meals
      .filter((m) => m.status === "completed")
      .map((m) => m.label);
    return new Set(done);
  });

  const featuredAppointments = getFeaturedAppointments(carePlan.appointments);
  const featuredDoses = getFeaturedMedicationDoses(carePlan);

  function navigate(id: string) {
    router.push(elderSectionHref(id));
  }

  function act(fn: () => Promise<{ success: boolean }>, msg: string, onSuccess?: () => void) {
    startTransition(async () => {
      await fn();
      setFeedback(msg);
      onSuccess?.();
      setTimeout(() => setFeedback(""), 4000);
    });
  }

  function confirmMed() {
    act(confirmMedication, "Medicamento registrado correctamente", () => setMedConfirmed(true));
  }

  function confirmMealLabel(label: string) {
    act(
      () => confirmMeal(label),
      `${label} registrado correctamente`,
      () => setConfirmedMeals((prev) => new Set(prev).add(label))
    );
  }

  const medicationCard = (
    <NextMedicationCard
      doses={featuredDoses}
      onConfirm={confirmMed}
      loading={pending}
      confirmed={medConfirmed}
      showViewAll={hasMoreMedications(carePlan)}
      onViewAll={() => navigate("medicamentos")}
    />
  );

  function renderContent() {
    switch (activeSection) {
      case "inicio":
        return (
          <div className="space-y-6">
            <HelpHeroCard
              onHelp={() => act(requestHelp, "Ayuda enviada a su familia")}
              loading={pending}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              {medicationCard}
              <NextAppointmentCard
                appointments={featuredAppointments}
                showViewAll={hasMoreAppointments(carePlan.appointments, featuredAppointments)}
                onViewAll={() => navigate("citas")}
              />
            </div>
          </div>
        );

      case "medicamentos":
        return (
          <div className="space-y-6">
            <SectionHeader
              icon={Pill}
              title="Mis medicamentos"
              description="Su próxima toma y el detalle de todos sus medicamentos."
            />
            <NextMedicationCard
              doses={featuredDoses}
              onConfirm={confirmMed}
              loading={pending}
              confirmed={medConfirmed}
            />
            <ElderMedicationsList medications={carePlan.medications} />
          </div>
        );

      case "citas":
        return (
          <div className="space-y-6">
            <SectionHeader
              icon={CalendarClock}
              title="Citas y exámenes"
              description="Su próxima visita y el listado completo."
            />
            <NextAppointmentCard appointments={featuredAppointments} />
            <ElderAppointmentsList appointments={carePlan.appointments} />
          </div>
        );

      case "alimentacion":
        return (
          <div className="space-y-6">
            <SectionHeader
              icon={Salad}
              title="Alimentación"
              description="Alimentos que debe evitar, reducir o preferir según su plan para la presión alta."
            />
            <ElderFoodRulesList foodRules={carePlan.foodRules} />
          </div>
        );

      case "acompanante":
        return (
          <div className="space-y-6">
            <SectionHeader
              icon={MessageCircleHeart}
              title="Su tortuguita acompañante"
              description="Hable con su tortuguita de CareLink. Escuchará su voz, le responderá por escrito y con audio."
            />
            <VoiceChatCompanion elderName={elderName} />
          </div>
        );

      case "rutina":
        return (
          <div className="space-y-8">
            <SectionHeader
              icon={Volume2}
              title="Mi rutina de hoy"
              description="Medicamentos, comidas y actividades programadas para hoy."
            />

            <article className="care-surface p-6">
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-care-secondary/60 text-care-foreground">
                  <Volume2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-care-foreground">Recordatorio en voz</h3>
                  <p className="mt-1 text-care-muted">
                    Escuche un mensaje con sus indicaciones del día.
                  </p>
                </div>
              </div>
              <ReminderPlayer
                reminderType="medication"
                defaultText={`Buenos días, ${elderName}. Es momento de tomar su medicamento para la presión.`}
              />
            </article>

            <NextMedicationCard
              doses={featuredDoses}
              onConfirm={confirmMed}
              loading={pending}
              confirmed={medConfirmed}
              compact
            />

            <div>
              <SectionHeader
                icon={UtensilsCrossed}
                title="Mis comidas de hoy"
                description="Confirme cada comida cuando la haya realizado."
              />
              <div className="mt-4">
                <MealCards
                  meals={carePlan.meals}
                  onConfirm={confirmMealLabel}
                  loading={pending}
                  confirmedMeals={confirmedMeals}
                />
              </div>
            </div>

            <RoutineActivitiesList activities={carePlan.routineActivities} />
          </div>
        );

      case "bienestar":
        return (
          <div className="space-y-6">
            <SectionHeader
              icon={SmilePlus}
              title="Cómo me siento hoy"
              description="Comparta su estado para que su familia sepa cómo va su día."
            />
            <ActionCard
              icon={CheckCircle2}
              iconTone="success"
              title="Check-in diario"
              description="Un saludo rápido para decir que está bien y activo hoy."
              actionLabel="Estoy bien hoy"
              variant="outline"
              loading={pending}
              onClick={() => act(dailyCheckin, "Check-in registrado")}
            />
            {!showMood ? (
              <ActionCard
                icon={SmilePlus}
                iconTone="accent"
                title="Estado de ánimo"
                description="Cuéntenos si se siente bien, regular, triste o solo."
                actionLabel="Registrar cómo me siento"
                variant="outline"
                onClick={() => setShowMood(true)}
              />
            ) : (
              <div className="care-surface p-6">
                <SectionHeader
                  icon={SmilePlus}
                  title="¿Cómo se siente en este momento?"
                  description="Seleccione la opción que mejor lo describa."
                />
                <MoodSelector
                  loading={pending}
                  onSelect={(mood) => {
                    act(
                      () => registerMood(mood),
                      mood === "Bien"
                        ? "Gracias por compartir"
                        : "Su familia será avisada con cariño"
                    );
                    setShowMood(false);
                  }}
                />
              </div>
            )}
          </div>
        );

      case "familia":
        return (
          <div className="space-y-6">
            <SectionHeader
              icon={HeartHandshake}
              title="Comunicarme con mi familia"
              description="Envíe un aviso amable sin que sea una emergencia."
            />
            <ActionCard
              icon={MessageCircleHeart}
              iconTone="accent"
              title="Aviso a la familia"
              description="Su familia recibirá una notificación para saber que desea contactarlos."
              actionLabel="Avisar a mi familia"
              variant="outline"
              loading={pending}
              onClick={() => act(notifyFamily, "Aviso enviado a su familia")}
            />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-4 lg:px-8 lg:pt-8">
      <PageHeader
        title={`Hola, ${elderName}`}
        description={
          activeSection === "inicio"
            ? "Aquí tiene lo más importante de su día. Use el menú para ver más detalles."
            : undefined
        }
      />

      {feedback && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-green-300 bg-green-50 p-4 text-green-900">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <p className="text-lg font-semibold">{feedback}</p>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
