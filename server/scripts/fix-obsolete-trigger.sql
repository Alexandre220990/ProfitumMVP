-- =====================================================
-- SUPPRESSION DU TRIGGER OBSOLÈTE
-- Date: 2025-01-31
-- Description: Supprimer le trigger trigger_cleanup_expired_data qui référence simulations_unified
-- =====================================================

-- Supprimer le trigger s'il existe (seulement sur les tables qui existent)
DROP TRIGGER IF EXISTS trigger_cleanup_expired_data ON simulations;
DROP TRIGGER IF EXISTS trigger_cleanup_expired_data ON "Client";

-- Supprimer la fonction obsolète
DROP FUNCTION IF EXISTS trigger_cleanup_expired_data();

-- Vérifier qu'il n'y a plus de références à simulations_unified
DO $$
BEGIN
    RAISE NOTICE '=== VÉRIFICATION SUPPRESSION TRIGGER OBSOLÈTE ===';
    
    -- Vérifier qu'il n'y a plus de triggers avec ce nom
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_cleanup_expired_data'
    ) THEN
        RAISE NOTICE '✅ Trigger trigger_cleanup_expired_data supprimé';
    ELSE
        RAISE NOTICE '❌ Trigger trigger_cleanup_expired_data existe encore';
    END IF;
    
    -- Vérifier qu'il n'y a plus de fonctions avec ce nom
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'trigger_cleanup_expired_data'
    ) THEN
        RAISE NOTICE '✅ Fonction trigger_cleanup_expired_data supprimée';
    ELSE
        RAISE NOTICE '❌ Fonction trigger_cleanup_expired_data existe encore';
    END IF;
    
END $$; 