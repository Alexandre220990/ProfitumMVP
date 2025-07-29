-- Script de diagnostic pour le problème de migration des ClientProduitEligible
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table ClientProduitEligible
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes de la table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'ClientProduitEligible';

-- 3. Vérifier les produits éligibles disponibles
SELECT 
    id,
    nom,
    categorie,
    active,
    created_at
FROM "ProduitEligible" 
ORDER BY nom;

-- 4. Vérifier les sessions temporaires récentes
SELECT 
    id,
    session_token,
    completed,
    migrated_to_account,
    migrated_at,
    created_at
FROM "TemporarySession" 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Vérifier les résultats d'éligibilité temporaires
SELECT 
    te.id,
    te.session_id,
    te.produit_id,
    te.eligibility_score,
    te.estimated_savings,
    te.confidence_level,
    te.created_at,
    ts.session_token,
    ts.migrated_to_account
FROM "TemporaryEligibility" te
JOIN "TemporarySession" ts ON te.session_id = ts.id
ORDER BY te.created_at DESC 
LIMIT 20;

-- 6. Vérifier les clients récents
SELECT 
    id,
    email,
    username,
    company_name,
    created_at
FROM "Client" 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Vérifier les ClientProduitEligible existants
SELECT 
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe."dureeFinale",
    cpe."simulationId",
    cpe.metadata,
    cpe.notes,
    cpe."created_at",
    c.email as client_email,
    pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
ORDER BY cpe."created_at" DESC 
LIMIT 20;

-- 8. Vérifier les politiques RLS sur ClientProduitEligible
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
WHERE tablename = 'ClientProduitEligible';

-- 9. Test d'insertion manuel avec les données minimales
-- (À décommenter pour tester)
/*
INSERT INTO "ClientProduitEligible" (
    id,
    "clientId",
    "produitId",
    statut,
    "tauxFinal",
    "montantFinal",
    "dureeFinale",
    "created_at",
    "updated_at"
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM "Client" ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM "ProduitEligible" WHERE nom = 'TICPE' LIMIT 1),
    'eligible',
    0.75,
    5000,
    12,
    NOW(),
    NOW()
) RETURNING *;
*/

-- 10. Vérifier les erreurs de contrainte potentielles
-- Test avec des données invalides pour identifier les contraintes
SELECT 
    'Test contraintes' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "ClientProduitEligible" 
            WHERE "tauxFinal" < 0 OR "tauxFinal" > 1
        ) THEN 'ERREUR: tauxFinal hors limites'
        ELSE 'OK: tauxFinal dans les limites'
    END as taux_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "ClientProduitEligible" 
            WHERE "montantFinal" < 0
        ) THEN 'ERREUR: montantFinal négatif'
        ELSE 'OK: montantFinal positif'
    END as montant_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "ClientProduitEligible" 
            WHERE "dureeFinale" <= 0
        ) THEN 'ERREUR: dureeFinale invalide'
        ELSE 'OK: dureeFinale valide'
    END as duree_check;