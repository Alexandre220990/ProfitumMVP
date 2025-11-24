-- ============================================================================
-- VÉRIFICATION COMPLÈTE DES TABLES POUR LE FORMULAIRE EXPERT ADMIN
-- ============================================================================
-- Date: 2025-01-27
-- Objectif: Vérifier toutes les tables et colonnes nécessaires pour 
--           implémenter le formulaire expert admin aligné avec welcome-expert
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION TABLE EXPERT
-- ============================================================================

-- 1.1 Structure complète de la table Expert
SELECT 
    'EXPERT TABLE STRUCTURE' as verification,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Expert'
ORDER BY ordinal_position;

-- 1.2 Vérification des colonnes critiques pour le formulaire
SELECT 
    'EXPERT COLUMNS CHECK' as verification,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'first_name') 
        THEN '✅ first_name existe'
        ELSE '❌ first_name MANQUANT'
    END as first_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'last_name') 
        THEN '✅ last_name existe'
        ELSE '❌ last_name MANQUANT'
    END as last_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'name') 
        THEN '✅ name existe (legacy)'
        ELSE '❌ name n''existe pas'
    END as name_legacy,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'email') 
        THEN '✅ email existe'
        ELSE '❌ email MANQUANT'
    END as email,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'password') 
        THEN '✅ password existe'
        ELSE '❌ password MANQUANT'
    END as password,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'phone') 
        THEN '✅ phone existe'
        ELSE '❌ phone MANQUANT'
    END as phone,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'location') 
        THEN '✅ location existe'
        ELSE '❌ location MANQUANT'
    END as location,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'city') 
        THEN '✅ city existe'
        ELSE '⚠️ city n''existe pas (utiliser location)'
    END as city,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'company_name') 
        THEN '✅ company_name existe'
        ELSE '❌ company_name MANQUANT'
    END as company_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'siren') 
        THEN '✅ siren existe'
        ELSE '❌ siren MANQUANT'
    END as siren,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'website') 
        THEN '✅ website existe'
        ELSE '❌ website MANQUANT'
    END as website,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'linkedin') 
        THEN '✅ linkedin existe'
        ELSE '❌ linkedin MANQUANT'
    END as linkedin,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'cabinet_role') 
        THEN '✅ cabinet_role existe'
        ELSE '⚠️ cabinet_role n''existe pas (peut être géré via CabinetMember)'
    END as cabinet_role,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'secteur_activite') 
        THEN '✅ secteur_activite existe'
        ELSE '❌ secteur_activite MANQUANT (nécessaire pour welcome-expert)'
    END as secteur_activite,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'experience') 
        THEN '✅ experience existe'
        ELSE '❌ experience MANQUANT'
    END as experience,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'description') 
        THEN '✅ description existe'
        ELSE '❌ description MANQUANT'
    END as description,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'languages') 
        THEN '✅ languages existe'
        ELSE '❌ languages MANQUANT'
    END as languages,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'certifications') 
        THEN '✅ certifications existe'
        ELSE '❌ certifications MANQUANT'
    END as certifications,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'rating') 
        THEN '✅ rating existe'
        ELSE '❌ rating MANQUANT'
    END as rating,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'compensation') 
        THEN '✅ compensation existe'
        ELSE '⚠️ compensation n''existe pas (peut être client_fee_percentage)'
    END as compensation,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'client_fee_percentage') 
        THEN '✅ client_fee_percentage existe'
        ELSE '⚠️ client_fee_percentage n''existe pas'
    END as client_fee_percentage,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'hourly_rate') 
        THEN '✅ hourly_rate existe'
        ELSE '❌ hourly_rate MANQUANT'
    END as hourly_rate,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'max_clients') 
        THEN '✅ max_clients existe'
        ELSE '❌ max_clients MANQUANT'
    END as max_clients,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'availability') 
        THEN '✅ availability existe'
        ELSE '❌ availability MANQUANT'
    END as availability,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'status') 
        THEN '✅ status existe'
        ELSE '❌ status MANQUANT'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'approval_status') 
        THEN '✅ approval_status existe'
        ELSE '❌ approval_status MANQUANT'
    END as approval_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'abonnement') 
        THEN '✅ abonnement existe'
        ELSE '❌ abonnement MANQUANT'
    END as abonnement,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'autre_produit') 
        THEN '✅ autre_produit existe'
        ELSE '❌ autre_produit MANQUANT'
    END as autre_produit;

-- ============================================================================
-- 2. VÉRIFICATION TABLE PRODUITELIGIBLE
-- ============================================================================

-- 2.1 Structure de ProduitEligible
SELECT 
    'PRODUITELIGIBLE TABLE STRUCTURE' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- 2.2 Vérification colonne categorie
SELECT 
    'PRODUITELIGIBLE CATEGORIE CHECK' as verification,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ProduitEligible' AND column_name = 'categorie') 
        THEN '✅ categorie existe'
        ELSE '❌ categorie MANQUANT (nécessaire pour affichage par catégories)'
    END as categorie,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ProduitEligible' AND column_name = 'nom') 
        THEN '✅ nom existe'
        ELSE '❌ nom MANQUANT'
    END as nom,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ProduitEligible' AND column_name = 'description') 
        THEN '✅ description existe'
        ELSE '⚠️ description n''existe pas'
    END as description;

