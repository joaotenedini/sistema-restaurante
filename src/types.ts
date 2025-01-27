// ... (manter código existente)

// Módulo Financeiro
export interface FinancialTransaction {
  id: string;
  establishment_id: string;
  type: 'payable' | 'receivable';
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'cancelled';
  payment_date?: string;
  payment_method?: string;
  category: string;
  document_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  establishment_id: string;
  user_id: string;
  order_id: string;
  amount: number;
  percentage: number;
  status: 'pending' | 'paid' | 'cancelled';
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

// Módulo RH
export interface Employee {
  id: string;
  establishment_id: string;
  user_id: string;
  full_name: string;
  document_number: string;
  birth_date?: string;
  hire_date: string;
  position: string;
  department: string;
  salary?: number;
  status: 'active' | 'inactive' | 'vacation' | 'leave';
  created_at: string;
  updated_at: string;
}

export interface WorkSchedule {
  id: string;
  establishment_id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  status: 'scheduled' | 'completed' | 'absent' | 'changed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Vacation {
  id: string;
  establishment_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'approved' | 'cancelled' | 'completed';
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceReview {
  id: string;
  establishment_id: string;
  employee_id: string;
  review_date: string;
  reviewer_id: string;
  score: number;
  strengths: string[];
  improvements: string[];
  goals: string[];
  comments?: string;
  status: 'draft' | 'completed' | 'acknowledged';
  created_at: string;
  updated_at: string;
}

// Módulo de Equipamentos
export interface Equipment {
  id: string;
  establishment_id: string;
  name: string;
  type: 'printer' | 'pdv' | 'scale' | 'other';
  model?: string;
  serial_number?: string;
  ip_address?: string;
  port?: string;
  status: 'active' | 'inactive' | 'maintenance';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentMaintenance {
  id: string;
  establishment_id: string;
  equipment_id: string;
  maintenance_date: string;
  type: 'preventive' | 'corrective';
  description: string;
  cost?: number;
  technician?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}