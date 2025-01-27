/*
  # Sistema de Caixa

  1. Nova Tabela
    - `cash_registers`
      - `id` (uuid, chave primária)
      - `opened_at` (timestamp com timezone)
      - `closed_at` (timestamp com timezone, opcional)
      - `initial_amount` (decimal)
      - `final_amount` (decimal, opcional)
      - `difference` (decimal, opcional)
      - `status` (text, 'open' ou 'closed')
      - `user_id` (uuid, referência à tabela users)
      - `notes` (text, opcional)
      - `cash_sales` (decimal, opcional)
      - `card_sales` (decimal, opcional)
      - `pix_sales` (decimal, opcional)
      - `meal_ticket_sales` (decimal, opcional)

  2. Segurança
    - Habilitar RLS na tabela
    - Políticas para:
      - Leitura: usuários autenticados
      - Inserção: usuários autenticados com função de caixa ou admin
      - Atualização: usuários autenticados com função de caixa ou admin
*/

-- Criar tabela cash_registers
CREATE TABLE IF NOT EXISTS cash_registers (
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

-- Habilitar RLS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança

-- Leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler registros de caixa"
ON cash_registers FOR SELECT
USING (true);

-- Inserção para caixa e admin
CREATE POLICY "Caixa e admin podem criar registros"
ON cash_registers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role LIKE '%cashier%' OR role LIKE '%admin%')
  )
);

-- Atualização para caixa e admin
CREATE POLICY "Caixa e admin podem atualizar registros"
ON cash_registers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role LIKE '%cashier%' OR role LIKE '%admin%')
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_cash_register_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cash_register_updated_at
  BEFORE UPDATE ON cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_register_updated_at();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_registers_user_id ON cash_registers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_at ON cash_registers(opened_at);