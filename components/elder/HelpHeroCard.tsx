"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HelpHeroCardProps {
  onHelp: () => void;
  loading?: boolean;
  className?: string;
}

export function HelpHeroCard({ onHelp, loading, className }: HelpHeroCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col items-center gap-6 rounded-3xl border-4 border-red-300 bg-gradient-to-br from-red-50 via-white to-red-50/50 p-8 shadow-lg lg:p-10",
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-12 w-12 text-red-600" strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-red-800 lg:text-4xl">¿Necesita ayuda?</h2>
        <p className="mt-2 max-w-md text-lg text-red-700/80">
          Presione el botón para avisar a su familia de inmediato
        </p>
      </div>
      <Button
        variant="destructive"
        size="xl"
        onClick={onHelp}
        disabled={loading}
        className="max-w-lg text-2xl font-bold shadow-md"
      >
        {loading ? (
          <>
            <Loader2 className="h-7 w-7 animate-spin" />
            Enviando...
          </>
        ) : (
          "Pedir ayuda ahora"
        )}
      </Button>
    </article>
  );
}
