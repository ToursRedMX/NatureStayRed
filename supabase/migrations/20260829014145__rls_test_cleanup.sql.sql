-- Eliminar funciones helper temporales de RLS testing
DROP FUNCTION IF EXISTS nature_stay._rls_try_count(text);
DROP FUNCTION IF EXISTS nature_stay._rls_set_identity(uuid, text);
DROP FUNCTION IF EXISTS nature_stay._rls_test_as_user(uuid, text);
DROP FUNCTION IF EXISTS nature_stay._rls_test_count(text);