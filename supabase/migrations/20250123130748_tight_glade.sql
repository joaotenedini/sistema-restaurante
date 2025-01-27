/*
  # Inventory System Schema Update

  1. Tables
    - Ensures safe creation of inventory tables
    - Handles existing tables gracefully
    - Includes all necessary constraints and defaults

  2. Security
    - Enables RLS on all tables
    - Creates appropriate access policies
    - Ensures data safety and proper access control

  3. Functions & Triggers
    - Adds inventory management functions
    - Creates automated triggers for inventory tracking
    - Implements stock alerts system
*/

-- Safe creation of inventory tables with proper error handling
DO $$ 
BEGIN
  -- Create inventory_items if not exists
  CREATE TABLE IF NOT EXISTS inventory_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    unit text NOT NULL,
    quantity decimal(10,3) NOT NULL DEFAULT 0,
    min_quantity decimal(10,3) NOT NULL DEFAULT 0,
    cost_price decimal(10,2),
    supplier text,
    category text,
    location text,
    expiry_date date,
    barcode text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Create inventory_transactions if not exists
  CREATE TABLE IF NOT EXISTS inventory_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id uuid REFERENCES inventory_items(id),
    type text NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'waste')),
    quantity decimal(10,3) NOT NULL,
    unit_price decimal(10,2),
    total_price decimal(10,2),
    notes text,
    user_id uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now()
  );

  -- Create menu_ingredients if not exists
  CREATE TABLE IF NOT EXISTS menu_ingredients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id text NOT NULL,
    inventory_item_id uuid REFERENCES inventory_items(id),
    quantity decimal(10,3) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Create inventory_alerts if not exists
  CREATE TABLE IF NOT EXISTS inventory_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id uuid REFERENCES inventory_items(id),
    type text NOT NULL CHECK (type IN ('low_stock', 'expiring', 'expired')),
    message text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

EXCEPTION 
  WHEN others THEN 
    RAISE NOTICE 'Error creating tables: %', SQLERRM;
END $$;

-- Enable RLS on all tables
DO $$ 
BEGIN
  ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE menu_ingredients ENABLE ROW LEVEL SECURITY;
  ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
EXCEPTION 
  WHEN others THEN 
    RAISE NOTICE 'Error enabling RLS: %', SQLERRM;
END $$;

-- Create or replace policies
DO $$ 
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Allow read for authenticated" ON inventory_items;
  DROP POLICY IF EXISTS "Allow write for stock and admin" ON inventory_items;
  DROP POLICY IF EXISTS "Allow read transactions" ON inventory_transactions;
  DROP POLICY IF EXISTS "Allow write transactions" ON inventory_transactions;
  DROP POLICY IF EXISTS "Allow read ingredients" ON menu_ingredients;
  DROP POLICY IF EXISTS "Allow write ingredients" ON menu_ingredients;
  DROP POLICY IF EXISTS "Allow read alerts" ON inventory_alerts;
  DROP POLICY IF EXISTS "Allow write alerts" ON inventory_alerts;

  -- Create new policies
  CREATE POLICY "Allow read for authenticated" ON inventory_items 
    FOR SELECT TO authenticated USING (true);
  
  CREATE POLICY "Allow write for stock and admin" ON inventory_items 
    FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role LIKE '%admin%' OR role LIKE '%stock%')
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role LIKE '%admin%' OR role LIKE '%stock%')
    ));

  CREATE POLICY "Allow read transactions" ON inventory_transactions 
    FOR SELECT TO authenticated USING (true);
  
  CREATE POLICY "Allow write transactions" ON inventory_transactions 
    FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role LIKE '%admin%' OR role LIKE '%stock%')
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role LIKE '%admin%' OR role LIKE '%stock%')
    ));

  CREATE POLICY "Allow read ingredients" ON menu_ingredients 
    FOR SELECT TO authenticated USING (true);
  
  CREATE POLICY "Allow write ingredients" ON menu_ingredients 
    FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role LIKE '%admin%' OR role LIKE '%stock%')
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role LIKE '%admin%' OR role LIKE '%stock%')
    ));

  CREATE POLICY "Allow read alerts" ON inventory_alerts 
    FOR SELECT TO authenticated USING (true);
  
  CREATE POLICY "Allow write alerts" ON inventory_alerts 
    FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role LIKE '%admin%' OR role LIKE '%stock%')
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role LIKE '%admin%' OR role LIKE '%stock%')
    ));

EXCEPTION 
  WHEN others THEN 
    RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;

-- Create or replace functions
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IN ('in', 'adjustment') THEN
    UPDATE inventory_items
    SET quantity = quantity + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  ELSE
    UPDATE inventory_items
    SET quantity = quantity - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= NEW.min_quantity AND NOT EXISTS (
    SELECT 1 FROM inventory_alerts
    WHERE item_id = NEW.id
    AND type = 'low_stock'
    AND status = 'pending'
  ) THEN
    INSERT INTO inventory_alerts (
      item_id,
      type,
      message,
      status
    ) VALUES (
      NEW.id,
      'low_stock',
      'Estoque baixo: ' || NEW.name || ' (Quantidade: ' || NEW.quantity || ' ' || NEW.unit || ')',
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace triggers
DO $$ 
BEGIN
  -- Drop existing triggers to avoid conflicts
  DROP TRIGGER IF EXISTS update_inventory_items_timestamp ON inventory_items;
  DROP TRIGGER IF EXISTS update_menu_ingredients_timestamp ON menu_ingredients;
  DROP TRIGGER IF EXISTS update_inventory_alerts_timestamp ON inventory_alerts;
  DROP TRIGGER IF EXISTS update_inventory_quantity_trigger ON inventory_transactions;
  DROP TRIGGER IF EXISTS check_low_stock_trigger ON inventory_items;

  -- Create new triggers
  CREATE TRIGGER update_inventory_items_timestamp
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

  CREATE TRIGGER update_menu_ingredients_timestamp
    BEFORE UPDATE ON menu_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

  CREATE TRIGGER update_inventory_alerts_timestamp
    BEFORE UPDATE ON inventory_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

  CREATE TRIGGER update_inventory_quantity_trigger
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_quantity();

  CREATE TRIGGER check_low_stock_trigger
    AFTER INSERT OR UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();

EXCEPTION 
  WHEN others THEN 
    RAISE NOTICE 'Error creating triggers: %', SQLERRM;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_menu_ingredients_menu_item_id ON menu_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_status ON inventory_alerts(status);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(type);