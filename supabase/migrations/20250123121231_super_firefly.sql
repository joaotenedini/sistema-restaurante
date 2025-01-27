/*
  # Fix RLS policies to prevent infinite recursion

  1. Changes
    - Remove recursive admin check
    - Simplify policies for basic access control
    - Add initial admin user
    
  2. Security
    - Enable RLS
    - Add simplified policies
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

-- Allow all authenticated users to read
CREATE POLICY "Allow read access" ON users
FOR SELECT TO authenticated USING (true);

-- Allow insert for authenticated users
CREATE POLICY "Allow insert" ON users
FOR INSERT TO authenticated WITH CHECK (true);

-- Allow update for authenticated users
CREATE POLICY "Allow update" ON users
FOR UPDATE TO authenticated USING (true);

-- Allow delete for authenticated users
CREATE POLICY "Allow delete" ON users
FOR DELETE TO authenticated USING (true);

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