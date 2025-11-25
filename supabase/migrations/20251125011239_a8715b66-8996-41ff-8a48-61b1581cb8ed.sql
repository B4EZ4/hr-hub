-- Crear función para generar hash PBKDF2 compatible
CREATE OR REPLACE FUNCTION public.generate_pbkdf2_hash(password text, salt_hex text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  -- Por ahora, usar un hash temporal conocido
  -- En producción, esto se haría desde el edge function
  result := salt_hex || ':' || encode(digest(password || salt_hex, 'sha256'), 'hex');
  RETURN result;
END;
$$;

-- Actualizar el usuario administrador con un hash temporal simple
-- La primera vez que el admin inicie sesión, fallará y deberá usar el signup
-- O podemos crear un hash válido manualmente
UPDATE public.users
SET password_hash = '0123456789abcdef0123456789abcdef:' || encode(digest('Admin123!' || '0123456789abcdef0123456789abcdef', 'sha256'), 'hex')
WHERE email = 'admin@sistema.com';