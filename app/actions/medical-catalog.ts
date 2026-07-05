"use server";

import { createClient } from "@/lib/supabase/server";
import { requireCaregiverElderAccess } from "@/lib/auth/session";
import { revalidateElderCarePaths } from "@/lib/elders/revalidate";
import type { MedicalCatalog } from "@/lib/appointments/types";
import type { FacilityType } from "@/lib/appointments/types";

async function revalidateCatalog(elderId: string) {
  await revalidateElderCarePaths(elderId);
}

export async function getMedicalCatalog(elderId: string): Promise<MedicalCatalog> {
  await requireCaregiverElderAccess(elderId);
  const supabase = await createClient();

  const [{ data: facilities }, { data: professionals }] = await Promise.all([
    supabase
      .from("medical_facilities")
      .select("*")
      .eq("elder_id", elderId)
      .order("name"),
    supabase
      .from("medical_professionals")
      .select("*")
      .eq("elder_id", elderId)
      .order("full_name"),
  ]);

  return {
    facilities: facilities ?? [],
    professionals: professionals ?? [],
  };
}

export async function createFacility(
  elderId: string,
  data: {
    name: string;
    type: FacilityType;
    address?: string;
    phone?: string;
    notes?: string;
  }
) {
  await requireCaregiverElderAccess(elderId);
  const supabase = await createClient();

  const { data: facility, error } = await supabase
    .from("medical_facilities")
    .insert({
      elder_id: elderId,
      name: data.name.trim(),
      type: data.type,
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateCatalog(elderId);
  return facility;
}

export async function updateFacility(
  id: string,
  elderId: string,
  data: {
    name?: string;
    type?: FacilityType;
    address?: string;
    phone?: string;
    notes?: string;
  }
) {
  await requireCaregiverElderAccess(elderId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("medical_facilities")
    .update({
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.address !== undefined && { address: data.address.trim() || null }),
      ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
      ...(data.notes !== undefined && { notes: data.notes.trim() || null }),
    })
    .eq("id", id)
    .eq("elder_id", elderId);

  if (error) throw new Error(error.message);
  revalidateCatalog(elderId);
  return { success: true };
}

export async function deleteFacility(id: string, elderId: string) {
  await requireCaregiverElderAccess(elderId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("medical_facilities")
    .delete()
    .eq("id", id)
    .eq("elder_id", elderId);

  if (error) throw new Error(error.message);
  revalidateCatalog(elderId);
  return { success: true };
}

export async function createProfessional(
  elderId: string,
  data: {
    fullName: string;
    specialty?: string;
    facilityId?: string | null;
    phone?: string;
    notes?: string;
  }
) {
  await requireCaregiverElderAccess(elderId);
  const supabase = await createClient();

  const { data: professional, error } = await supabase
    .from("medical_professionals")
    .insert({
      elder_id: elderId,
      full_name: data.fullName.trim(),
      specialty: data.specialty?.trim() || null,
      facility_id: data.facilityId || null,
      phone: data.phone?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateCatalog(elderId);
  return professional;
}

export async function updateProfessional(
  id: string,
  elderId: string,
  data: {
    fullName?: string;
    specialty?: string;
    facilityId?: string | null;
    phone?: string;
    notes?: string;
  }
) {
  await requireCaregiverElderAccess(elderId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("medical_professionals")
    .update({
      ...(data.fullName !== undefined && { full_name: data.fullName.trim() }),
      ...(data.specialty !== undefined && { specialty: data.specialty.trim() || null }),
      ...(data.facilityId !== undefined && { facility_id: data.facilityId || null }),
      ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
      ...(data.notes !== undefined && { notes: data.notes.trim() || null }),
    })
    .eq("id", id)
    .eq("elder_id", elderId);

  if (error) throw new Error(error.message);
  revalidateCatalog(elderId);
  return { success: true };
}

export async function deleteProfessional(id: string, elderId: string) {
  await requireCaregiverElderAccess(elderId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("medical_professionals")
    .delete()
    .eq("id", id)
    .eq("elder_id", elderId);

  if (error) throw new Error(error.message);
  revalidateCatalog(elderId);
  return { success: true };
}
