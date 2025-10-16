-- ============================================================================
-- SUPPRESSION CLIENTS TEMPORAIRES - VERSION SAFE
-- ============================================================================
-- Date: 16 octobre 2025
-- Impact: 3 clients temporaires SANS dossiers → Suppression sûre

-- ============================================================================
-- SUPPRESSION DIRECTE (SAFE - 0 dossiers liés)
-- ============================================================================

DELETE FROM "Client"
WHERE 
  email LIKE '%@profitum.temp%'
  OR email LIKE 'temp_%@%'
  OR (first_name = 'Client' AND last_name = 'Temporaire');

-- ============================================================================
-- VÉRIFICATION POST-SUPPRESSION
-- ============================================================================

SELECT 
  COUNT(*) as total_clients_restants
FROM "Client";

SELECT 
  id,
  email,
  first_name,
  last_name,
  company_name,
  created_at
FROM "Client"
ORDER BY created_at DESC;

