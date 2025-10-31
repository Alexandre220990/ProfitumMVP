-- =====================================================
-- VÉRIFIER TOUTES LES COLONNES NOT NULL DE CLIENT
-- =====================================================

-- Lister toutes les colonnes avec contrainte NOT NULL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN is_nullable = 'NO' AND column_default IS NULL THEN '❌ NOT NULL sans défaut'
        WHEN is_nullable = 'NO' THEN '⚠️ NOT NULL avec défaut'
        ELSE '✅ Nullable'
    END as statut
FROM information_schema.columns
WHERE table_name = 'Client'
ORDER BY 
    CASE WHEN is_nullable = 'NO' THEN 1 ELSE 2 END,
    ordinal_position;

-- Lister uniquement les colonnes problématiques (NOT NULL sans défaut)
SELECT 
    '═══ COLONNES OBLIGATOIRES SANS DÉFAUT ═══' as titre;

SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'Client'
  AND is_nullable = 'NO'
  AND column_default IS NULL
ORDER BY ordinal_position;

