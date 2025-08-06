-- ============================================================================
-- NETTOYAGE SÉCURISÉ DES TABLES REDONDANTES
-- ============================================================================

-- ATTENTION : Ce script supprime les tables Audit et Dossier si elles sont vides
-- Exécuter avec précaution !

-- 1. Vérification préalable
DO $$
DECLARE
    audit_count INTEGER;
    dossier_count INTEGER;
BEGIN
    -- Compter les enregistrements
    SELECT COUNT(*) INTO audit_count FROM "Audit";
    SELECT COUNT(*) INTO dossier_count FROM "Dossier";
    
    -- Afficher les résultats
    RAISE NOTICE 'Audit table: % enregistrements', audit_count;
    RAISE NOTICE 'Dossier table: % enregistrements', dossier_count;
    
    -- Vérifier s'il y a des contraintes de clés étrangères
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name IN ('Audit', 'Dossier')
    ) THEN
        RAISE NOTICE 'ATTENTION: Des tables référencent Audit ou Dossier';
    ELSE
        RAISE NOTICE 'Aucune référence trouvée vers Audit ou Dossier';
    END IF;
    
    -- Recommandations
    IF audit_count = 0 THEN
        RAISE NOTICE 'RECOMMANDATION: Supprimer la table Audit (vide)';
    ELSE
        RAISE NOTICE 'ATTENTION: Garder la table Audit (contient des données)';
    END IF;
    
    IF dossier_count = 0 THEN
        RAISE NOTICE 'RECOMMANDATION: Supprimer la table Dossier (vide)';
    ELSE
        RAISE NOTICE 'ATTENTION: Garder la table Dossier (contient des données)';
    END IF;
END $$;

-- 2. Suppression sécurisée (décommenter seulement si sûr)
/*
-- Supprimer Audit si vide
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM "Audit") = 0 THEN
        DROP TABLE IF EXISTS "Audit" CASCADE;
        RAISE NOTICE 'Table Audit supprimée (était vide)';
    ELSE
        RAISE NOTICE 'Table Audit conservée (contient des données)';
    END IF;
END $$;

-- Supprimer Dossier si vide
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM "Dossier") = 0 THEN
        DROP TABLE IF EXISTS "Dossier" CASCADE;
        RAISE NOTICE 'Table Dossier supprimée (était vide)';
    ELSE
        RAISE NOTICE 'Table Dossier conservée (contient des données)';
    END IF;
END $$;
*/

-- 3. Vérification post-nettoyage
SELECT 
    'POST_CLEANUP_CHECK' as check_type,
    table_name,
    CASE 
        WHEN table_name = 'Audit' THEN 'VÉRIFIER SI SUPPRIMÉE'
        WHEN table_name = 'Dossier' THEN 'VÉRIFIER SI SUPPRIMÉE'
        ELSE 'CONSERVÉE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_name IN ('Audit', 'Dossier', 'ClientProduitEligible')
ORDER BY table_name; 