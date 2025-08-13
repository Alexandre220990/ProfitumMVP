-- Correction de la fonction calculate_expert_stats

-- 1. Vérifier la fonction actuelle
SELECT 
    '1. FONCTION ACTUELLE' as test,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'calculate_expert_stats';

-- 2. Corriger la fonction en supprimant la référence à la table Audit
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
    
    -- Mettre à jour les gains totaux (sans référence à la table Audit)
    UPDATE "Expert" 
    SET total_earnings = (
        SELECT COALESCE(SUM(compensation_amount), 0)
        FROM "expertassignment" 
        WHERE "expertassignment"."expert_id" = expert_uuid 
        AND "expertassignment"."compensation_status" = 'paid'
    )
    WHERE "Expert".id = expert_uuid;
    
    -- Mettre à jour les gains mensuels (calcul basé sur les 30 derniers jours)
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

-- 4. Test d'insertion pour vérifier que tout fonctionne
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
    'Test après correction calculate_expert_stats'
) RETURNING id, expert_id, client_id, client_produit_eligible_id, status, created_at;

-- 5. Vérifier les stats de l'expert après l'insertion
SELECT 
    '5. STATS EXPERT APRÈS INSERTION' as test,
    id,
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings
FROM "Expert" 
WHERE id = 'a26a9609-a160-47a0-9698-955876c3618d';

-- 6. Nettoyer le test
DELETE FROM "expertassignment" 
WHERE expert_id = 'a26a9609-a160-47a0-9698-955876c3618d' 
AND client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
AND client_produit_eligible_id = '93374842-cca6-4873-b16e-0ada92e97004'
AND notes = 'Test après correction calculate_expert_stats';
