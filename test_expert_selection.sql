-- Script de test pour la sélection d'expert
-- Test étape par étape pour identifier le problème

-- 1. Vérifier la structure de ClientProduitEligible
SELECT 
    '1. STRUCTURE CLIENTPRODUITELIGIBLE' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- 2. Vérifier que le dossier existe (avec la bonne colonne)
SELECT 
    '2. DOSSIER' as test,
    id,
    "clientId",  -- Essayer avec guillemets
    statut,
    expert_id,
    created_at
FROM "ClientProduitEligible" 
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';

-- 3. Vérifier que l'expert existe et est actif
SELECT 
    '3. EXPERT' as test,
    id,
    name,
    email,
    specializations,
    status,
    created_at
FROM "Expert" 
WHERE id = 'a26a9609-a160-47a0-9698-955876c3618d';

-- 4. Vérifier les assignations existantes pour ce dossier
SELECT 
    '4. ASSIGNATIONS EXISTANTES' as test,
    id,
    expert_id,
    client_id,
    client_produit_eligible_id,
    status,  -- Corrigé: statut → status
    assignment_date,
    created_at
FROM "expertassignment" 
WHERE client_produit_eligible_id = '93374842-cca6-4873-b16e-0ada92e97004';

-- 5. Vérifier la structure de la table expertassignment
SELECT 
    '5. STRUCTURE EXPERTASSIGNMENT' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expertassignment'
ORDER BY ordinal_position;

-- 6. Test d'insertion simulée (sans réellement insérer)
SELECT 
    '6. TEST INSERTION' as test,
    'expert_id' as champ,
    'a26a9609-a160-47a0-9698-955876c3618d' as valeur,
    'uuid' as type_attendu
UNION ALL
SELECT 
    '6. TEST INSERTION' as test,
    'client_id' as champ,
    '25274ba6-67e6-4151-901c-74851fe2d82a' as valeur,
    'uuid' as type_attendu
UNION ALL
SELECT 
    '6. TEST INSERTION' as test,
    'client_produit_eligible_id' as champ,
    '93374842-cca6-4873-b16e-0ada92e97004' as valeur,
    'uuid' as type_attendu
UNION ALL
SELECT 
    '6. TEST INSERTION' as test,
    'status' as champ,  -- Corrigé: statut → status
    'pending' as valeur,
    'character varying' as type_attendu;

-- 7. Vérifier les contraintes de la table
SELECT 
    '7. CONTRAINTES' as test,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'expertassignment';

-- 8. Vérifier les triggers sur la table
SELECT 
    '8. TRIGGERS' as test,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'expertassignment';

-- 9. Vérifier les fonctions des triggers
SELECT 
    '9. FONCTIONS TRIGGERS' as test,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN (
    'update_expert_assignment_updated_at',
    'trigger_update_expert_stats'
);

-- 10. Test d'insertion réelle pour voir l'erreur exacte
-- ATTENTION: Cette requête va réellement insérer une ligne de test
INSERT INTO "expertassignment" (
    expert_id,
    client_id,
    client_produit_eligible_id,
    status,  -- Corrigé: statut → status
    assignment_date,
    notes
) VALUES (
    'a26a9609-a160-47a0-9698-955876c3618d',
    '25274ba6-67e6-4151-901c-74851fe2d82a',
    '93374842-cca6-4873-b16e-0ada92e97004',
    'pending',
    NOW(),
    'Test insertion pour debug'
) RETURNING id, expert_id, client_id, client_produit_eligible_id, status, created_at;

-- 11. Supprimer la ligne de test
DELETE FROM "expertassignment" 
WHERE expert_id = 'a26a9609-a160-47a0-9698-955876c3618d' 
AND client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
AND client_produit_eligible_id = '93374842-cca6-4873-b16e-0ada92e97004'
AND notes = 'Test insertion pour debug';
