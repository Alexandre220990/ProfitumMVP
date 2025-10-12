-- ============================================================================
-- SCRIPT DE VÉRIFICATION - TABLES DOCUMENTS EXISTANTES
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- 1. Lister toutes les tables liées aux documents
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name 
     AND table_schema = 'public') as nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%document%' 
    OR table_name ILIKE '%ged%'
    OR table_name ILIKE '%file%'
  )
ORDER BY table_name;

-- 2. Détail des colonnes pour chaque table document
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%document%' 
    OR table_name ILIKE '%ged%'
  )
ORDER BY table_name, ordinal_position;

-- 3. Compter les documents par table
DO $$
DECLARE
  table_record RECORD;
  count_query TEXT;
  doc_count INTEGER;
BEGIN
  FOR table_record IN 
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name ILIKE '%document%' OR table_name ILIKE '%ged%')
  LOOP
    count_query := format('SELECT COUNT(*) FROM %I', table_record.table_name);
    EXECUTE count_query INTO doc_count;
    RAISE NOTICE 'Table: % → % lignes', table_record.table_name, doc_count;
  END LOOP;
END $$;

-- 4. Vérifier les buckets Supabase Storage
SELECT 
  name as bucket_name,
  public,
  created_at
FROM storage.buckets
ORDER BY name;

-- 5. Compter les fichiers par bucket
SELECT 
  bucket_id,
  COUNT(*) as nb_fichiers,
  SUM((metadata->>'size')::bigint) / 1024 / 1024 as taille_totale_mb
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- 6. Vérifier les relations (foreign keys)
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    tc.table_name ILIKE '%document%' 
    OR tc.table_name ILIKE '%ged%'
  )
ORDER BY tc.table_name, kcu.column_name;

-- 7. Exemple de données (5 derniers documents de chaque table)
-- GEDDocument
SELECT 
  id,
  title,
  category,
  created_at,
  'GEDDocument' as source_table
FROM "GEDDocument"
ORDER BY created_at DESC
LIMIT 5;

-- ClientDocument (si existe)
SELECT 
  id,
  filename,
  document_type,
  client_id,
  created_at,
  'ClientDocument' as source_table
FROM "ClientDocument"
ORDER BY created_at DESC
LIMIT 5;

-- 8. Vérifier les permissions/RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    tablename ILIKE '%document%'
    OR tablename ILIKE '%ged%'
  )
ORDER BY tablename, policyname;

