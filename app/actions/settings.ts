"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireCaregiver } from "@/lib/auth/session";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  parseNotificationSettings,
  type NotificationSettings,
} from "@/lib/settings/types";

function revalidateSettings() {
  revalidatePath("/configuracion");
  revalidatePath("/cuidador", "layout");
  revalidatePath("/adulto", "layout");
}

export async function getProfileSettings() {
  const { user } = await requireCaregiver();
  const supabase = await createClient();

  const { data: fullProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !fullProfile) throw new Error("No se pudo cargar el perfil");

  return {
    id: fullProfile.id,
    full_name: fullProfile.full_name,
    role: "caregiver" as const,
    email: user.email ?? "",
    avatar_url: fullProfile.avatar_url ?? null,
    phone: fullProfile.phone ?? null,
    bio: fullProfile.bio ?? null,
    notification_settings: parseNotificationSettings(fullProfile.notification_settings),
    created_at: fullProfile.created_at,
  };
}

export async function updateProfileInfo(data: {
  fullName: string;
  phone?: string;
  bio?: string;
}) {
  const { user } = await requireCaregiver();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      bio: data.bio?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidateSettings();
  return { success: true };
}

export async function updateNotificationSettings(settings: NotificationSettings) {
  const { user } = await requireCaregiver();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_settings: settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidateSettings();
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const { user } = await requireCaregiver();
  const file = formData.get("avatar") as File | null;

  if (!file || file.size === 0) {
    throw new Error("Seleccione una imagen");
  }

  if (file.size > 3 * 1024 * 1024) {
    throw new Error("La imagen debe ser menor a 3 MB");
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Formato no válido. Use JPG, PNG o WebP.");
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("carelink-avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = admin.storage.from("carelink-avatars").getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidateSettings();
  return { success: true, avatarUrl };
}

export async function removeAvatar() {
  const { user } = await requireCaregiver();
  const supabase = await createClient();

  const admin = createAdminClient();
  const { data: files } = await admin.storage
    .from("carelink-avatars")
    .list(user.id);

  if (files?.length) {
    await admin.storage
      .from("carelink-avatars")
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidateSettings();
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  await requireCaregiver();
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: true };
}

export async function resetNotificationSettings() {
  return updateNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
}
