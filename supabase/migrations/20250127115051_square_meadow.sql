-- Drop all existing policies
DROP POLICY IF EXISTS "cash_registers_policy" ON cash_registers;
DROP POLICY IF EXISTS "Allow authenticated users access" ON cash_registers;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON cash_registers;
DROP POLICY IF EXISTS "Allow insert for cashiers and admins" ON cash_registers;
DROP POLICY IF EXISTS "Allow update for cashiers and admins" ON cash_registers;
DROP POLICY IF EXISTS "Allow delete for admins" ON cash_registers;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON cash_registers;

-- Disable RLS completely for cash_registers
ALTER TABLE cash_registers DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to both authenticated and anonymous users
GRANT ALL ON cash_registers TO authenticated;
GRANT ALL ON cash_registers TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Create a function to prevent multiple open registers
CREATE OR REPLACE FUNCTION check_open_registers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'open' AND EXISTS (
    SELECT 1 FROM cash_registers 
    WHERE status = 'open' 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'There is already an open register';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for preventing multiple open registers
DROP TRIGGER IF EXISTS check_open_registers_trigger ON cash_registers;
CREATE TRIGGER check_open_registers_trigger
  BEFORE INSERT OR UPDATE ON cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION check_open_registers();