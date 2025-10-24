-- ============================================================================
-- ÉTAPE 1 : TROUVER LA VRAIE TABLE DE CONVERSATIONS
-- ============================================================================

-- 1. Lister TOUTES les tables avec "conversation" dans le nom (majuscule ou minuscule)
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND LOWER(table_name) LIKE '%conversation%'
ORDER BY table_name;

-- 2. Lister TOUTES les tables avec "message" dans le nom
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND LOWER(table_name) LIKE '%message%'
ORDER BY table_name;

-- 3. Lister les 20 premières tables de votre schéma
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name
LIMIT 30;

