-- Script de diagnostic du problème de redirection vers l'admin
-- À exécuter pour identifier la source du problème

-- 1. Vérification des clients et leurs types d'authentification
SELECT 'DIAGNOSTIC CLIENTS ET AUTHENTIFICATION' as info;

SELECT 
    c.id,
    c.email,
    c.auth_id,
    c.company_name,
    c.created_at,
    CASE 
        WHEN c.auth_id IS NOT NULL THEN 'AUTHENTIFIÉ'
        ELSE 'NON AUTHENTIFIÉ'
    END as statut_auth
FROM "Client" c
ORDER BY c.created_at DESC;

-- 2. Vérification des sessions Supabase (si accessible)
SELECT 'VÉRIFICATION SESSIONS SUPABASE' as info;

-- Note: Cette requête nécessite les permissions appropriées sur les tables auth de Supabase
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth_sessions') THEN
        RAISE NOTICE 'Table auth_sessions accessible';
    ELSE
        RAISE NOTICE 'Table auth_sessions non accessible (normal en production)';
    END IF;
END $$;

-- 3. Vérification des tokens et authentification
SELECT 'VÉRIFICATION TOKENS ET AUTH' as info;

-- Vérifier les clients avec auth_id mais sans email
SELECT 
    'CLIENT_AUTH_SANS_EMAIL' as probleme,
    id, 
    email, 
    auth_id
FROM "Client" 
WHERE auth_id IS NOT NULL AND (email IS NULL OR email = '');

-- Vérifier les clients avec email mais sans auth_id
SELECT 
    'CLIENT_EMAIL_SANS_AUTH' as probleme,
    id, 
    email, 
    auth_id
FROM "Client" 
WHERE email IS NOT NULL AND auth_id IS NULL;

-- 4. Vérification des produits éligibles par client
SELECT 'VÉRIFICATION PRODUITS ÉLIGIBLES PAR CLIENT' as info;

SELECT 
    c.id as client_id,
    c.email as client_email,
    c.auth_id,
    COUNT(cpe.id) as nombre_produits,
    array_agg(DISTINCT cpe.statut) as statuts_produits
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
GROUP BY c.id, c.email, c.auth_id
ORDER BY nombre_produits DESC;

-- 5. Vérification des logs d'accès (si la table existe)
SELECT 'VÉRIFICATION LOGS D ACCÈS' as info;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'access_logs') THEN
        RAISE NOTICE 'Table access_logs existe - vérification des derniers accès';
    ELSE
        RAISE NOTICE 'Table access_logs n existe pas';
    END IF;
END $$;

-- 6. Diagnostic des problèmes potentiels
SELECT 'DIAGNOSTIC PROBLÈMES POTENTIELS' as info;

-- Problème 1: Clients sans auth_id
SELECT 
    'PROBLÈME_1' as type_probleme,
    'Clients sans auth_id - redirection impossible' as description,
    COUNT(*) as count
FROM "Client" 
WHERE auth_id IS NULL

UNION ALL

-- Problème 2: Clients sans produits éligibles
SELECT 
    'PROBLÈME_2' as type_probleme,
    'Clients sans produits éligibles - dashboard vide' as description,
    COUNT(*) as count
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE cpe.id IS NULL

UNION ALL

-- Problème 3: Produits éligibles orphelins
SELECT 
    'PROBLÈME_3' as type_probleme,
    'Produits éligibles orphelins - données corrompues' as description,
    COUNT(*) as count
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
WHERE c.id IS NULL;

-- 7. Recommandations de correction
SELECT 'RECOMMANDATIONS DE CORRECTION' as info;

-- Si des clients n'ont pas d'auth_id, ils doivent se reconnecter
-- Si des produits sont orphelins, ils doivent être nettoyés
-- Si des clients n'ont pas de produits, ils doivent faire une simulation

-- 8. Test de simulation pour un client
SELECT 'TEST SIMULATION POUR CLIENT' as info;

-- Prendre un client avec auth_id et vérifier ses données
SELECT 
    c.id,
    c.email,
    c.auth_id,
    COUNT(cpe.id) as produits_count,
    CASE 
        WHEN COUNT(cpe.id) > 0 THEN 'A DES PRODUITS'
        ELSE 'PAS DE PRODUITS - DOIT FAIRE SIMULATION'
    END as recommandation
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.auth_id IS NOT NULL
GROUP BY c.id, c.email, c.auth_id
ORDER BY produits_count ASC
LIMIT 5; 