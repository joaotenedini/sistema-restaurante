-- Drop existing table and recreate with correct policies
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  pin varchar(4) NOT NULL,
  numeric_id INTEGER UNIQUE NOT NULL GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for login)
CREATE POLICY "Allow public read access"
ON users FOR SELECT
USING (true);

-- Allow anonymous inserts (needed for creating users)
CREATE POLICY "Allow anonymous inserts"
ON users FOR INSERT
WITH CHECK (true);

-- Allow updates for admin users
CREATE POLICY "Allow admin updates"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE role LIKE '%admin%' 
    AND id = auth.uid()
  )
);

-- Allow deletes for admin users
CREATE POLICY "Allow admin deletes"
ON users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE role LIKE '%admin%' 
    AND id = auth.uid()
  )
);

-- Create function to validate PIN
CREATE OR REPLACE FUNCTION check_admin_pin(pin_to_check text)
RETURNS boolean AS $$
BEGIN
  RETURN pin_to_check = '1706';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    INSERT INTO users (name, role, pin) 
    VALUES ('Admin', 'admin', '1706');
  END IF;
END $$;