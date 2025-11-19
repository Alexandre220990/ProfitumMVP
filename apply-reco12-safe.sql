-- ============================================================================
-- APPLICATION SÛRE DE LA RECOMMANDATION 12
-- Correction de la fonction update_dossier_progress_from_steps()
-- ============================================================================
-- 
-- IMPACT : ✅ AUCUN IMPACT NÉGATIF
-- - La fonction calcule uniquement progress et current_step
-- - Elle ne modifie JAMAIS le statut du dossier
-- - Compatible avec tous les workflows (docs complémentaires, retours en arrière, etc.)
--
-- BÉNÉFICES :
-- - Tous les dossiers seront synchronisés automatiquement
-- - Le progress sera calculé pour tous les statuts (pas seulement eligible/en_cours/termine)
-- - Prévention du problème pour les futurs dossiers
-- ============================================================================

-- 1. VÉRIFICATION DE L'ÉTAT ACTUEL
SELECT 
    'État actuel' as etat,
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%EXISTS (SELECT 1 FROM "DossierStep"%' 
             AND routine_definition NOT LIKE '%statut IN (%'
        THEN '✅ DÉJÀ CORRIGÉE (pas de filtre par statut)'
        WHEN routine_definition LIKE '%statut IN (%' 
             AND routine_definition LIKE '%eligible%en_cours%termine%'
        THEN '⚠️ ANCIENNE VERSION (filtre par statut - à corriger)'
        ELSE '❓ VERSION INCONNUE'
    END as statut,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_dossier_progress_from_steps';

-- 2. CRÉATION/REMPLACEMENT DE LA FONCTION CORRIGÉE
-- ⚠️ NOTE : Si la fonction est déjà corrigée, cette commande ne changera rien
--    mais elle garantit que la version correcte est en place
CREATE OR REPLACE FUNCTION update_dossier_progress_from_steps()
RETURNS void AS $$
DECLARE
    dossier_record RECORD;
    total_steps INTEGER;
    completed_steps INTEGER;
    current_step_num INTEGER;
    progress_percent INTEGER;
BEGIN
    -- Parcourir tous les ClientProduitEligible qui ont des DossierStep
    -- ⚠️ IMPORTANT : On ne filtre plus par statut, on traite TOUS les dossiers
    FOR dossier_record IN 
        SELECT cpe.id, cpe."clientId", cpe."produitId", cpe.statut
        FROM "ClientProduitEligible" cpe
        WHERE EXISTS (
            SELECT 1 FROM "DossierStep" WHERE dossier_id = cpe.id
        )
    LOOP
        -- Compter le total des étapes pour ce dossier
        SELECT COUNT(*) INTO total_steps
        FROM "DossierStep"
        WHERE dossier_id = dossier_record.id;
        
        -- Compter les étapes complétées
        SELECT COUNT(*) INTO completed_steps
        FROM "DossierStep"
        WHERE dossier_id = dossier_record.id 
        AND status = 'completed';
        
        -- Compter les étapes en cours ou complétées (pour current_step)
        SELECT COUNT(*) INTO current_step_num
        FROM "DossierStep"
        WHERE dossier_id = dossier_record.id 
        AND status IN ('in_progress', 'completed');
        
        -- Calculer le pourcentage de progression
        IF total_steps > 0 THEN
            progress_percent := ROUND((completed_steps::DECIMAL / total_steps::DECIMAL) * 100);
        ELSE
            progress_percent := 0;
        END IF;
        
        -- Mettre à jour ClientProduitEligible
        -- ⚠️ IMPORTANT : On met à jour UNIQUEMENT current_step et progress
        -- On ne touche JAMAIS au statut
        UPDATE "ClientProduitEligible"
        SET 
            current_step = current_step_num,
            progress = progress_percent,
            updated_at = NOW()
        WHERE id = dossier_record.id;
        
        -- Log pour debug (optionnel, peut être commenté en production)
        -- RAISE NOTICE 'Dossier % (statut: %): % étapes, % complétées, étape actuelle %, progress %%', 
        --     dossier_record.id, dossier_record.statut, total_steps, completed_steps, current_step_num, progress_percent;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. VÉRIFICATION FINALE
SELECT 
    'Vérification finale' as etat,
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%EXISTS (SELECT 1 FROM "DossierStep"%' 
             AND routine_definition NOT LIKE '%statut IN (%'
        THEN '✅ FONCTION CORRIGÉE (tous les statuts traités)'
        WHEN routine_definition LIKE '%statut IN (%' THEN '⚠️ ANCIENNE VERSION (filtre par statut)'
        ELSE '❓ VERSION INCONNUE'
    END as statut
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_dossier_progress_from_steps';

-- 4. TEST : Exécuter la fonction sur tous les dossiers
-- ⚠️ Cette commande mettra à jour le progress de TOUS les dossiers ayant des étapes
-- C'est exactement ce qu'on veut pour corriger le problème globalement
SELECT update_dossier_progress_from_steps();

-- 5. VÉRIFICATION : Compter les dossiers mis à jour
SELECT 
    'Résultat' as type,
    COUNT(*) as total_dossiers_avec_etapes,
    COUNT(*) FILTER (WHERE current_step IS NOT NULL) as dossiers_avec_current_step,
    COUNT(*) FILTER (WHERE progress IS NOT NULL) as dossiers_avec_progress,
    ROUND(AVG(progress), 2) as progress_moyen,
    ROUND(AVG(current_step), 2) as current_step_moyen
FROM "ClientProduitEligible" cpe
WHERE EXISTS (
    SELECT 1 FROM "DossierStep" WHERE dossier_id = cpe.id
);

-- 6. VÉRIFICATION SPÉCIFIQUE : Dossiers en expert_assigned
SELECT 
    'Dossiers expert_assigned' as type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE current_step IS NOT NULL) as avec_current_step,
    COUNT(*) FILTER (WHERE progress IS NOT NULL) as avec_progress,
    ROUND(AVG(progress), 2) as progress_moyen
FROM "ClientProduitEligible" cpe
WHERE cpe.statut = 'expert_assigned'
  AND EXISTS (
    SELECT 1 FROM "DossierStep" WHERE dossier_id = cpe.id
  );

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- ✅ Cette fonction est appelée automatiquement par le trigger :
--    trigger_update_dossier_progress (sur INSERT/UPDATE/DELETE de DossierStep)
--
-- ✅ Compatible avec tous les workflows :
--    - Expert demande docs complémentaires → progress recalculé correctement
--    - Retour à l'étape 3 → current_step mis à jour automatiquement
--    - Nouveaux dossiers → progress calculé dès la création des étapes
--
-- ✅ Ne modifie JAMAIS :
--    - Le statut du dossier (géré par les routes API)
--    - Les permissions
--    - Les validations métier
--
-- ✅ Améliore :
--    - La cohérence des données
--    - La synchronisation automatique
--    - La prévention des problèmes futurs
-- ============================================================================

