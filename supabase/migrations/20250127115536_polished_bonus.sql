-- Add manager role capabilities

-- Update users table to add manager role
ALTER TABLE users
ADD COLUMN IF NOT EXISTS can_manage_users boolean DEFAULT false;

-- Create policy for managers to manage users in their establishment
CREATE POLICY "managers_manage_establishment_users"
ON users
FOR ALL
TO authenticated
USING (
  (
    -- User is a manager
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role LIKE '%manager%'
    )
    -- And the target user belongs to the same establishment
    AND establishment_id = (
      SELECT establishment_id FROM users
      WHERE id = auth.uid()
    )
  )
  OR
  -- Or user is an admin
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
)
WITH CHECK (
  (
    -- User is a manager
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role LIKE '%manager%'
    )
    -- And the target user belongs to the same establishment
    AND establishment_id = (
      SELECT establishment_id FROM users
      WHERE id = auth.uid()
    )
  )
  OR
  -- Or user is an admin
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
);

-- Function to check if user can manage establishment
CREATE OR REPLACE FUNCTION can_manage_establishment(establishment_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role LIKE '%admin%'
      OR (
        role LIKE '%manager%'
        AND establishment_id = $1
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;