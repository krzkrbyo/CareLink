-- Elders can read profiles of caregivers linked to them (for voice context and portal)

CREATE POLICY profiles_elder_select_caregivers ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM caregiver_elder_links l
      JOIN elders e ON e.id = l.elder_id
      WHERE l.caregiver_id = profiles.id
        AND e.auth_user_id = auth.uid()
    )
  );
