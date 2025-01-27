-- Drop and recreate cash_registers table with proper RLS
DROP TABLE IF EXISTS cash_registers CASCADE;

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

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated users full access" ON cash_registers;

-- Create separate policies for each operation type
CREATE POLICY "Allow authenticated users to view cash registers"
ON cash_registers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert cash registers"
ON cash_registers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cash registers"
ON cash_registers FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete cash registers"
ON cash_registers FOR DELETE
TO authenticated
USING (true);

-- Create function to prevent multiple open registers
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for preventing multiple open registers
DROP TRIGGER IF EXISTS check_open_registers_trigger ON cash_registers;
CREATE TRIGGER check_open_registers_trigger
  BEFORE INSERT OR UPDATE ON cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION check_open_registers();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_cash_register_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_cash_register_updated_at ON cash_registers;
CREATE TRIGGER update_cash_register_updated_at
  BEFORE UPDATE ON cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_register_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_registers_user_id ON cash_registers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_at ON cash_registers(opened_at);

-- Grant necessary permissions to authenticated users
GRANT ALL ON cash_registers TO authenticated;