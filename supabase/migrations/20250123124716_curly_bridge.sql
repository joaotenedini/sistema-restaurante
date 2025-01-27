/*
  # Cash Register Table with Updated RLS Policies

  1. Structure
    - Table for managing cash register operations
    - Columns for tracking amounts, status, and sales
    - Timestamps for opening/closing and auditing
  
  2. Security
    - RLS enabled with proper policies
    - Separate policies for different operations
    - Proper user role checks
*/

-- Drop existing table if exists
DROP TABLE IF EXISTS cash_registers CASCADE;

-- Create cash_registers table
CREATE TABLE cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  initial_amount decimal(10,2) NOT NULL,
  final_amount decimal(10,2),
  difference decimal(10,2),
  status text NOT NULL CHECK (status IN ('open', 'closed')),
  user_id uuid REFERENCES users(id),
  notes text,
  cash_sales decimal(10,2) DEFAULT 0,
  card_sales decimal(10,2) DEFAULT 0,
  pix_sales decimal(10,2) DEFAULT 0,
  meal_ticket_sales decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Allow all authenticated users to read cash registers
CREATE POLICY "Allow read for authenticated users"
ON cash_registers FOR SELECT
TO authenticated
USING (true);

-- Allow cashiers and admins to insert new registers
CREATE POLICY "Allow insert for cashiers and admins"
ON cash_registers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role LIKE '%cashier%'
      OR role LIKE '%admin%'
    )
  )
);

-- Allow cashiers and admins to update registers
CREATE POLICY "Allow update for cashiers and admins"
ON cash_registers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role LIKE '%cashier%'
      OR role LIKE '%admin%'
    )
  )
);

-- Allow only admins to delete registers
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_cash_register_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_cash_register_updated_at ON cash_registers;
CREATE TRIGGER update_cash_register_updated_at
  BEFORE UPDATE ON cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_register_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_registers_user_id ON cash_registers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_at ON cash_registers(opened_at);