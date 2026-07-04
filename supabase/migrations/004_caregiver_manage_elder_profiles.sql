-- Caregivers can read/update profiles of linked elders they manage

CREATE POLICY profiles_caregiver_select_linked ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM elders e
      JOIN caregiver_elder_links l ON l.elder_id = e.id
      WHERE e.auth_user_id = profiles.id AND l.caregiver_id = auth.uid()
    )
  );

CREATE POLICY profiles_caregiver_update_linked ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM elders e
      JOIN caregiver_elder_links l ON l.elder_id = e.id
      WHERE e.auth_user_id = profiles.id AND l.caregiver_id = auth.uid()
    )
  );
