-- Ajustar políticas de segurança para permitir exclusão de usuários

-- Remover políticas existentes para recriar com as permissões corretas
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON users;
DROP POLICY IF EXISTS "Allow admin updates" ON users;
DROP POLICY IF EXISTS "Allow admin deletes" ON users;

-- Criar novas políticas com permissões adequadas

-- Política de leitura pública (necessária para login)
CREATE POLICY "Allow public read access"
ON users FOR SELECT
USING (true);

-- Política para inserção de usuários
CREATE POLICY "Allow admin inserts"
ON users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
);

-- Política para atualização de usuários
CREATE POLICY "Allow admin updates"
ON users FOR UPDATE
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

-- Política para exclusão de usuários
CREATE POLICY "Allow admin deletes"
ON users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role LIKE '%admin%'
  )
  AND id != auth.uid() -- Impede que o usuário exclua a si mesmo
);

-- Função para verificar se é o último administrador
CREATE OR REPLACE FUNCTION prevent_last_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role LIKE '%admin%' AND (
    SELECT COUNT(*) FROM users WHERE role LIKE '%admin%'
  ) <= 1 THEN
    RAISE EXCEPTION 'Não é possível excluir o último administrador do sistema';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para impedir exclusão do último administrador
DROP TRIGGER IF EXISTS prevent_last_admin_deletion_trigger ON users;
CREATE TRIGGER prevent_last_admin_deletion_trigger
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_admin_deletion();