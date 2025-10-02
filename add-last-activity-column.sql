-- ============================================================================
-- AJOUT DE LA COLONNE last_activity_at À LA TABLE CLIENT
-- ============================================================================

-- 1. Ajouter la colonne last_activity_at
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- 2. Ajouter la colonne first_simulation_at pour tracer la première simulation
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS first_simulation_at TIMESTAMP WITH TIME ZONE;

-- 3. Initialiser les valeurs existantes avec created_at
UPDATE "Client" 
SET last_activity_at = created_at
WHERE last_activity_at IS NULL;

-- 4. Initialiser first_simulation_at pour les clients qui ont déjà des simulations
UPDATE "Client" 
SET first_simulation_at = (
    SELECT MIN(s.created_at)
    FROM "simulations" s
    WHERE s.client_id = "Client".id
      AND s.status = 'completed'
)
WHERE first_simulation_at IS NULL
  AND EXISTS (
    SELECT 1 FROM "simulations" s
    WHERE s.client_id = "Client".id
      AND s.status = 'completed'
  );

-- 5. Créer un index pour les performances sur last_activity_at
CREATE INDEX IF NOT EXISTS idx_client_last_activity_at ON "Client"(last_activity_at);

-- 6. Créer un index pour les performances sur first_simulation_at
CREATE INDEX IF NOT EXISTS idx_client_first_simulation_at ON "Client"(first_simulation_at);

-- 7. Vérifier les données
SELECT 
    status,
    COUNT(*) as count,
    COUNT(last_activity_at) as has_last_activity,
    COUNT(first_simulation_at) as has_first_simulation
FROM "Client"
GROUP BY status
ORDER BY status;

-- 8. Afficher quelques exemples de clients avec leurs nouvelles colonnes
SELECT 
    id,
    email,
    status,
    created_at,
    last_activity_at,
    first_simulation_at
FROM "Client"
LIMIT 5;
