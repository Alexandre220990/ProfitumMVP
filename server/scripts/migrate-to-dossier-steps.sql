-- ===== SCRIPT DE MIGRATION VERS LE SYSTÈME DOSSIERSTEP =====
-- Date: 2025-01-28
-- Description: Migration des données existantes vers le nouveau système DossierStep

-- 1. Vérifier que la table DossierStep existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DossierStep') THEN
        RAISE EXCEPTION 'La table DossierStep n''existe pas. Exécutez d''abord la migration 20250128_create_calendar_system.sql';
    END IF;
END $$;

-- 2. Nettoyer les étapes existantes (optionnel - commenté pour sécurité)
-- DELETE FROM "DossierStep";

-- 3. Générer automatiquement les étapes pour tous les ClientProduitEligible éligibles
-- Cette partie sera exécutée via l'API /api/dossier-steps/generate-all

-- 4. Mettre à jour les colonnes current_step et progress dans ClientProduitEligible
-- basé sur les étapes DossierStep générées

-- Fonction pour calculer le progress basé sur les étapes DossierStep
CREATE OR REPLACE FUNCTION update_dossier_progress_from_steps()
RETURNS void AS $$
DECLARE
    dossier_record RECORD;
    total_steps INTEGER;
    completed_steps INTEGER;
    current_step_num INTEGER;
    progress_percent INTEGER;
BEGIN
    -- Parcourir tous les ClientProduitEligible
    FOR dossier_record IN 
        SELECT cpe.id, cpe."clientId", cpe."produitId"
        FROM "ClientProduitEligible" cpe
        WHERE cpe.statut IN ('eligible', 'en_cours', 'termine')
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
        
        -- Compter les étapes en cours
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
        UPDATE "ClientProduitEligible"
        SET 
            current_step = current_step_num,
            progress = progress_percent,
            updated_at = NOW()
        WHERE id = dossier_record.id;
        
        RAISE NOTICE 'Dossier %: % étapes, % complétées, étape actuelle %, progress %%%', 
            dossier_record.id, total_steps, completed_steps, current_step_num, progress_percent;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Exécuter la fonction de mise à jour
SELECT update_dossier_progress_from_steps();

-- 6. Créer un trigger pour maintenir la cohérence automatiquement
CREATE OR REPLACE FUNCTION trigger_update_dossier_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le progress du dossier parent quand une étape change
    PERFORM update_dossier_progress_from_steps();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS update_dossier_progress_trigger ON "DossierStep";

-- Créer le trigger
CREATE TRIGGER update_dossier_progress_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "DossierStep"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_dossier_progress();

-- 7. Statistiques de migration
SELECT 
    'Statistiques de migration' as info,
    COUNT(*) as total_dossiers,
    COUNT(CASE WHEN progress > 0 THEN 1 END) as dossiers_avec_progress,
    AVG(progress) as progress_moyen,
    COUNT(CASE WHEN current_step > 0 THEN 1 END) as dossiers_avec_etapes
FROM "ClientProduitEligible"
WHERE statut IN ('eligible', 'en_cours', 'termine');

-- 8. Vérification de la cohérence
SELECT 
    'Vérification cohérence' as info,
    COUNT(*) as total_etapes,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as etapes_completees,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as etapes_en_cours,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as etapes_en_attente,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as etapes_en_retard
FROM "DossierStep";

-- 9. Nettoyage des fonctions temporaires
-- DROP FUNCTION IF EXISTS update_dossier_progress_from_steps();
-- DROP FUNCTION IF EXISTS trigger_update_dossier_progress();

RAISE NOTICE 'Migration vers DossierStep terminée avec succès!'; 