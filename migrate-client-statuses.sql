-- ============================================================================
-- MIGRATION DES STATUTS CLIENTS EXISTANTS
-- ============================================================================
-- 
-- Ce script met à jour les statuts des clients existants selon les nouvelles règles :
-- prospect → client (si première simulation réussie)
-- Initialise last_activity_at et first_simulation_at
-- 

-- 1. Afficher l'état actuel des clients
SELECT 'AVANT MIGRATION - État actuel des clients:' as info;
SELECT 
    status,
    COUNT(*) as count,
    COUNT(last_activity_at) as has_last_activity,
    COUNT(first_simulation_at) as has_first_simulation
FROM "Client"
GROUP BY status
ORDER BY status;

-- 2. Afficher quelques exemples avant migration
SELECT 'AVANT MIGRATION - Exemples de clients:' as info;
SELECT 
    id,
    email,
    status,
    created_at,
    last_activity_at,
    first_simulation_at
FROM "Client"
ORDER BY created_at DESC
LIMIT 5;

-- 3. Mettre à jour les clients prospect qui ont des simulations réussies
UPDATE "Client" 
SET 
    status = 'client',
    first_simulation_at = (
        SELECT MIN(s.created_at)
        FROM "simulations" s
        WHERE s.client_id = "Client".id
          AND s.status = 'completed'
    ),
    last_activity_at = COALESCE(last_activity_at, created_at)
WHERE status = 'prospect'
  AND EXISTS (
    SELECT 1 FROM "simulations" s
    WHERE s.client_id = "Client".id
      AND s.status = 'completed'
  );

-- 4. Mettre à jour first_simulation_at pour tous les clients qui ont des simulations
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

-- 5. S'assurer que last_activity_at est initialisé pour tous les clients
UPDATE "Client" 
SET last_activity_at = created_at
WHERE last_activity_at IS NULL;

-- 6. Afficher l'état après migration
SELECT 'APRÈS MIGRATION - État des clients:' as info;
SELECT 
    status,
    COUNT(*) as count,
    COUNT(last_activity_at) as has_last_activity,
    COUNT(first_simulation_at) as has_first_simulation
FROM "Client"
GROUP BY status
ORDER BY status;

-- 7. Afficher les détails des clients convertis
SELECT 'APRÈS MIGRATION - Clients convertis prospect → client:' as info;
SELECT 
    id,
    email,
    status,
    created_at,
    first_simulation_at,
    last_activity_at
FROM "Client"
WHERE status = 'client'
  AND first_simulation_at IS NOT NULL
ORDER BY first_simulation_at DESC;

-- 8. Statistiques de migration
SELECT 'STATISTIQUES DE MIGRATION:' as info;
SELECT 
    'Clients prospect convertis en client' as action,
    COUNT(*) as count
FROM "Client"
WHERE status = 'client'
  AND first_simulation_at IS NOT NULL;

SELECT 
    'Clients avec last_activity_at initialisé' as action,
    COUNT(*) as count
FROM "Client"
WHERE last_activity_at IS NOT NULL;

SELECT 
    'Clients avec first_simulation_at initialisé' as action,
    COUNT(*) as count
FROM "Client"
WHERE first_simulation_at IS NOT NULL;

-- 9. Vérification des données
SELECT 'VÉRIFICATION - Clients sans last_activity_at:' as info;
SELECT COUNT(*) as count
FROM "Client"
WHERE last_activity_at IS NULL;

SELECT 'VÉRIFICATION - Clients prospect avec simulations:' as info;
SELECT COUNT(*) as count
FROM "Client" c
WHERE c.status = 'prospect'
  AND EXISTS (
    SELECT 1 FROM "simulations" s
    WHERE s.client_id = c.id
      AND s.status = 'completed'
  );

-- 10. Résumé final
SELECT 'RÉSUMÉ FINAL - Distribution des statuts:' as info;
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM "Client"
GROUP BY status
ORDER BY count DESC;
