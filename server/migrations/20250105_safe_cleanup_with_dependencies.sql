-- ============================================================================
-- NETTOYAGE SÉCURISÉ AVEC GESTION DES DÉPENDANCES
-- ============================================================================

-- ATTENTION : Ce script gère les dépendances avant suppression
-- Exécuter avec précaution !

-- 1. Vérification préalable des dépendances
DO $$
DECLARE
    audit_count INTEGER;
    dossier_count INTEGER;
    appointment_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Compter les enregistrements
    SELECT COUNT(*) INTO audit_count FROM "Audit";
    SELECT COUNT(*) INTO dossier_count FROM "Dossier";
    SELECT COUNT(*) INTO appointment_count FROM "Appointment" WHERE "auditId" IS NOT NULL;
    
    -- Compter les triggers qui utilisent "dossier"
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND action_statement ILIKE '%dossier%';
    
    -- Afficher les résultats
    RAISE NOTICE '=== ANALYSE PRÉALABLE ===';
    RAISE NOTICE 'Audit table: % enregistrements', audit_count;
    RAISE NOTICE 'Dossier table: % enregistrements', dossier_count;
    RAISE NOTICE 'Appointments avec auditId: % enregistrements', appointment_count;
    RAISE NOTICE 'Triggers utilisant "dossier": % triggers', trigger_count;
    
    -- Recommandations
    RAISE NOTICE '=== RECOMMANDATIONS ===';
    
    IF audit_count = 0 AND appointment_count = 0 THEN
        RAISE NOTICE '✅ SUPPRIMER Audit: table vide et aucune référence active';
    ELSIF audit_count = 0 AND appointment_count > 0 THEN
        RAISE NOTICE '⚠️ GARDER Audit: référencé par % appointments', appointment_count;
    ELSE
        RAISE NOTICE '⚠️ GARDER Audit: contient des données';
    END IF;
    
    IF dossier_count = 0 AND trigger_count = 0 THEN
        RAISE NOTICE '✅ SUPPRIMER Dossier: table vide et aucun trigger';
    ELSIF dossier_count = 0 AND trigger_count > 0 THEN
        RAISE NOTICE '⚠️ GARDER Dossier: utilisé par % triggers', trigger_count;
    ELSE
        RAISE NOTICE '⚠️ GARDER Dossier: contient des données';
    END IF;
    
    RAISE NOTICE '✅ GARDER ClientProduitEligible: table centrale avec données';
END $$;

-- 2. Nettoyage des références (décommenter si sûr)
/*
-- Supprimer les références vers Audit dans Appointment
UPDATE "Appointment" 
SET "auditId" = NULL 
WHERE "auditId" IS NOT NULL;

-- Supprimer les triggers qui utilisent "dossier" (si sûr)
DROP TRIGGER IF EXISTS update_dossier_progress_trigger ON "ClientProduitEligible";
DROP FUNCTION IF EXISTS trigger_update_dossier_progress();

-- Supprimer Audit si vide et sans références
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM "Audit") = 0 
    AND (SELECT COUNT(*) FROM "Appointment" WHERE "auditId" IS NOT NULL) = 0 THEN
        DROP TABLE IF EXISTS "Audit" CASCADE;
        RAISE NOTICE '✅ Table Audit supprimée (vide et sans références)';
    ELSE
        RAISE NOTICE '⚠️ Table Audit conservée (contient des données ou références)';
    END IF;
END $$;

-- Supprimer Dossier si vide et sans triggers
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM "Dossier") = 0 
    AND (SELECT COUNT(*) FROM information_schema.triggers 
         WHERE trigger_schema = 'public' 
         AND action_statement ILIKE '%dossier%') = 0 THEN
        DROP TABLE IF EXISTS "Dossier" CASCADE;
        RAISE NOTICE '✅ Table Dossier supprimée (vide et sans triggers)';
    ELSE
        RAISE NOTICE '⚠️ Table Dossier conservée (contient des données ou triggers)';
    END IF;
END $$;
*/

-- 3. Vérification post-nettoyage
SELECT 
    'POST_CLEANUP_CHECK' as check_type,
    table_name,
    CASE 
        WHEN table_name = 'Audit' THEN 
            CASE 
                WHEN (SELECT COUNT(*) FROM "Audit") = 0 THEN 'VIDE - PEUT ÊTRE SUPPRIMÉE'
                ELSE 'CONTIENT DES DONNÉES'
            END
        WHEN table_name = 'Dossier' THEN 
            CASE 
                WHEN (SELECT COUNT(*) FROM "Dossier") = 0 THEN 'VIDE - PEUT ÊTRE SUPPRIMÉE'
                ELSE 'CONTIENT DES DONNÉES'
            END
        ELSE 'CONSERVÉE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_name IN ('Audit', 'Dossier', 'ClientProduitEligible')
ORDER BY table_name; 