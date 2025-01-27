-- Desabilitar RLS temporariamente para garantir que podemos fazer as alterações
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow admin inserts" ON users;
DROP POLICY IF EXISTS "Allow admin updates" ON users;
DROP POLICY IF EXISTS "Allow admin deletes" ON users;
DROP POLICY IF EXISTS "Allow authenticated users access" ON users;

-- Remover triggers existentes
DROP TRIGGER IF EXISTS prevent_last_admin_deletion_trigger ON users;

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar política que permite acesso público para leitura (necessário para login)
CREATE POLICY "users_read_policy"
ON users FOR SELECT
TO public
USING (true);

-- Criar política que permite todas as operações para usuários autenticados
CREATE POLICY "users_write_policy"
ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Garantir que as permissões estão corretas
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;