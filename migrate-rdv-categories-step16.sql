-- ============================================================================
-- MIGRATION CATÉGORIES RDV (Étape 16)
-- Objectif : harmoniser les valeurs et verrouiller les 5 catégories officielles
-- ============================================================================

BEGIN;

-- 1. Mettre à jour les anciennes valeurs vers la nomenclature finale
UPDATE "RDV"
SET category = 'rdv_client'
WHERE category IN ('client_rdv', 'rdv', 'client');

UPDATE "RDV"
SET category = 'reunion_interne'
WHERE category IN ('internal_meeting', 'meeting_interne', 'reunion');

UPDATE "RDV"
SET category = 'suivi_dossier'
WHERE category IN ('follow_up', 'suivi', 'dossier_followup');

UPDATE "RDV"
SET category = 'echeance_admin'
WHERE category IN ('deadline_admin', 'regulatory_deadline', 'echeance');

UPDATE "RDV"
SET category = 'rappel_personnel'
WHERE category IN ('reminder', 'note_personnelle');

-- Valeurs NULL → basculer en rdv_client par défaut (sera géré côté backend ensuite)
UPDATE "RDV"
SET category = 'rdv_client'
WHERE category IS NULL;

COMMIT;

-- 2. Vérification
SELECT category, COUNT(*) AS total
FROM "RDV"
GROUP BY category
ORDER BY total DESC;

-- 3. (Optionnel) Contrôle en amont de la contrainte CHECK :
-- ALTER TABLE "RDV"
--   ADD CONSTRAINT rdv_category_check
--   CHECK (category IN (
--     'rdv_client',
--     'reunion_interne',
--     'suivi_dossier',
--     'echeance_admin',
--     'rappel_personnel'
--   ));

