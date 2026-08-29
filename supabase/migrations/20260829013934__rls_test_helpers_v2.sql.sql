-- Reemplazar la funcion helper con SECURITY INVOKER
DROP FUNCTION IF EXISTS nature_stay._rls_test_count(text);

-- Funcion que intenta contar filas de una tabla como el rol actual (INVOKER)
-- Si no tiene permisos, atrapa el error
CREATE OR REPLACE FUNCTION nature_stay._rls_try_count(p_table_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = nature_stay, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM nature_stay.%I', p_table_name) INTO v_count;
  RETURN v_count::text;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN 'PERMISSION_DENIED';
END;
$$;

-- Funcion para simular auth.uid() estableciendo JWT claims
-- Esto funciona porque auth.uid() lee request.jwt.claims.sub
CREATE OR REPLACE FUNCTION nature_stay._rls_set_identity(p_user_id uuid, p_role text DEFAULT 'authenticated')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_temp
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', p_user_id::text,
    'role', p_role
  )::text, true);
END;
$$;