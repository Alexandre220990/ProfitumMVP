-- ============================================================================
-- ANALYSE DES RÈGLES DE SUPPRESSION - BASE DE DONNÉES FINANCIALTRACKER
-- ============================================================================
-- Date : 15 janvier 2025
-- Objectif : Analyser les règles de suppression actuelles avant correction

-- ============================================================================
-- REQUÊTE 1 : ANALYSE DÉTAILLÉE DES RÈGLES DE SUPPRESSION
-- ============================================================================
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule,
    tc.constraint_name,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ Suppression en cascade - OK'
        WHEN rc.delete_rule = 'SET NULL' THEN '⚠️ Mise à NULL - À vérifier'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ Pas d''action - Problématique'
        WHEN rc.delete_rule = 'RESTRICT' THEN '🛑 Restriction - À analyser'
        ELSE '❓ Règle inconnue - À vérifier'
    END AS delete_rule_analysis
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- REQUÊTE 2 : ANALYSE PAR TYPE DE RÈGLE
-- ============================================================================
SELECT 
    rc.delete_rule,
    COUNT(*) as nombre_contraintes,
    STRING_AGG(tc.table_name || '.' || kcu.column_name, ', ') as contraintes
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
GROUP BY rc.delete_rule
ORDER BY rc.delete_rule;

-- ============================================================================
-- REQUÊTE 3 : ANALYSE DES RÈGLES PROBLÉMATIQUES
-- ============================================================================
-- Contraintes avec SET NULL qui devraient être CASCADE
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    'SET NULL -> CASCADE' AS recommandation,
    'Cette relation devrait être supprimée en cascade' AS raison
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND rc.delete_rule = 'SET NULL'
    AND tc.table_name IN ('ClientProduitEligible', 'DossierStep', 'expertassignment')
ORDER BY tc.table_name, kcu.column_name;

-- Contraintes avec NO ACTION qui devraient être SET NULL
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    'NO ACTION -> SET NULL' AS recommandation,
    'Cette relation devrait être mise à NULL si la référence est supprimée' AS raison
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND rc.delete_rule = 'NO ACTION'
    AND tc.table_name IN ('GEDDocument', 'CalendarEvent', 'Reminder')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- REQUÊTE 4 : ANALYSE DES IMPACTS POTENTIELS
-- ============================================================================
-- Vérifier les données existantes pour évaluer l'impact
SELECT 
    'ClientProduitEligible' as table_name,
    COUNT(*) as total_lignes,
    COUNT("clientId") as lignes_avec_client,
    COUNT("produitId") as lignes_avec_produit
FROM "ClientProduitEligible";

SELECT 
    'DossierStep' as table_name,
    COUNT(*) as total_lignes,
    COUNT(dossier_id) as lignes_avec_dossier,
    COUNT(assignee_id) as lignes_avec_assignee
FROM "DossierStep";

SELECT 
    'GEDDocument' as table_name,
    COUNT(*) as total_lignes,
    COUNT(created_by) as lignes_avec_created_by
FROM "GEDDocument";

-- ============================================================================
-- REQUÊTE 5 : RECOMMANDATIONS DE CORRECTION
-- ============================================================================
-- Générer les commandes ALTER TABLE recommandées
SELECT 
    'ALTER TABLE "' || tc.table_name || '" DROP CONSTRAINT IF EXISTS "' || tc.constraint_name || '";' as drop_command,
    'ALTER TABLE "' || tc.table_name || '" ADD CONSTRAINT "' || tc.constraint_name || '" FOREIGN KEY ("' || kcu.column_name || '") REFERENCES "' || ccu.table_name || '"("' || ccu.column_name || '") ON DELETE CASCADE;' as add_command_cascade,
    'ALTER TABLE "' || tc.table_name || '" ADD CONSTRAINT "' || tc.constraint_name || '" FOREIGN KEY ("' || kcu.column_name || '") REFERENCES "' || ccu.table_name || '"("' || ccu.column_name || '") ON DELETE SET NULL;' as add_command_setnull
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (
        (rc.delete_rule = 'SET NULL' AND tc.table_name IN ('ClientProduitEligible', 'DossierStep', 'expertassignment'))
        OR 
        (rc.delete_rule = 'NO ACTION' AND tc.table_name IN ('GEDDocument', 'CalendarEvent', 'Reminder'))
    )
ORDER BY tc.table_name, kcu.column_name;
