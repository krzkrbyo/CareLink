"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireCaregiverElderAccess } from "@/lib/auth/session";
import { revalidateElderCarePaths } from "@/lib/elders/revalidate";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  parseNotificationSettings,
  type NotificationSettings,
  type ManagedElderSettings,
} from "@/lib/settings/types";

async function getElderAuthUserId(elderId: string) {
  const supabase = await createClient();
  const { data: elder, error } = await supabase
    .from("elders")
    .select("auth_user_id, full_name")
    .eq("id", elderId)
    .single();

  if (error || !elder?.auth_user_id) {
    throw new Error("Esta persona no tiene cuenta de acceso vinculada");
  }

  return { authUserId: elder.auth_user_id, elderName: elder.full_name };
}

async function revalidateElderSettings(elderId: string) {
  await revalidateElderCarePaths(elderId);
  revalidatePath("/cuidador", "layout");
  revalidatePath("/adulto", "layout");
}

export async function getManagedElderSettings(elderId: string): Promise<ManagedElderSettings> {
  const { user } = await requireCaregiverElderAccess(elderId);
  const { authUserId } = await getElderAuthUserId(elderId);

  const supabase = await createClient();
  const [{ data: profile, error }, { data: link }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUserId).single(),
    supabase
      .from("caregiver_elder_links")
      .select("relationship")
      .eq("elder_id", elderId)
      .eq("caregiver_id", user.id)
      .maybeSingle(),
  ]);

  if (error || !profile) throw new Error("No se pudo cargar el perfil");

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(authUserId);

  return {
    elderId,
    profileId: profile.id,
    full_name: profile.full_name,
    email: authUser.user?.email ?? "",
    avatar_url: profile.avatar_url ?? null,
    phone: profile.phone ?? null,
    bio: profile.bio ?? null,
    relationship: link?.relationship ?? null,
    notification_settings: parseNotificationSettings(profile.notification_settings),
    hasAuthAccount: true,
  };
}

export async function updateManagedElderProfile(
  elderId: string,
  data: { fullName: string; phone?: string; bio?: string }
) {
  await requireCaregiverElderAccess(elderId);
  const { authUserId } = await getElderAuthUserId(elderId);
  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      bio: data.bio?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authUserId);

  if (profileError) throw new Error(profileError.message);

  const { error: elderError } = await supabase
    .from("elders")
    .update({ full_name: data.fullName.trim() })
    .eq("id", elderId);

  if (elderError) throw new Error(elderError.message);

  revalidateElderSettings(elderId);
  return { success: true };
}

export async function updateManagedElderNotifications(
  elderId: string,
  settings: NotificationSettings
) {
  await requireCaregiverElderAccess(elderId);
  const { authUserId } = await getElderAuthUserId(elderId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_settings: settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authUserId);

  if (error) throw new Error(error.message);
  revalidateElderSettings(elderId);
  return { success: true };
}

export async function uploadManagedElderAvatar(elderId: string, formData: FormData) {
  await requireCaregiverElderAccess(elderId);
  const { authUserId } = await getElderAuthUserId(elderId);

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) throw new Error("Seleccione una imagen");
  if (file.size > 3 * 1024 * 1024) throw new Error("La imagen debe ser menor a 3 MB");

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Formato no válido. Use JPG, PNG o WebP.");
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${authUserId}/avatar.${ext}`;
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("carelink-avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = admin.storage.from("carelink-avatars").getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", authUserId);

  if (error) throw new Error(error.message);

  revalidateElderSettings(elderId);
  return { success: true, avatarUrl };
}

export async function removeManagedElderAvatar(elderId: string) {
  await requireCaregiverElderAccess(elderId);
  const { authUserId } = await getElderAuthUserId(elderId);

  const admin = createAdminClient();
  const { data: files } = await admin.storage.from("carelink-avatars").list(authUserId);

  if (files?.length) {
    await admin.storage
      .from("carelink-avatars")
      .remove(files.map((f) => `${authUserId}/${f.name}`));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", authUserId);

  if (error) throw new Error(error.message);
  revalidateElderSettings(elderId);
  return { success: true };
}

export async function updateManagedElderPassword(elderId: string, formData: FormData) {
  await requireCaregiverElderAccess(elderId);
  const { authUserId } = await getElderAuthUserId(elderId);

  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authUserId, { password });
  if (error) return { error: error.message };

  return { success: true };
}

export async function resetManagedElderNotifications(elderId: string) {
  return updateManagedElderNotifications(elderId, DEFAULT_NOTIFICATION_SETTINGS);
}

export async function updateManagedElderRelationship(elderId: string, relationship: string) {
  const { user } = await requireCaregiverElderAccess(elderId);
  const trimmed = relationship.trim();
  if (!trimmed) {
    throw new Error("Indique qué eres para esta persona");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("caregiver_elder_links")
    .update({ relationship: trimmed })
    .eq("elder_id", elderId)
    .eq("caregiver_id", user.id);

  if (error) throw new Error(error.message);

  revalidateElderSettings(elderId);
  return { success: true };
}

export async function deleteManagedElder(elderId: string) {
  const { user } = await requireCaregiverElderAccess(elderId);
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: elder, error: fetchError } = await supabase
    .from("elders")
    .select("auth_user_id, full_name")
    .eq("id", elderId)
    .single();

  if (fetchError || !elder) {
    throw new Error("No se encontró la persona a cargo");
  }

  const { data: link } = await supabase
    .from("caregiver_elder_links")
    .select("id")
    .eq("elder_id", elderId)
    .eq("caregiver_id", user.id)
    .maybeSingle();

  if (!link) {
    throw new Error("No tiene permiso para eliminar esta persona");
  }

  const authUserId = elder.auth_user_id;

  const { error: deleteError } = await admin.from("elders").delete().eq("id", elderId);
  if (deleteError) throw new Error(deleteError.message);

  if (authUserId) {
    const { data: avatarFiles } = await admin.storage
      .from("carelink-avatars")
      .list(authUserId);
    if (avatarFiles?.length) {
      await admin.storage
        .from("carelink-avatars")
        .remove(avatarFiles.map((f) => `${authUserId}/${f.name}`));
    }

    await admin.from("profiles").delete().eq("id", authUserId);
    await admin.auth.admin.deleteUser(authUserId);
  }

  revalidatePath("/cuidador", "layout");
  revalidatePath("/adulto", "layout");
  return { success: true, elderName: elder.full_name };
}
