import { DashboardView } from "@/components/dashboard/DashboardView";
import { requireElderCarePage } from "@/lib/elders/page-access";

export default async function ElderDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { elderId } = await requireElderCarePage(slug, "dashboard");
  return <DashboardView elderId={elderId} />;
}
