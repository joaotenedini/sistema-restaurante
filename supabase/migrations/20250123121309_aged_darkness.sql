/*
  # Fix authentication and RLS policies

  1. Changes
    - Add auth schema configuration
    - Update RLS policies to work with anonymous access
    - Add service role policy for admin operations
    
  2. Security
    - Enable RLS
    - Allow anonymous access for initial setup
    - Secure admin operations
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

-- Allow anonymous access for initial setup
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Allow read access for everyone (needed for login)
CREATE POLICY "Allow read access for all"
ON users FOR SELECT
TO public
USING (true);

-- Allow insert/update/delete for service role only
CREATE POLICY "Allow full access for service role"
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

-- Insert initial admin user
INSERT INTO users (name, role, pin) 
VALUES ('Admin', 'admin', '1706');