import { redirect } from "next/navigation";
import { requireCaregiver, getCaregiverElders } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";

export default async function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireCaregiver();
  const elders = await getCaregiverElders(user.id);

  if (profile.role !== "caregiver") {
    redirect("/adulto");
  }

  return (
    <AppShell
      role="caregiver"
      userName={profile.full_name}
      avatarUrl={profile.avatar_url ?? null}
      elders={elders}
    >
      {children}
    </AppShell>
  );
}
