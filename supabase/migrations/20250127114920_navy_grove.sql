-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users access" ON cash_registers;

-- Enable RLS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

-- Create policies for cash registers
CREATE POLICY "Allow read access to authenticated users"
ON cash_registers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for cashiers and admins"
ON cash_registers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role LIKE '%cashier%' OR role LIKE '%admin%')
  )
);

CREATE POLICY "Allow update for cashiers and admins"
ON cash_registers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role LIKE '%cashier%' OR role LIKE '%admin%')
  )
);

CREATE POLICY "Allow delete for admins"
ON cash_registers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
);

-- Grant necessary permissions
GRANT ALL ON cash_registers TO authenticated;