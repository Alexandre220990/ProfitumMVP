-- =====================================================
-- VÉRIFICATION STRUCTURE TABLE EXPERT
-- =====================================================
-- Objectif : Confirmer si la table utilise "name" ou "first_name/last_name"
-- =====================================================

-- 1. STRUCTURE COMPLÈTE DE LA TABLE EXPERT
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Expert'
ORDER BY ordinal_position;

-- 2. VÉRIFIER LES COLONNES SPÉCIFIQUES
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'name') 
        THEN '✅ Colonne "name" existe'
        ELSE '❌ Colonne "name" n''existe PAS'
    END as colonne_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'first_name') 
        THEN '✅ Colonne "first_name" existe'
        ELSE '❌ Colonne "first_name" n''existe PAS'
    END as colonne_first_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'last_name') 
        THEN '✅ Colonne "last_name" existe'
        ELSE '❌ Colonne "last_name" n''existe PAS'
    END as colonne_last_name;

-- 3. EXEMPLE DE DONNÉES AVEC LES DEUX FORMATS
SELECT 
    id,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'first_name')
        THEN first_name || ' ' || last_name
        ELSE 'N/A'
    END as nom_complet_first_last,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'name')
        THEN name
        ELSE 'N/A'
    END as nom_colonne_name,
    company_name,
    email,
    specializations
FROM "Expert"
LIMIT 5;

-- 4. COMPTER LES EXPERTS ACTIFS
SELECT 
    COUNT(*) as total_experts,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as experts_actifs,
    COUNT(CASE WHEN specializations IS NOT NULL AND array_length(specializations, 1) > 0 THEN 1 END) as avec_specializations
FROM "Expert";

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
-- Si colonne "first_name/last_name" existent :
--   → Utiliser : first_name || ' ' || last_name
--
-- Si colonne "name" existe :
--   → Utiliser : name
--
-- =====================================================