-- 2.3 Vérifier les catégories existantes
SELECT 
    'PRODUITELIGIBLE CATEGORIES' as verification,
    "categorie",
    COUNT(*) as nombre_produits,
    STRING_AGG("nom", ', ' ORDER BY "nom") as produits
FROM "ProduitEligible"
WHERE "categorie" IS NOT NULL
GROUP BY "categorie"
ORDER BY "categorie";

-- ============================================================================
-- 3. VÉRIFICATION TABLE EXPERTPRODUITELIGIBLE
-- ============================================================================

-- 3.1 Structure de ExpertProduitEligible
SELECT 
    'EXPERTPRODUITELIGIBLE TABLE STRUCTURE' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ExpertProduitEligible'
ORDER BY ordinal_position;

-- 3.2 Vérification des colonnes critiques
SELECT 
    'EXPERTPRODUITELIGIBLE COLUMNS CHECK' as verification,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ExpertProduitEligible' AND column_name = 'expert_id') 
        THEN '✅ expert_id existe'
        ELSE '❌ expert_id MANQUANT'
    END as expert_id,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ExpertProduitEligible' AND column_name = 'expertId') 
        THEN '✅ expertId existe (camelCase)'
        ELSE '⚠️ expertId n''existe pas'
    END as expertId,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ExpertProduitEligible' AND column_name = 'produit_id') 
        THEN '✅ produit_id existe'
        ELSE '❌ produit_id MANQUANT'
    END as produit_id,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ExpertProduitEligible' AND column_name = 'produitId') 
        THEN '✅ produitId existe (camelCase)'
        ELSE '⚠️ produitId n''existe pas'
    END as produitId;

-- ============================================================================
-- 4. VÉRIFICATION TABLE CABINETMEMBER (pour cabinet_role)
-- ============================================================================

SELECT 
    'CABINETMEMBER CHECK' as verification,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CabinetMember') 
        THEN '✅ CabinetMember existe'
        ELSE '⚠️ CabinetMember n''existe pas (cabinet_role peut être NULL dans Expert)'
    END as table_exists;

-- Si CabinetMember existe, vérifier sa structure
SELECT 
    'CABINETMEMBER STRUCTURE' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'CabinetMember'
ORDER BY ordinal_position;

-- ============================================================================
-- 5. RÉSUMÉ DES COLONNES MANQUANTES
-- ============================================================================

SELECT 
    'RESUME MANQUANT' as verification,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'first_name') 
        THEN '❌ Expert.first_name MANQUANT - Nécessite migration name → first_name/last_name'
        ELSE NULL
    END as first_name_missing,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'last_name') 
        THEN '❌ Expert.last_name MANQUANT - Nécessite migration name → first_name/last_name'
        ELSE NULL
    END as last_name_missing,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'secteur_activite') 
        THEN '❌ Expert.secteur_activite MANQUANT - Nécessaire pour alignement avec welcome-expert'
        ELSE NULL
    END as secteur_activite_missing,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'autre_produit') 
        THEN '❌ Expert.autre_produit MANQUANT - Nécessaire pour option "Autre"'
        ELSE NULL
    END as autre_produit_missing,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ProduitEligible' AND column_name = 'categorie') 
        THEN '❌ ProduitEligible.categorie MANQUANT - Nécessaire pour affichage par catégories'
        ELSE NULL
    END as categorie_missing;

-- ============================================================================
-- 6. VÉRIFICATION DES TYPES DE DONNÉES
-- ============================================================================

SELECT 
    'EXPERT DATA TYPES' as verification,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'ARRAY' THEN udt_name
        ELSE data_type
    END as full_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Expert'
  AND column_name IN (
    'languages', 
    'certifications', 
    'secteur_activite',
    'specializations'
  )
ORDER BY column_name;

-- ============================================================================
-- 7. VÉRIFICATION DES CONTRAINTES ET INDEX
-- ============================================================================

-- Vérifier les clés étrangères
SELECT 
    'FOREIGN KEYS' as verification,
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
  AND tc.table_name IN ('ExpertProduitEligible', 'Expert')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 8. EXEMPLE DE DONNÉES POUR VALIDATION
-- ============================================================================

-- Exemple d'expert avec toutes les colonnes
SELECT 
    'EXEMPLE EXPERT' as verification,
    id,
    COALESCE(first_name, SPLIT_PART(name, ' ', 1)) as first_name,
    COALESCE(last_name, SUBSTRING(name FROM POSITION(' ' IN name) + 1)) as last_name,
    email,
    company_name,
    siren,
    phone,
    location,
    website,
    linkedin,
    experience,
    description,
    languages,
    certifications,
    rating,
    client_fee_percentage,
    hourly_rate,
    max_clients,
    availability,
    status,
    approval_status,
    abonnement,
    autre_produit,
    secteur_activite
FROM "Expert"
LIMIT 1;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

