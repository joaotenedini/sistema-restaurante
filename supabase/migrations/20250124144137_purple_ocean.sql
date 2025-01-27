-- Módulo Financeiro

-- Contas a pagar/receber
CREATE TABLE financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id),
  type text NOT NULL CHECK (type IN ('payable', 'receivable')),
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_date date,
  payment_method text,
  category text NOT NULL,
  document_number text,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comissões
CREATE TABLE commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id),
  user_id uuid REFERENCES users(id),
  order_id uuid REFERENCES orders(id),
  amount decimal(10,2) NOT NULL,
  percentage decimal(5,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Módulo RH

-- Funcionários
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id),
  user_id uuid REFERENCES users(id),
  full_name text NOT NULL,
  document_number text NOT NULL,
  birth_date date,
  hire_date date NOT NULL,
  position text NOT NULL,
  department text NOT NULL,
  salary decimal(10,2),
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'vacation', 'leave')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Escalas
CREATE TABLE work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id),
  employee_id uuid REFERENCES employees(id),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_start time,
  break_end time,
  status text NOT NULL CHECK (status IN ('scheduled', 'completed', 'absent', 'changed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Férias
CREATE TABLE vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id),
  employee_id uuid REFERENCES employees(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'approved', 'cancelled', 'completed')),
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Avaliações
CREATE TABLE performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id),
  employee_id uuid REFERENCES employees(id),
  review_date date NOT NULL,
  reviewer_id uuid REFERENCES users(id),
  score integer CHECK (score >= 1 AND score <= 5),
  strengths text[],
  improvements text[],
  goals text[],
  comments text,
  status text NOT NULL CHECK (status IN ('draft', 'completed', 'acknowledged')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Módulo de Equipamentos

-- Equipamentos
CREATE TABLE equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('printer', 'pdv', 'scale', 'other')),
  model text,
  serial_number text,
  ip_address text,
  port text,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_maintenance_date timestamptz,
  next_maintenance_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Manutenções
CREATE TABLE equipment_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id),
  equipment_id uuid REFERENCES equipment(id),
  maintenance_date timestamptz NOT NULL,
  type text NOT NULL CHECK (type IN ('preventive', 'corrective')),
  description text NOT NULL,
  cost decimal(10,2),
  technician text,
  status text NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso baseadas no estabelecimento
CREATE POLICY "Usuários podem ver registros do seu estabelecimento" ON financial_transactions
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver registros do seu estabelecimento" ON commissions
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver registros do seu estabelecimento" ON employees
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver registros do seu estabelecimento" ON work_schedules
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver registros do seu estabelecimento" ON vacations
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver registros do seu estabelecimento" ON performance_reviews
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver registros do seu estabelecimento" ON equipment
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver registros do seu estabelecimento" ON equipment_maintenance
  FOR SELECT USING (
    establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  );

-- Criar índices para melhor performance
CREATE INDEX idx_financial_transactions_establishment ON financial_transactions(establishment_id);
CREATE INDEX idx_commissions_establishment ON commissions(establishment_id);
CREATE INDEX idx_employees_establishment ON employees(establishment_id);
CREATE INDEX idx_work_schedules_establishment ON work_schedules(establishment_id);
CREATE INDEX idx_vacations_establishment ON vacations(establishment_id);
CREATE INDEX idx_performance_reviews_establishment ON performance_reviews(establishment_id);
CREATE INDEX idx_equipment_establishment ON equipment(establishment_id);
CREATE INDEX idx_equipment_maintenance_establishment ON equipment_maintenance(establishment_id);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar timestamps
CREATE TRIGGER update_financial_transactions_timestamp
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_timestamp
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_timestamp
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_schedules_timestamp
  BEFORE UPDATE ON work_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacations_timestamp
  BEFORE UPDATE ON vacations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_reviews_timestamp
  BEFORE UPDATE ON performance_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_timestamp
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_maintenance_timestamp
  BEFORE UPDATE ON equipment_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();