-- ============================================================================
-- MIGRATION : UNIFICATION TABLES RDV
-- ============================================================================
-- Objectif : Supprimer ClientRDV et tout migrer vers RDV

-- ============================================================================
-- NOTE : Table ClientRDV n'existe PAS dans la base de données
-- ============================================================================
-- Aucune migration nécessaire. Seule la table RDV est utilisée.

-- 1. Vérifier les RDV existants
-- ============================================================================

SELECT 
  'RDV Existants' as info,
  COUNT(*) as total,
  COUNT(DISTINCT client_id) as clients,
  COUNT(DISTINCT expert_id) as experts,
  COUNT(DISTINCT apporteur_id) as apporteurs,
  ROUND(AVG(duration_minutes)) as avg_duration
FROM "RDV";

-- 2. Compter par statut
-- ============================================================================

SELECT 
  status,
  COUNT(*) as count
FROM "RDV"
GROUP BY status
ORDER BY count DESC;

-- 5. Mettre à jour duration_minutes par défaut à 30min
-- ============================================================================

-- Mettre à jour les RDV existants avec duration = 60min vers 30min
-- ⚠️ Décommenter si vous voulez changer tous les RDV existants
-- UPDATE "RDV" SET duration_minutes = 30 WHERE duration_minutes = 60;

-- 6. Vérification finale
-- ============================================================================

SELECT 
  'Vérification RDV' as check_type,
  status,
  COUNT(*) as count,
  ROUND(AVG(duration_minutes)) as avg_duration
FROM "RDV"
GROUP BY status
ORDER BY count DESC;

SELECT 
  'RDV par type utilisateur' as check_type,
  CASE 
    WHEN client_id IS NOT NULL THEN 'a_client'
    ELSE NULL
  END as has_client,
  CASE 
    WHEN expert_id IS NOT NULL THEN 'a_expert'
    ELSE NULL
  END as has_expert,
  CASE 
    WHEN apporteur_id IS NOT NULL THEN 'a_apporteur'
    ELSE NULL
  END as has_apporteur,
  COUNT(*) as count
FROM "RDV"
GROUP BY has_client, has_expert, has_apporteur
ORDER BY count DESC;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

/*
Après migration :
✅ ClientRDV supprimé
✅ Tous les RDV dans table RDV
✅ Duration par défaut 30min
✅ Structure unifiée

Prochaine étape :
- Backend : Validation slots 30min
- Frontend : Formulaire unique
- Frontend : Cases à cocher multi-types
*/

