-- ============================================================================
-- AJOUT DES COLONNES MANQUANTES À AdminNotification
-- Ajoute les 2 colonnes manquantes pour atteindre 17 colonnes
-- Date: 05 Décembre 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. AJOUT DE LA COLONNE is_read (si manquante)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AdminNotification' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE "AdminNotification" 
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN "AdminNotification".is_read IS 
        'Indique si la notification a été lue';
        
        RAISE NOTICE '✅ Colonne is_read ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne is_read existe déjà';
    END IF;
END $$;

-- ============================================================================
-- 2. AJOUT DE LA COLONNE admin_notes (si manquante)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AdminNotification' 
        AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE "AdminNotification" 
        ADD COLUMN admin_notes TEXT;
        
        COMMENT ON COLUMN "AdminNotification".admin_notes IS 
        'Notes additionnelles pour les administrateurs';
        
        RAISE NOTICE '✅ Colonne admin_notes ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne admin_notes existe déjà';
    END IF;
END $$;

-- ============================================================================
-- 3. VÉRIFICATION POST-AJOUT
-- ============================================================================

DO $$
DECLARE
    column_count integer;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'AdminNotification' 
    AND table_schema = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Nombre de colonnes après ajout: %', column_count;
    RAISE NOTICE 'Colonnes attendues: 17';
    RAISE NOTICE '========================================';
    
    IF column_count = 17 THEN
        RAISE NOTICE '✅ PARFAIT : Exactement 17 colonnes (conforme)';
    ELSIF column_count > 17 THEN
        RAISE NOTICE 'ℹ️ % colonnes (17+ attendues)', column_count;
    ELSE
        RAISE NOTICE '⚠️ % colonnes - Il manque encore % colonne(s)', column_count, (17 - column_count);
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- 4. VÉRIFICATION FINALE
-- ============================================================================

SELECT 
    'Vérification finale' as type,
    'AdminNotification' as table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotification' AND table_schema = 'public') as colonnes,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotification' AND table_schema = 'public') = 17 THEN '✅ Conforme (17 colonnes)'
        ELSE CONCAT('ℹ️ ', (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotification' AND table_schema = 'public'), ' colonnes')
    END as statut;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
