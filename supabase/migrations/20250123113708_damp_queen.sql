/*
  # Atualização do sistema de autenticação e estoque

  1. Alterações na Autenticação
    - Adiciona campo numeric_id (ID numérico único)
    - Adiciona campo pin (senha numérica de 4 dígitos)
    
  2. Ajustes nas Tabelas de Estoque
    - Adiciona campos para controle de validade
    - Adiciona campos para controle de fornecedor
    - Adiciona campos para controle de preço de custo
*/

-- Atualização da tabela users
ALTER TABLE users 
ADD COLUMN numeric_id INTEGER UNIQUE NOT NULL GENERATED ALWAYS AS IDENTITY,
ADD COLUMN pin VARCHAR(4) NOT NULL;

-- Atualização da tabela inventory_items
ALTER TABLE inventory_items
ADD COLUMN supplier TEXT,
ADD COLUMN cost_price DECIMAL(10,2),
ADD COLUMN expiry_date DATE,
ADD COLUMN last_purchase_date DATE,
ADD COLUMN barcode TEXT UNIQUE,
ADD COLUMN location TEXT,
ADD COLUMN category TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_numeric_id ON users(numeric_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode ON inventory_items(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);