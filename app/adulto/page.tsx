import { requireElder } from "@/lib/auth/session";
import { getElderCarePlan } from "@/lib/data/elder-care-plan";
import { AdultoPortal } from "@/components/elder/AdultoPortal";

export default async function AdultoPage() {
  const { elder } = await requireElder();
  const carePlan = await getElderCarePlan();

  return <AdultoPortal elderName={elder.full_name} carePlan={carePlan} />;
}
