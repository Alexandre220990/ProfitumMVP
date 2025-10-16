-- ============================================================================
-- MIGRATION : UNIFORMISATION first_name + last_name
-- ============================================================================
-- Date: 16 octobre 2025
-- Objectif: Ajouter first_name et last_name à Client et Expert
-- Impact: 0 downtime - Migration progressive avec fallback

-- ============================================================================
-- ÉTAPE 1 : AJOUTER COLONNES (NON DESTRUCTIF)
-- ============================================================================

-- Table Client : Ajouter first_name et last_name
ALTER TABLE "Client" 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Table Expert : Ajouter first_name et last_name  
ALTER TABLE "Expert"
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

COMMENT ON COLUMN "Client".first_name IS 'Prénom du contact (migration uniformisation)';
COMMENT ON COLUMN "Client".last_name IS 'Nom de famille du contact (migration uniformisation)';
COMMENT ON COLUMN "Expert".first_name IS 'Prénom de l''expert (migration uniformisation)';
COMMENT ON COLUMN "Expert".last_name IS 'Nom de famille de l''expert (migration uniformisation)';

-- ============================================================================
-- ÉTAPE 2 : MIGRER DONNÉES EXISTANTES
-- ============================================================================

-- CLIENTS : Splitter name → first_name + last_name
UPDATE "Client"
SET 
  first_name = CASE 
    -- Si name contient un espace, prendre le premier mot
    WHEN name ~ ' ' THEN TRIM(SPLIT_PART(name, ' ', 1))
    -- Sinon mettre tout dans first_name
    ELSE TRIM(name)
  END,
  last_name = CASE 
    -- Si name contient un espace, prendre le reste
    WHEN name ~ ' ' THEN TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
    -- Sinon laisser vide
    ELSE NULL
  END
WHERE name IS NOT NULL AND name != '';

-- CLIENTS : Pour ceux sans name, utiliser company_name
UPDATE "Client"
SET 
  first_name = COALESCE(first_name, company_name),
  last_name = COALESCE(last_name, '')
WHERE first_name IS NULL;

-- EXPERTS : Splitter name → first_name + last_name
UPDATE "Expert"
SET 
  first_name = CASE 
    -- Si name contient un espace, prendre le premier mot
    WHEN name ~ ' ' THEN TRIM(SPLIT_PART(name, ' ', 1))
    -- Sinon mettre tout dans first_name
    ELSE TRIM(name)
  END,
  last_name = CASE 
    -- Si name contient un espace, prendre le reste
    WHEN name ~ ' ' THEN TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
    -- Sinon laisser vide
    ELSE NULL
  END
WHERE name IS NOT NULL AND name != '';

-- EXPERTS : Fallback sur company_name si pas de name
UPDATE "Expert"
SET 
  first_name = COALESCE(first_name, company_name),
  last_name = COALESCE(last_name, '')
WHERE first_name IS NULL;

-- ============================================================================
-- ÉTAPE 3 : VÉRIFICATION MIGRATION
-- ============================================================================

-- Vérifier Clients
SELECT 
  'CLIENTS' as table_name,
  COUNT(*) as total,
  COUNT(first_name) as avec_first_name,
  COUNT(last_name) as avec_last_name,
  COUNT(*) - COUNT(first_name) as sans_first_name
FROM "Client";

-- Exemple Clients migrés
SELECT 
  id,
  email,
  name as ancien_name,
  first_name,
  last_name,
  company_name
FROM "Client"
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier Experts
SELECT 
  'EXPERTS' as table_name,
  COUNT(*) as total,
  COUNT(first_name) as avec_first_name,
  COUNT(last_name) as avec_last_name,
  COUNT(*) - COUNT(first_name) as sans_first_name
FROM "Expert";

-- Exemple Experts migrés
SELECT 
  id,
  email,
  name as ancien_name,
  first_name,
  last_name,
  company_name
FROM "Expert"
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier Apporteurs (déjà OK)
SELECT 
  'APPORTEURS' as table_name,
  COUNT(*) as total,
  COUNT(first_name) as avec_first_name,
  COUNT(last_name) as avec_last_name
FROM "ApporteurAffaires";

-- ============================================================================
-- ÉTAPE 4 : CRÉER FONCTION HELPER (OPTIONNEL)
-- ============================================================================

-- Fonction pour générer le nom complet
CREATE OR REPLACE FUNCTION get_full_name(fname TEXT, lname TEXT, cname TEXT, email TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Priorité : first_name + last_name > company_name > email
  IF fname IS NOT NULL AND fname != '' THEN
    RETURN TRIM(CONCAT(fname, ' ', COALESCE(lname, '')));
  ELSIF cname IS NOT NULL AND cname != '' THEN
    RETURN cname;
  ELSE
    RETURN email;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Test fonction
SELECT 
  get_full_name('Jean', 'Dupont', NULL, 'jean@test.com') as test1,
  get_full_name(NULL, NULL, 'Société ABC', 'contact@abc.com') as test2,
  get_full_name(NULL, NULL, NULL, 'user@email.com') as test3;

-- ============================================================================
-- ÉTAPE 5 : CONTRAINTES (OPTIONNEL - APRÈS VALIDATION)
-- ============================================================================

-- Rendre first_name NOT NULL après migration validée
-- ALTER TABLE "Client" ALTER COLUMN first_name SET NOT NULL;
-- ALTER TABLE "Expert" ALTER COLUMN first_name SET NOT NULL;

-- Index pour performance recherche
CREATE INDEX IF NOT EXISTS idx_client_first_name ON "Client"(first_name);
CREATE INDEX IF NOT EXISTS idx_client_last_name ON "Client"(last_name);
CREATE INDEX IF NOT EXISTS idx_expert_first_name ON "Expert"(first_name);
CREATE INDEX IF NOT EXISTS idx_expert_last_name ON "Expert"(last_name);

-- ============================================================================
-- ROLLBACK (SI BESOIN)
-- ============================================================================

/*
-- Supprimer colonnes ajoutées
ALTER TABLE "Client" DROP COLUMN IF EXISTS first_name;
ALTER TABLE "Client" DROP COLUMN IF EXISTS last_name;
ALTER TABLE "Expert" DROP COLUMN IF EXISTS first_name;
ALTER TABLE "Expert" DROP COLUMN IF EXISTS last_name;

-- Supprimer fonction
DROP FUNCTION IF EXISTS get_full_name(TEXT, TEXT, TEXT, TEXT);
*/

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================

