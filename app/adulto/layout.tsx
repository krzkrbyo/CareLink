import { requireElder, getProfile } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";

export default async function AdultoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { elder } = await requireElder();
  const profile = await getProfile();

  return (
    <AppShell
      role="elder"
      userName={profile?.full_name ?? elder.full_name}
      avatarUrl={profile?.avatar_url ?? null}
    >
      {children}
    </AppShell>
  );
}
