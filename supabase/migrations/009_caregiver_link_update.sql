-- Caregivers can update their link metadata (e.g. relationship label)

CREATE POLICY links_caregiver_update ON caregiver_elder_links FOR UPDATE
  USING (caregiver_id = auth.uid())
  WITH CHECK (caregiver_id = auth.uid());
