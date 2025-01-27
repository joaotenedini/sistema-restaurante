/*
  # Offline Mode Support System

  1. New Tables
    - offline_queue: Armazena operações pendentes para sincronização
    - sync_status: Controla o estado de sincronização do sistema
    - offline_data: Cache local dos dados essenciais
    - sync_logs: Registra eventos de sincronização

  2. Functions
    - Queue management
    - Data synchronization
    - Conflict resolution
    - Cache management

  3. Security
    - RLS policies for data access
    - Secure sync operations
*/

-- Create offline support tables
CREATE TABLE IF NOT EXISTS offline_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL CHECK (operation_type IN ('insert', 'update', 'delete')),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count integer DEFAULT 0,
  error_message text,
  created_by uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sync_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_sync_at timestamptz,
  is_online boolean DEFAULT true,
  last_offline_at timestamptz,
  last_online_at timestamptz,
  pending_operations integer DEFAULT 0,
  sync_errors integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offline_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  data jsonb NOT NULL,
  last_updated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_essential boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(table_name, record_id)
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('sync_start', 'sync_complete', 'sync_error', 'offline_mode', 'online_mode')),
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read offline_queue"
ON offline_queue FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated write offline_queue"
ON offline_queue FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated read sync_status"
ON sync_status FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated write sync_status"
ON sync_status FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated read offline_data"
ON offline_data FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated write offline_data"
ON offline_data FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated read sync_logs"
ON sync_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated write sync_logs"
ON sync_logs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create functions for offline support
CREATE OR REPLACE FUNCTION queue_offline_operation(
  op_type text,
  tbl_name text,
  rec_id uuid,
  op_data jsonb
)
RETURNS uuid AS $$
DECLARE
  queue_id uuid;
BEGIN
  INSERT INTO offline_queue (
    operation_type,
    table_name,
    record_id,
    data,
    created_by
  ) VALUES (
    op_type,
    tbl_name,
    rec_id,
    op_data,
    auth.uid()
  ) RETURNING id INTO queue_id;

  -- Update pending operations count
  UPDATE sync_status
  SET pending_operations = pending_operations + 1,
      updated_at = now();

  RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cache data for offline use
CREATE OR REPLACE FUNCTION cache_offline_data(
  tbl_name text,
  rec_id uuid,
  cache_data jsonb,
  is_essential boolean DEFAULT false,
  ttl interval DEFAULT '24 hours'
)
RETURNS uuid AS $$
DECLARE
  cache_id uuid;
BEGIN
  INSERT INTO offline_data (
    table_name,
    record_id,
    data,
    is_essential,
    expires_at
  ) VALUES (
    tbl_name,
    rec_id,
    cache_data,
    is_essential,
    CASE WHEN is_essential THEN NULL ELSE now() + ttl END
  )
  ON CONFLICT (table_name, record_id) DO UPDATE
  SET data = EXCLUDED.data,
      last_updated_at = now(),
      expires_at = EXCLUDED.expires_at
  RETURNING id INTO cache_id;

  RETURN cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log sync events
CREATE OR REPLACE FUNCTION log_sync_event(
  event text,
  event_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO sync_logs (
    event_type,
    details
  ) VALUES (
    event,
    event_details
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle offline mode
CREATE OR REPLACE FUNCTION toggle_offline_mode(is_offline boolean)
RETURNS boolean AS $$
BEGIN
  UPDATE sync_status
  SET is_online = NOT is_offline,
      last_offline_at = CASE WHEN is_offline THEN now() ELSE last_offline_at END,
      last_online_at = CASE WHEN NOT is_offline THEN now() ELSE last_online_at END,
      updated_at = now();

  PERFORM log_sync_event(
    CASE WHEN is_offline THEN 'offline_mode' ELSE 'online_mode' END,
    jsonb_build_object(
      'timestamp', now(),
      'pending_operations', (SELECT pending_operations FROM sync_status LIMIT 1)
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_queue(status);
CREATE INDEX IF NOT EXISTS idx_offline_queue_table ON offline_queue(table_name);
CREATE INDEX IF NOT EXISTS idx_offline_data_table ON offline_data(table_name);
CREATE INDEX IF NOT EXISTS idx_offline_data_essential ON offline_data(is_essential);
CREATE INDEX IF NOT EXISTS idx_sync_logs_event ON sync_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at);

-- Create trigger for cleanup of expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS trigger AS $$
BEGIN
  DELETE FROM offline_data
  WHERE NOT is_essential
    AND expires_at < now();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_cache_trigger
  AFTER INSERT OR UPDATE ON offline_data
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_cache();

-- Initialize sync status if not exists
INSERT INTO sync_status (is_online, last_online_at)
SELECT true, now()
WHERE NOT EXISTS (SELECT 1 FROM sync_status);