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
  await requireCaregiverElderAccess(elderId);
  const { authUserId } = await getElderAuthUserId(elderId);

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUserId)
    .single();

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
