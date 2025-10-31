-- =====================================================
-- DIAGNOSTIC: PRODUITS PERDUS APRÈS INSCRIPTION
-- =====================================================

-- ============================================================================
-- PROBLÈME : Les produits de la simulation anonyme ne sont pas transférés
-- ============================================================================

/*
SITUATION:
1. Utilisateur fait simulation ANONYME → 5 produits créés
2. Utilisateur s'inscrit → Nouveau client créé
3. Dashboard affiche 0 produits éligibles ❌

CAUSE:
- Les produits sont liés au CLIENT TEMPORAIRE de la simulation anonyme
- Lors de l'inscription, un NOUVEAU CLIENT est créé
- Les produits ne sont PAS transférés du client temporaire au nouveau client
*/

-- ============================================================================
-- ÉTAPE 1: VÉRIFIER LA STRUCTURE DES TABLES
-- ============================================================================

SELECT '════════════════════════════════════════════════' as sep;
SELECT '📋 STRUCTURE TABLE simulations' as titre;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'simulations'
ORDER BY ordinal_position;

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '📋 STRUCTURE TABLE ProduitEligibleClient' as titre;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ProduitEligibleClient'
ORDER BY ordinal_position;

-- ============================================================================
-- ÉTAPE 2: IDENTIFIER LES CLIENTS TEMPORAIRES
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '👤 CLIENTS TEMPORAIRES AVEC PRODUITS' as titre;

SELECT 
    c.id as client_id,
    c.email,
    c.is_temporary,
    c.created_at,
    COUNT(pec.id) as nb_produits,
    SUM(pec.montant_estime) as total_estime
FROM "Client" c
LEFT JOIN "ProduitEligibleClient" pec ON pec.client_id = c.id
WHERE c.is_temporary = true
  AND c.created_at > NOW() - INTERVAL '1 day'
GROUP BY c.id, c.email, c.is_temporary, c.created_at
HAVING COUNT(pec.id) > 0
ORDER BY c.created_at DESC
LIMIT 10;

-- ============================================================================
-- ÉTAPE 3: VÉRIFIER LES SIMULATIONS RÉCENTES
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '📊 SIMULATIONS RÉCENTES' as titre;

SELECT 
    s.id as simulation_id,
    s.session_token,
    s.client_id,
    c.email as client_email,
    c.is_temporary,
    s.status,
    s.created_at,
    jsonb_object_keys(s.answers) as answer_count,
    (SELECT COUNT(*) FROM "ProduitEligibleClient" WHERE client_id = s.client_id) as nb_produits
FROM "simulations" s
JOIN "Client" c ON c.id = s.client_id
WHERE s.created_at > NOW() - INTERVAL '1 hour'
ORDER BY s.created_at DESC
LIMIT 10;

-- ============================================================================
-- ÉTAPE 4: SOLUTION PROPOSÉE
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '💡 SOLUTION: TRANSFERT DES PRODUITS' as titre;

SELECT 'Lors de l''inscription (/api/auth/register), il faut:' as etape
UNION ALL SELECT ''
UNION ALL SELECT '1. Récupérer le session_token de la simulation anonyme'
UNION ALL SELECT '   → Passé en paramètre depuis le frontend'
UNION ALL SELECT ''
UNION ALL SELECT '2. Trouver la simulation et son client_id temporaire'
UNION ALL SELECT '   → SELECT * FROM simulations WHERE session_token = ?'
UNION ALL SELECT ''
UNION ALL SELECT '3. Transférer les produits du client temporaire → nouveau client'
UNION ALL SELECT '   → UPDATE ProduitEligibleClient'
UNION ALL SELECT '     SET client_id = nouveau_client_id'
UNION ALL SELECT '     WHERE client_id = client_temporaire_id'
UNION ALL SELECT ''
UNION ALL SELECT '4. Lier la simulation au nouveau client'
UNION ALL SELECT '   → UPDATE simulations'
UNION ALL SELECT '     SET client_id = nouveau_client_id, status = ''completed'''
UNION ALL SELECT '     WHERE session_token = ?'
UNION ALL SELECT ''
UNION ALL SELECT '5. Marquer le client temporaire comme migré'
UNION ALL SELECT '   → UPDATE Client'
UNION ALL SELECT '     SET is_temporary = false (ou le supprimer)'
UNION ALL SELECT '     WHERE id = client_temporaire_id';

-- ============================================================================
-- ÉTAPE 5: VÉRIFIER L'ERREUR CRÉATION SIMULATION AUTHENTIFIÉE
-- ============================================================================

SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '❌ ERREUR: Création simulation authentifiée' as titre;

-- Vérifier les colonnes obligatoires
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'simulations'
  AND is_nullable = 'NO'
  AND column_default IS NULL
ORDER BY ordinal_position;

SELECT '';
SELECT '💡 Colonnes NON NULL sans valeur par défaut:' as info;
SELECT 'Ces colonnes DOIVENT être fournies lors de l''INSERT' as explication;

