import { redirect } from "next/navigation";
import { requireCaregiverElderAccess } from "@/lib/auth/session";
import { elderCarePath, type ElderCareSection } from "@/lib/elders/routes";

export async function requireElderCarePage(ref: string, section: ElderCareSection) {
  const access = await requireCaregiverElderAccess(ref);
  if (ref !== access.slug) {
    redirect(elderCarePath(access.slug, section));
  }
  return access;
}
