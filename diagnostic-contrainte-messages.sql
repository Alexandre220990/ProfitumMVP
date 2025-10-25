-- ============================================================================
-- DIAGNOSTIC : Contrainte CHECK sur table messages
-- ============================================================================
-- Date : 25 octobre 2025
-- Objectif : Identifier et corriger la contrainte qui bloque les apporteurs
-- ============================================================================

\echo '========================================';
\echo '🔍 CONTRAINTES TABLE MESSAGES';
\echo '========================================';

-- Lister toutes les contraintes CHECK
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'messages'::regclass
ORDER BY conname;

\echo '';
\echo '========================================';
\echo '📋 STRUCTURE COLONNE sender_type';
\echo '========================================';

SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'messages' 
  AND column_name = 'sender_type';

\echo '';
\echo '========================================';
\echo '✅ DIAGNOSTIC TERMINÉ';
\echo '========================================';

