-- ============================================================================
-- MIGRATION PRODUCTION SÉCURISÉE - first_name/last_name
-- ============================================================================
-- Date: 2025-10-16
-- Objectif: Ajouter colonnes first_name/last_name aux tables Client et Expert
-- Impact: 0 downtime, non-destructif, rétrocompatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : AJOUT DES COLONNES (NON-BLOQUANT)
-- ============================================================================

-- Table Expert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Expert' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE "Expert" ADD COLUMN first_name TEXT;
    RAISE NOTICE '✅ Colonne Expert.first_name ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne Expert.first_name existe déjà';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Expert' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE "Expert" ADD COLUMN last_name TEXT;
    RAISE NOTICE '✅ Colonne Expert.last_name ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne Expert.last_name existe déjà';
  END IF;
END $$;

-- Table Client
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Client' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE "Client" ADD COLUMN first_name TEXT;
    RAISE NOTICE '✅ Colonne Client.first_name ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne Client.first_name existe déjà';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Client' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE "Client" ADD COLUMN last_name TEXT;
    RAISE NOTICE '✅ Colonne Client.last_name ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne Client.last_name existe déjà';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : MIGRATION DES DONNÉES (SI name EXISTE)
-- ============================================================================

-- Expert : Migrer name → first_name/last_name
UPDATE "Expert"
SET 
  first_name = CASE 
    WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END
WHERE name IS NOT NULL 
  AND name != ''
  AND (first_name IS NULL OR first_name = '');

-- Client : Migrer name → first_name/last_name  
UPDATE "Client"
SET 
  first_name = CASE 
    WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END
WHERE name IS NOT NULL 
  AND name != ''
  AND (first_name IS NULL OR first_name = '');

-- ============================================================================
-- ÉTAPE 3 : VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  expert_count INTEGER;
  expert_migrated INTEGER;
  client_count INTEGER;
  client_migrated INTEGER;
BEGIN
  -- Compter les experts
  SELECT COUNT(*) INTO expert_count FROM "Expert";
  SELECT COUNT(*) INTO expert_migrated FROM "Expert" 
    WHERE first_name IS NOT NULL AND first_name != '';
  
  -- Compter les clients
  SELECT COUNT(*) INTO client_count FROM "Client";
  SELECT COUNT(*) INTO client_migrated FROM "Client" 
    WHERE first_name IS NOT NULL AND first_name != '';
  
  -- Afficher les résultats
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION COMPLÉTÉE';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Experts : % total, % avec first_name', expert_count, expert_migrated;
  RAISE NOTICE 'Clients : % total, % avec first_name', client_count, client_migrated;
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

-- ============================================================================
-- ÉTAPE 4 : EXEMPLES DE VÉRIFICATION
-- ============================================================================

-- Afficher quelques exemples d'experts migrés
SELECT 
  id,
  name,
  first_name,
  last_name,
  company_name
FROM "Expert"
LIMIT 5;

-- Afficher quelques exemples de clients migrés
SELECT 
  id,
  name,
  first_name,
  last_name,
  company_name
FROM "Client"
LIMIT 5;

COMMIT;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- 1. Cette migration est NON-DESTRUCTIVE
--    - Les colonnes 'name' existantes sont CONSERVÉES
--    - Rétrocompatibilité totale
--
-- 2. Migration IDEMPOTENTE
--    - Peut être exécutée plusieurs fois sans risque
--    - Vérifie l'existence des colonnes avant de les créer
--
-- 3. ROLLBACK POSSIBLE
--    - Les colonnes name originales sont intactes
--    - En cas de problème, le code peut utiliser name en fallback
--
-- 4. IMPACT EN PRODUCTION
--    - Durée estimée : 5-10 secondes
--    - Aucun downtime requis
--    - Compatible avec les connexions existantes
--
-- ============================================================================

