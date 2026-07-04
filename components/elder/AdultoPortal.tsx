"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  MessageCircleHeart,
  Pill,
  SmilePlus,
  UtensilsCrossed,
  Volume2,
} from "lucide-react";
import { ActionCard } from "@/components/elder/action-card";
import { ElderCarePlanSection } from "@/components/elder/ElderCarePlanSection";
import { ElderSectionNav } from "@/components/elder/elder-section-nav";
import { MoodSelector } from "@/components/elder/MoodSelector";
import { ReminderPlayer } from "@/components/elder/ReminderPlayer";
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

const SECTIONS = [
  { id: "emergencia", label: "Ayuda", icon: AlertCircle },
  { id: "plan", label: "Mi plan", icon: ClipboardList },
  { id: "rutina", label: "Rutina", icon: Pill },
  { id: "bienestar", label: "Bienestar", icon: SmilePlus },
  { id: "familia", label: "Familia", icon: MessageCircleHeart },
] as const;

interface AdultoPortalProps {
  elderName: string;
  carePlan: ElderCarePlan;
}

export function AdultoPortal({ elderName, carePlan }: AdultoPortalProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [showMood, setShowMood] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("emergencia");

  function act(fn: () => Promise<{ success: boolean }>, msg: string) {
    startTransition(async () => {
      await fn();
      setFeedback(msg);
      setTimeout(() => setFeedback(""), 4000);
    });
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
      <PageHeader
        title={`Hola, ${elderName}`}
        description="Consulte su plan de medicamentos, citas y alimentación. Use los botones para registrar su rutina o pedir ayuda."
      />

      {feedback && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-green-300 bg-green-50 p-4 text-green-900">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <p className="text-lg font-semibold">{feedback}</p>
        </div>
      )}

      <ElderSectionNav
        sections={[...SECTIONS]}
        activeId={activeSection}
        onSelect={setActiveSection}
      />

      <div className="space-y-10">
        <section id="emergencia" className="scroll-mt-36">
          <SectionHeader
            icon={AlertCircle}
            tone="danger"
            title="Necesito ayuda ahora"
            description="Si se siente mal o necesita asistencia urgente, avise a su familia de inmediato."
          />
          <ActionCard
            icon={AlertCircle}
            iconTone="danger"
            title="Pedir ayuda urgente"
            description="Enviaremos una alerta a las personas que lo cuidan para que se comuniquen con usted."
            actionLabel="Avisar que necesito ayuda"
            variant="destructive"
            prominent
            loading={pending}
            onClick={() => act(requestHelp, "Ayuda enviada a su familia")}
          />
        </section>

        <section id="plan" className="scroll-mt-36">
          <ElderCarePlanSection plan={carePlan} />
        </section>

        <section id="rutina" className="scroll-mt-36">
          <SectionHeader
            icon={Pill}
            title="Mi rutina de hoy"
            description="Escuche su recordatorio y confirme cuando haya tomado su medicamento o comido."
          />
          <div className="space-y-4">
            <article className="care-surface p-5">
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

            <ActionCard
              icon={Pill}
              iconTone="accent"
              title="Medicamento"
              description="Confirme cuando haya tomado su medicamento de hoy."
              actionLabel="Ya tomé mi medicamento"
              loading={pending}
              onClick={() => act(confirmMedication, "Medicamento registrado correctamente")}
            />

            <ActionCard
              icon={UtensilsCrossed}
              iconTone="secondary"
              title="Comida"
              description="Indique que ya realizó su comida o merienda."
              actionLabel="Ya comí"
              variant="secondary"
              loading={pending}
              onClick={() => act(confirmMeal, "Comida registrada")}
            />
          </div>
        </section>

        <section id="bienestar" className="scroll-mt-36">
          <SectionHeader
            icon={SmilePlus}
            title="Cómo me siento hoy"
            description="Comparta su estado para que su familia sepa cómo va su día."
          />
          <div className="space-y-4">
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
              <div className="care-surface p-5">
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
        </section>

        <section id="familia" className="scroll-mt-36">
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
        </section>
      </div>
    </div>
  );
}
