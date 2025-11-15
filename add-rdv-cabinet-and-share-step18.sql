-- ============================================================================
-- Étape 18 : RDV + partage dossiers par cabinet
-- ============================================================================
-- Prérequis : exécution de create-cabinet-structures-step17.sql
-- ============================================================================

BEGIN;

-- 1. Ajouter cabinet_id sur RDV
ALTER TABLE "RDV"
  ADD COLUMN IF NOT EXISTS cabinet_id UUID REFERENCES "Cabinet"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rdv_cabinet_date
  ON "RDV"(cabinet_id, scheduled_date);

-- 2. Table ClientProduitEligibleShare
CREATE TABLE IF NOT EXISTS "ClientProduitEligibleShare" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_produit_eligible_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES "Expert"(id) ON DELETE CASCADE,
  cabinet_id UUID REFERENCES "Cabinet"(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT jsonb_build_object('read', true, 'write', false),
  granted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cpe_share_cpe ON "ClientProduitEligibleShare"(client_produit_eligible_id);
CREATE INDEX IF NOT EXISTS idx_cpe_share_expert ON "ClientProduitEligibleShare"(expert_id);
CREATE INDEX IF NOT EXISTS idx_cpe_share_cabinet ON "ClientProduitEligibleShare"(cabinet_id);

-- 3. Mettre cabinet_id sur les RDV existants si possible (ex : via expert principal)
UPDATE "RDV" r
SET cabinet_id = e.cabinet_id
FROM "Expert" e
WHERE r.expert_id = e.id
  AND r.cabinet_id IS NULL
  AND e.cabinet_id IS NOT NULL;

-- Apporteur en fallback
UPDATE "RDV" r
SET cabinet_id = a.cabinet_id
FROM "ApporteurAffaires" a
WHERE r.apporteur_id = a.id
  AND r.cabinet_id IS NULL
  AND a.cabinet_id IS NOT NULL;

COMMIT;

-- 4. Vérifications
SELECT 'RDV' AS table, COUNT(*) FILTER (WHERE cabinet_id IS NOT NULL) AS rdv_rattaches
FROM "RDV";

SELECT 'ClientProduitEligibleShare' AS table, COUNT(*) AS total
FROM "ClientProduitEligibleShare";

