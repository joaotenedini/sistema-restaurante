/*
  # Configuração do cash_register com políticas RLS corrigidas

  1. Estrutura
    - Tabela cash_registers para controle de caixa
    - Colunas para valores, status e timestamps
    - Campos para diferentes tipos de vendas
  
  2. Segurança
    - RLS habilitado com políticas específicas
    - Políticas separadas para cada operação
    - Trigger para atualização automática de timestamps
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

-- Política para leitura (SELECT)
CREATE POLICY "Permitir leitura para usuários autenticados"
ON cash_registers FOR SELECT
TO authenticated
USING (true);

-- Política para inserção (INSERT)
CREATE POLICY "Permitir inserção para caixa e admin"
ON cash_registers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role LIKE '%cashier%' OR role LIKE '%admin%')
  )
);

-- Política para atualização (UPDATE)
CREATE POLICY "Permitir atualização para caixa e admin"
ON cash_registers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role LIKE '%cashier%' OR role LIKE '%admin%')
  )
);

-- Política para exclusão (DELETE)
CREATE POLICY "Permitir exclusão para admin"
ON cash_registers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
);

-- Criar função de atualização
CREATE OR REPLACE FUNCTION update_cash_register_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS update_cash_register_updated_at ON cash_registers;
CREATE TRIGGER update_cash_register_updated_at
  BEFORE UPDATE ON cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_register_updated_at();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_registers_user_id ON cash_registers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_at ON cash_registers(opened_at);