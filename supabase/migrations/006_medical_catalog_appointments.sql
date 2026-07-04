-- Medical catalog per elder + enriched appointments

CREATE TABLE medical_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'hospital' CHECK (type IN ('hospital', 'clinica', 'laboratorio', 'otro')),
  address TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE medical_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES medical_facilities(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_medical_facilities_elder ON medical_facilities(elder_id);
CREATE INDEX idx_medical_professionals_elder ON medical_professionals(elder_id);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES medical_facilities(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES medical_professionals(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS facility_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS professional_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location_text TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS exam_subtype TEXT CHECK (exam_subtype IS NULL OR exam_subtype IN ('sangre', 'imagen', 'cardiaco', 'otro'));
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS preparation_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled'));

ALTER TABLE reminders ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;

ALTER TABLE medical_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY medical_facilities_caregiver_all ON medical_facilities FOR ALL
  USING (is_caregiver_for_elder(elder_id))
  WITH CHECK (is_caregiver_for_elder(elder_id));

CREATE POLICY medical_facilities_elder_select ON medical_facilities FOR SELECT
  USING (is_elder_self(elder_id));

CREATE POLICY medical_professionals_caregiver_all ON medical_professionals FOR ALL
  USING (is_caregiver_for_elder(elder_id))
  WITH CHECK (is_caregiver_for_elder(elder_id));

CREATE POLICY medical_professionals_elder_select ON medical_professionals FOR SELECT
  USING (is_elder_self(elder_id));
