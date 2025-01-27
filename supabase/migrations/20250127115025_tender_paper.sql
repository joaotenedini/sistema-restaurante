-- Temporarily disable RLS
ALTER TABLE cash_registers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users access" ON cash_registers;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON cash_registers;
DROP POLICY IF EXISTS "Allow insert for cashiers and admins" ON cash_registers;
DROP POLICY IF EXISTS "Allow update for cashiers and admins" ON cash_registers;
DROP POLICY IF EXISTS "Allow delete for admins" ON cash_registers;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON cash_registers;

-- Re-enable RLS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY "cash_registers_policy"
ON cash_registers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON cash_registers TO authenticated;
GRANT ALL ON cash_registers TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;