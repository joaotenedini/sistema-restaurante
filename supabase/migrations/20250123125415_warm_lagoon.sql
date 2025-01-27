/*
  # Sistema de Restaurante - Novas Funcionalidades

  1. Novas Tabelas
    - Mesas (tables)
    - Reservas (reservations)
    - Pedidos (orders)

  2. Funcionalidades
    - Controle de mesas e reservas
    - Taxa de serviço
    - Divisão de contas
*/

-- Tabela de pedidos
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'paid')),
  total decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  payment_method text CHECK (payment_method IN ('credit', 'debit', 'pix', 'cash', 'meal-ticket')),
  paid_amount decimal(10,2),
  change decimal(10,2),
  cash_register_id uuid,
  service_fee decimal(10,2),
  split_with uuid[] DEFAULT '{}',
  parent_order_id uuid REFERENCES orders(id)
);

-- Tabela de mesas
CREATE TABLE tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  capacity integer NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de reservas
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables(id),
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  party_size integer NOT NULL,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
CREATE POLICY "Permitir leitura de pedidos para autenticados"
ON orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir gerenciamento de pedidos para autenticados"
ON orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para tables
CREATE POLICY "Permitir leitura para autenticados"
ON tables FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir gerenciamento para admin e garçom"
ON tables
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role LIKE '%admin%'
      OR role LIKE '%waiter%'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role LIKE '%admin%'
      OR role LIKE '%waiter%'
    )
  )
);

-- Políticas para reservations
CREATE POLICY "Permitir leitura de reservas para autenticados"
ON reservations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir gerenciamento de reservas para admin e garçom"
ON reservations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role LIKE '%admin%'
      OR role LIKE '%waiter%'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role LIKE '%admin%'
      OR role LIKE '%waiter%'
    )
  )
);

-- Funções auxiliares
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);