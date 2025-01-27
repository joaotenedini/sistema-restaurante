-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow admin inserts" ON users;
DROP POLICY IF EXISTS "Allow admin updates" ON users;
DROP POLICY IF EXISTS "Allow admin deletes" ON users;
DROP POLICY IF EXISTS "Allow authenticated users access" ON users;

-- Remover triggers existentes
DROP TRIGGER IF EXISTS prevent_last_admin_deletion_trigger ON users;

-- Criar uma única política que permite todas as operações para usuários autenticados
CREATE POLICY "Allow authenticated users access"
ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Garantir que RLS está habilitado
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Garantir que a tabela está acessível para usuários autenticados
GRANT ALL ON users TO authenticated;