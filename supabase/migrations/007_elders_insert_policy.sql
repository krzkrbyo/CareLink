-- Ensure caregivers and elders can insert elder rows (fixes RLS on add-profile flows)

DROP POLICY IF EXISTS elders_caregiver_insert ON elders;

CREATE POLICY elders_caregiver_insert ON elders FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'caregiver'
      )
      OR auth_user_id = auth.uid()
    )
  );
