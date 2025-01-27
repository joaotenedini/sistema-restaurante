-- Desabilitar RLS temporariamente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar política de leitura pública
CREATE POLICY "users_read_policy"
ON users FOR SELECT
TO public
USING (true);

-- Criar política de escrita para usuários autenticados
CREATE POLICY "users_write_policy"
ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Garantir que o usuário service_role tem acesso total
GRANT ALL ON users TO service_role;

-- Garantir que usuários autenticados têm acesso total
GRANT ALL ON users TO authenticated;

-- Garantir que usuários anônimos podem ler
GRANT SELECT ON users TO anon;