-- Correction de la fonction calculate_expert_stats - Version 2

-- 1. Vérifier la fonction actuelle
SELECT 
    '1. FONCTION ACTUELLE' as test,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'calculate_expert_stats';

-- 2. Corriger la fonction (version propre)
CREATE OR REPLACE FUNCTION calculate_expert_stats(expert_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Mettre à jour le nombre total d'assignations
    UPDATE "Expert" 
    SET total_assignments = (
        SELECT COUNT(*) 
        FROM "expertassignment" 
        WHERE "expertassignment"."expert_id" = expert_uuid
    )
    WHERE "Expert".id = expert_uuid;
    
    -- Mettre à jour le nombre d'assignations complétées
    UPDATE "Expert" 
    SET completed_assignments = (
        SELECT COUNT(*) 
        FROM "expertassignment" 
        WHERE "expertassignment"."expert_id" = expert_uuid 
        AND "expertassignment"."status" = 'completed'
    )
    WHERE "Expert".id = expert_uuid;
    
    -- Mettre à jour les gains totaux (basé sur expertassignment)
    UPDATE "Expert" 
    SET total_earnings = (
        SELECT COALESCE(SUM(compensation_amount), 0)
        FROM "expertassignment" 
        WHERE "expertassignment"."expert_id" = expert_uuid 
        AND "expertassignment"."compensation_status" = 'paid'
    )
    WHERE "Expert".id = expert_uuid;
    
    -- Mettre à jour les gains mensuels
    UPDATE "Expert" 
    SET monthly_earnings = (
        SELECT COALESCE(SUM(compensation_amount), 0)
        FROM "expertassignment" 
        WHERE "expertassignment"."expert_id" = expert_uuid 
        AND "expertassignment"."compensation_status" = 'paid'
        AND "expertassignment"."payment_date" >= NOW() - INTERVAL '30 days'
    )
    WHERE "Expert".id = expert_uuid;
END;
$$ LANGUAGE plpgsql;

-- 3. Vérifier la fonction corrigée
SELECT 
    '3. FONCTION CORRIGÉE' as test,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'calculate_expert_stats';

-- 4. Test d'insertion
INSERT INTO "expertassignment" (
    expert_id,
    client_id,
    client_produit_eligible_id,
    status,
    assignment_date,
    notes
) VALUES (
    'a26a9609-a160-47a0-9698-955876c3618d',
    '25274ba6-67e6-4151-901c-74851fe2d82a',
    '93374842-cca6-4873-b16e-0ada92e97004',
    'pending',
    NOW(),
    'Test après correction V2'
) RETURNING id, expert_id, client_id, client_produit_eligible_id, status, created_at;

-- 5. Vérifier les stats
SELECT 
    '5. STATS EXPERT' as test,
    id,
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings
FROM "Expert" 
WHERE id = 'a26a9609-a160-47a0-9698-955876c3618d';

-- 6. Nettoyer
DELETE FROM "expertassignment" 
WHERE expert_id = 'a26a9609-a160-47a0-9698-955876c3618d' 
AND client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
AND client_produit_eligible_id = '93374842-cca6-4873-b16e-0ada92e97004'
AND notes = 'Test après correction V2';
