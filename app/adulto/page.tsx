import { Suspense } from "react";
import { requireElder } from "@/lib/auth/session";
import { getElderCarePlan } from "@/lib/data/elder-care-plan";
import { AdultoPortal } from "@/components/elder/AdultoPortal";

export default async function AdultoPage() {
  const { elder } = await requireElder();
  const carePlan = await getElderCarePlan();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl animate-pulse space-y-6 px-4 py-8 lg:px-8">
          <div className="h-12 rounded-2xl bg-care-secondary/40" />
          <div className="h-48 rounded-3xl bg-care-secondary/30" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-56 rounded-2xl bg-care-secondary/30" />
            <div className="h-56 rounded-2xl bg-care-secondary/30" />
          </div>
        </div>
      }
    >
      <AdultoPortal elderName={elder.full_name} carePlan={carePlan} />
    </Suspense>
  );
}
