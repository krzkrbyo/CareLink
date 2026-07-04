-- Calendarización avanzada de medicamentos

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS schedule JSONB NOT NULL DEFAULT '{"times":["08:00"],"daysOfWeek":[1,2,3,4,5,6,7]}'::jsonb,
  ADD COLUMN IF NOT EXISTS calendar_export_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN medications.schedule IS 'Horarios y días: { "times": ["08:00","20:00"], "daysOfWeek": [1..7] } (1=lunes)';
COMMENT ON COLUMN medications.end_date IS 'NULL = tratamiento continuo sin fecha de fin';
