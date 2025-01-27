-- Modify the toggle_offline_mode function to properly handle the WHERE clause
CREATE OR REPLACE FUNCTION toggle_offline_mode(is_offline boolean)
RETURNS boolean AS $$
BEGIN
  -- Update only the first record, since we should only have one sync status record
  UPDATE sync_status
  SET is_online = NOT is_offline,
      last_offline_at = CASE WHEN is_offline THEN now() ELSE last_offline_at END,
      last_online_at = CASE WHEN NOT is_offline THEN now() ELSE last_online_at END,
      updated_at = now()
  WHERE id = (SELECT id FROM sync_status LIMIT 1);

  -- Log the mode change
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

-- Modify the cache_offline_data function to handle string IDs
CREATE OR REPLACE FUNCTION cache_offline_data(
  tbl_name text,
  rec_id text,
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
    gen_random_uuid(), -- Generate a new UUID for the record
    cache_data,
    is_essential,
    CASE WHEN is_essential THEN NULL ELSE now() + ttl END
  )
  RETURNING id INTO cache_id;

  RETURN cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify the offline_data table to accept text record_ids
ALTER TABLE offline_data 
  DROP CONSTRAINT offline_data_pkey CASCADE,
  ALTER COLUMN record_id TYPE text,
  ADD PRIMARY KEY (id);

-- Recreate the unique constraint
ALTER TABLE offline_data 
  ADD CONSTRAINT offline_data_table_record_unique UNIQUE (table_name, record_id);