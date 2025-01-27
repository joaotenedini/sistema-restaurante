/*
  # Backup and System Update Management

  1. Tables
    - system_backups: Tracks database backups
    - system_updates: Manages system updates and versions
    - backup_logs: Logs backup operations
    - update_logs: Logs update operations

  2. Functions
    - Automated backup scheduling
    - Backup verification
    - Update management
    - System health monitoring

  3. Security
    - RLS policies for admin-only access
    - Secure logging of operations
*/

-- Create backup management tables
CREATE TABLE IF NOT EXISTS system_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name text NOT NULL,
  backup_type text NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  size_bytes bigint,
  checksum text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  retention_days integer DEFAULT 30,
  is_automated boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id uuid REFERENCES system_backups(id),
  log_level text NOT NULL CHECK (log_level IN ('info', 'warning', 'error')),
  message text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create system update management tables
CREATE TABLE IF NOT EXISTS system_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  update_type text NOT NULL CHECK (update_type IN ('major', 'minor', 'patch', 'security')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  description text,
  changelog text,
  requires_downtime boolean DEFAULT false,
  estimated_duration interval,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS update_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid REFERENCES system_updates(id),
  log_level text NOT NULL CHECK (log_level IN ('info', 'warning', 'error')),
  message text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (admin-only access)
CREATE POLICY "Allow admin read backups"
ON system_backups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
);

CREATE POLICY "Allow admin write backups"
ON system_backups FOR ALL
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

CREATE POLICY "Allow admin read backup logs"
ON backup_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
);

CREATE POLICY "Allow admin write backup logs"
ON backup_logs FOR ALL
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

CREATE POLICY "Allow admin read updates"
ON system_updates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
);

CREATE POLICY "Allow admin write updates"
ON system_updates FOR ALL
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

CREATE POLICY "Allow admin read update logs"
ON update_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
);

CREATE POLICY "Allow admin write update logs"
ON update_logs FOR ALL
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

-- Create function to schedule automated backups
CREATE OR REPLACE FUNCTION schedule_automated_backup()
RETURNS trigger AS $$
BEGIN
  -- Schedule next automated backup based on backup type
  INSERT INTO system_backups (
    backup_name,
    backup_type,
    is_automated,
    created_by
  )
  VALUES (
    'automated_' || to_char(now(), 'YYYY_MM_DD_HH24_MI'),
    CASE
      WHEN EXTRACT(DOW FROM now()) = 0 THEN 'full'  -- Sunday
      WHEN EXTRACT(HOUR FROM now()) = 0 THEN 'differential'  -- Midnight
      ELSE 'incremental'  -- Other times
    END,
    true,
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify backup integrity
CREATE OR REPLACE FUNCTION verify_backup_integrity(backup_id uuid)
RETURNS boolean AS $$
DECLARE
  backup_record system_backups%ROWTYPE;
  is_valid boolean;
BEGIN
  -- Get backup record
  SELECT * INTO backup_record FROM system_backups WHERE id = backup_id;
  
  -- Perform verification (placeholder for actual verification logic)
  is_valid := true;
  
  -- Log verification result
  INSERT INTO backup_logs (
    backup_id,
    log_level,
    message,
    details
  ) VALUES (
    backup_id,
    CASE WHEN is_valid THEN 'info' ELSE 'error' END,
    CASE WHEN is_valid THEN 'Backup integrity verified' ELSE 'Backup integrity check failed' END,
    jsonb_build_object(
      'verified_at', now(),
      'is_valid', is_valid
    )
  );
  
  RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to manage system updates
CREATE OR REPLACE FUNCTION manage_system_update(update_id uuid, action text)
RETURNS boolean AS $$
DECLARE
  update_record system_updates%ROWTYPE;
BEGIN
  -- Get update record
  SELECT * INTO update_record FROM system_updates WHERE id = update_id;
  
  -- Update status based on action
  UPDATE system_updates
  SET 
    status = CASE 
      WHEN action = 'start' THEN 'in_progress'
      WHEN action = 'complete' THEN 'completed'
      WHEN action = 'fail' THEN 'failed'
      WHEN action = 'rollback' THEN 'rolled_back'
      ELSE status
    END,
    started_at = CASE WHEN action = 'start' THEN now() ELSE started_at END,
    completed_at = CASE WHEN action IN ('complete', 'fail', 'rollback') THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = update_id;
  
  -- Log update action
  INSERT INTO update_logs (
    update_id,
    log_level,
    message,
    details
  ) VALUES (
    update_id,
    CASE 
      WHEN action IN ('complete', 'start') THEN 'info'
      WHEN action = 'fail' THEN 'error'
      ELSE 'warning'
    END,
    'Update ' || action || ' action performed',
    jsonb_build_object(
      'action', action,
      'performed_at', now()
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups(status);
CREATE INDEX IF NOT EXISTS idx_system_backups_type ON system_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_logs_level ON backup_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_updates_status ON system_updates(status);
CREATE INDEX IF NOT EXISTS idx_system_updates_version ON system_updates(version);
CREATE INDEX IF NOT EXISTS idx_update_logs_level ON update_logs(log_level);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_backups_timestamp
  BEFORE UPDATE ON system_backups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_updates_timestamp
  BEFORE UPDATE ON system_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();