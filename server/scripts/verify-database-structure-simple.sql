-- Script de vérification simplifié de la structure de la base de données
-- Version sans les contraintes problématiques

-- 1. Vérification des tables principales
SELECT 'VÉRIFICATION DES TABLES PRINCIPALES' as info;

-- Table Client
SELECT 
    'Client' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN auth_id IS NOT NULL THEN 1 END) as with_auth_id,
    COUNT(CASE WHEN auth_id IS NULL THEN 1 END) as without_auth_id,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as without_email
FROM "Client";

-- Table Expert
SELECT 
    'Expert' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
    COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected
FROM "Expert";

-- Table Admin
SELECT 
    'Admin' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email
FROM "Admin";

-- 2. Vérification des problèmes d'authentification
SELECT 'VÉRIFICATION DES PROBLÈMES D AUTHENTIFICATION' as info;

-- Clients sans auth_id
SELECT 
    id, email, auth_id, created_at
FROM "Client" 
WHERE auth_id IS NULL;

-- Clients avec auth_id mais sans email
SELECT 
    id, email, auth_id, created_at
FROM "Client" 
WHERE email IS NULL;

-- Doublons d'emails dans Client
SELECT 
    email, COUNT(*) as count
FROM "Client" 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- 3. Vérification des produits éligibles
SELECT 'VÉRIFICATION DES PRODUITS ÉLIGIBLES' as info;

-- Comptage des produits éligibles par client
SELECT 
    c.id as client_id,
    c.email as client_email,
    COUNT(cpe.id) as total_produits_eligibles,
    COUNT(CASE WHEN cpe.statut = 'eligible' THEN 1 END) as produits_eligibles,
    COUNT(CASE WHEN cpe.statut = 'en_cours' THEN 1 END) as produits_en_cours,
    COUNT(CASE WHEN cpe.statut = 'termine' THEN 1 END) as produits_termines
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
GROUP BY c.id, c.email
ORDER BY total_produits_eligibles DESC;

-- Clients sans produits éligibles
SELECT 
    c.id, c.email, c.auth_id
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE cpe.id IS NULL;

-- 4. Vérification des tokens et sessions
SELECT 'VÉRIFICATION DES TOKENS ET SESSIONS' as info;

-- Vérification des sessions Supabase (si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth_sessions') THEN
        RAISE NOTICE 'Table auth_sessions existe';
    ELSE
        RAISE NOTICE 'Table auth_sessions n existe pas';
    END IF;
END $$;

-- 5. Vérification des permissions et rôles
SELECT 'VÉRIFICATION DES PERMISSIONS' as info;

-- Vérification des rôles Supabase (si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth_users') THEN
        RAISE NOTICE 'Table auth_users existe';
    ELSE
        RAISE NOTICE 'Table auth_users n existe pas';
    END IF;
END $$;

-- 6. Vérification des logs d'accès
SELECT 'VÉRIFICATION DES LOGS D ACCÈS' as info;

-- Vérification de la table access_logs (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'access_logs') THEN
        RAISE NOTICE 'Table access_logs existe';
    ELSE
        RAISE NOTICE 'Table access_logs n existe pas';
    END IF;
END $$;

-- 7. Vérification des données de test
SELECT 'VÉRIFICATION DES DONNÉES DE TEST' as info;

-- Clients de test
SELECT 
    id, email, auth_id, company_name, created_at
FROM "Client" 
WHERE email LIKE '%test%' OR email LIKE '%example%' OR company_name LIKE '%test%'
ORDER BY created_at DESC;

-- 8. Recommandations
SELECT 'RECOMMANDATIONS' as info;

-- Clients à corriger (sans auth_id)
SELECT 
    'CLIENT_SANS_AUTH_ID' as probleme,
    id, email, auth_id
FROM "Client" 
WHERE auth_id IS NULL;

-- Clients à vérifier (sans email)
SELECT 
    'CLIENT_SANS_EMAIL' as probleme,
    id, email, auth_id
FROM "Client" 
WHERE email IS NULL;

-- Experts non approuvés
SELECT 
    'EXPERT_NON_APPROUVE' as probleme,
    id, email, approval_status
FROM "Expert" 
WHERE approval_status != 'approved'; 