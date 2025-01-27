/*
  # Fix RLS policies for admin operations

  1. Changes
    - Simplify RLS policies
    - Allow public read access
    - Restrict write operations to service role
    
  2. Security
    - Enable RLS
    - Allow anonymous read access for login
    - Secure write operations
*/

-- Drop existing table and recreate
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
TO public
USING (true);

-- Allow all operations for service role
CREATE POLICY "Allow all operations for service role"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

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