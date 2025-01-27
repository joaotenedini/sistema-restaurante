/*
  # Adicionar suporte a múltiplos estabelecimentos

  1. Novas Tabelas
    - `establishments` - Armazena informações dos estabelecimentos
      - `id` (uuid, primary key)
      - `name` (text) - Nome do estabelecimento
      - `address` (text) - Endereço
      - `phone` (text) - Telefone
      - `logo_url` (text) - URL do logo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modificações
    - Adiciona coluna `establishment_id` em tabelas existentes
    - Cria políticas RLS para isolamento de dados entre estabelecimentos

  3. Segurança
    - Habilita RLS na tabela establishments
    - Cria políticas para garantir que usuários só vejam seus estabelecimentos
*/

-- Criar tabela de estabelecimentos
CREATE TABLE establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Usuários autenticados podem ver estabelecimentos"
ON establishments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins podem gerenciar estabelecimentos"
ON establishments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
);

-- Adicionar establishment_id nas tabelas existentes
ALTER TABLE users ADD COLUMN establishment_id uuid REFERENCES establishments(id);
ALTER TABLE inventory_items ADD COLUMN establishment_id uuid REFERENCES establishments(id);
ALTER TABLE cash_registers ADD COLUMN establishment_id uuid REFERENCES establishments(id);
ALTER TABLE orders ADD COLUMN establishment_id uuid REFERENCES establishments(id);
ALTER TABLE tables ADD COLUMN establishment_id uuid REFERENCES establishments(id);

-- Criar índices para melhor performance
CREATE INDEX idx_users_establishment ON users(establishment_id);
CREATE INDEX idx_inventory_establishment ON inventory_items(establishment_id);
CREATE INDEX idx_cash_registers_establishment ON cash_registers(establishment_id);
CREATE INDEX idx_orders_establishment ON orders(establishment_id);
CREATE INDEX idx_tables_establishment ON tables(establishment_id);

-- Função para atualizar timestamp de atualização
CREATE OR REPLACE FUNCTION update_establishment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_establishment_timestamp
  BEFORE UPDATE ON establishments
  FOR EACH ROW
  EXECUTE FUNCTION update_establishment_updated_at();