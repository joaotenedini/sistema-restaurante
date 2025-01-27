/*
  # Restructure users table and policies

  1. Changes
    - Drop existing users table and recreate without email requirement
    - Remove auth.users dependency
    - Add automatic numeric_id generation
    - Update RLS policies for simpler access control
    
  2. Security
    - Enable RLS
    - Add policies for admin access
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

-- Admin can do everything
CREATE POLICY "Admin can do everything" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role LIKE '%admin%'
  )
);

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
FOR SELECT USING (
  id = auth.uid()
);

-- Create function to validate PIN
CREATE OR REPLACE FUNCTION check_admin_pin(pin_to_check text)
RETURNS boolean AS $$
BEGIN
  RETURN pin_to_check = '1706';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;