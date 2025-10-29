-- ============================================================================
-- ANALYSE COMPLÈTE : Toutes les tables de la base de données
-- ============================================================================

-- 1. LISTER TOUTES LES TABLES
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as nombre_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. COLONNES DE TOUTES LES TABLES IMPORTANTES
-- ClientProduitEligible
SELECT 'ClientProduitEligible' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- RDV
SELECT 'RDV' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'RDV'
ORDER BY ordinal_position;

-- Simulation
SELECT 'Simulation' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Simulation'
ORDER BY ordinal_position;

-- Document (si existe)
SELECT 'Document' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Document'
ORDER BY ordinal_position;

-- 3. RECHERCHE PATTERNS DE COLONNES
-- Chercher toutes les colonnes avec "validation", "workflow", "state", "stage"
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name ILIKE '%validation%' OR
    column_name ILIKE '%workflow%' OR
    column_name ILIKE '%state%' OR
    column_name ILIKE '%stage%' OR
    column_name ILIKE '%statut%' OR
    column_name ILIKE '%status%'
  )
ORDER BY table_name, column_name;

-- 4. RECHERCHE COLONNES METADATA/JSONB
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'jsonb'
ORDER BY table_name;

-- 5. RECHERCHE COLONNES NOTES
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name ILIKE '%note%'
ORDER BY table_name, column_name;

