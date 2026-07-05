export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: "caregiver" | "elder";
          avatar_url: string | null;
          phone: string | null;
          bio: string | null;
          notification_settings: Json | null;
          updated_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          full_name: string;
          role: "caregiver" | "elder";
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      elders: {
        Row: {
          id: string;
          full_name: string;
          age: number | null;
          main_caregiver_name: string | null;
          emergency_contact: string | null;
          last_activity_at: string | null;
          mood_today: string | null;
          auth_user_id: string | null;
          slug: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["elders"]["Row"]> & {
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["elders"]["Row"]>;
      };
      medications: {
        Row: {
          id: string;
          elder_id: string;
          name: string;
          dose: string | null;
          time: string | null;
          scheduled_time: string | null;
          frequency: string | null;
          notes: string | null;
          start_date: string;
          end_date: string | null;
          schedule: Json;
          calendar_export_enabled: boolean;
          active: boolean | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["medications"]["Row"]> & {
          elder_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["medications"]["Row"]>;
      };
      appointments: {
        Row: {
          id: string;
          elder_id: string;
          title: string;
          type: "cita" | "examen";
          starts_at: string;
          notes: string | null;
          calendar_export_enabled: boolean | null;
          facility_id: string | null;
          professional_id: string | null;
          facility_name: string | null;
          professional_name: string | null;
          location_text: string | null;
          exam_subtype: "sangre" | "imagen" | "cardiaco" | "otro" | null;
          preparation_notes: string | null;
          duration_minutes: number | null;
          status: "scheduled" | "completed" | "cancelled" | "rescheduled" | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["appointments"]["Row"]> & {
          elder_id: string;
          title: string;
          type: "cita" | "examen";
          starts_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Row"]>;
      };
      medical_facilities: {
        Row: {
          id: string;
          elder_id: string;
          name: string;
          type: "hospital" | "clinica" | "laboratorio" | "otro";
          address: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["medical_facilities"]["Row"]> & {
          elder_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["medical_facilities"]["Row"]>;
      };
      medical_professionals: {
        Row: {
          id: string;
          elder_id: string;
          facility_id: string | null;
          full_name: string;
          specialty: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["medical_professionals"]["Row"]> & {
          elder_id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["medical_professionals"]["Row"]>;
      };
      food_rules: {
        Row: {
          id: string;
          elder_id: string;
          type: "allergen" | "prohibited" | "reduce" | "recommendation";
          label: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["food_rules"]["Row"]> & {
          elder_id: string;
          type: "allergen" | "prohibited" | "reduce" | "recommendation";
          label: string;
        };
        Update: Partial<Database["public"]["Tables"]["food_rules"]["Row"]>;
      };
      reminders: {
        Row: {
          id: string;
          elder_id: string;
          type: string;
          title: string;
          message_text: string | null;
          caregiver_message_text: string | null;
          audio_url: string | null;
          due_at: string | null;
          status: "pending" | "completed" | "missed";
          appointment_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reminders"]["Row"]> & {
          elder_id: string;
          type: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminders"]["Row"]>;
      };
      interactions: {
        Row: {
          id: string;
          elder_id: string;
          type: string;
          value: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["interactions"]["Row"]> & {
          elder_id: string;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["interactions"]["Row"]>;
      };
      alerts: {
        Row: {
          id: string;
          elder_id: string;
          severity: "low" | "medium" | "high";
          type: string;
          message: string;
          status: "active" | "resolved";
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["alerts"]["Row"]> & {
          elder_id: string;
          severity: "low" | "medium" | "high";
          type: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Row"]>;
      };
      caregiver_elder_links: {
        Row: {
          id: string;
          caregiver_id: string;
          elder_id: string;
          relationship: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["caregiver_elder_links"]["Row"]
        > & {
          caregiver_id: string;
          elder_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["caregiver_elder_links"]["Row"]
        >;
      };
    };
  };
}

export type Elder = Database["public"]["Tables"]["elders"]["Row"];
export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
export type Interaction = Database["public"]["Tables"]["interactions"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type MedicalFacility = Database["public"]["Tables"]["medical_facilities"]["Row"];
export type MedicalProfessional = Database["public"]["Tables"]["medical_professionals"]["Row"];
export type Medication = Database["public"]["Tables"]["medications"]["Row"];
export type FoodRule = Database["public"]["Tables"]["food_rules"]["Row"];
