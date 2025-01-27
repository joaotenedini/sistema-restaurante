/*
  # Cash Register System Update

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
  user_id uuid DEFAULT auth.uid() REFERENCES users(id),
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

-- Allow cashiers and admins to manage registers
CREATE POLICY "Allow management for cashiers and admins"
ON cash_registers
FOR ALL
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
)
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

-- Function to prevent multiple open registers
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

-- Trigger to prevent multiple open registers
CREATE TRIGGER check_open_registers_trigger
  BEFORE INSERT OR UPDATE ON cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION check_open_registers();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_cash_register_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating timestamps
CREATE TRIGGER update_cash_register_updated_at
  BEFORE UPDATE ON cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_register_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_registers_user_id ON cash_registers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_at ON cash_registers(opened_at);