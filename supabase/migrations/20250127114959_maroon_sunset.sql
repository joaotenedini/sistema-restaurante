-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users access" ON cash_registers;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON cash_registers;
DROP POLICY IF EXISTS "Allow insert for cashiers and admins" ON cash_registers;
DROP POLICY IF EXISTS "Allow update for cashiers and admins" ON cash_registers;
DROP POLICY IF EXISTS "Allow delete for admins" ON cash_registers;

-- Enable RLS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

-- Create a single policy for all operations
CREATE POLICY "Allow authenticated users full access"
ON cash_registers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role LIKE '%cashier%' OR role LIKE '%admin%')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role LIKE '%cashier%' OR role LIKE '%admin%')
  )
);

-- Grant necessary permissions
GRANT ALL ON cash_registers TO authenticated;