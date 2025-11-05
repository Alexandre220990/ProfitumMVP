-- ============================================================================
-- MIGRATION : Correction MODÈLE DE COMMISSION (Waterfall correct)
-- Date: 2025-11-05
-- Objectif: Corriger le modèle de commission
-- ============================================================================

-- MODÈLE CORRECT:
-- 1. Client paie 30% à l'Expert (sur montant remboursement)
-- 2. Expert paie 30% à Profitum (sur ce qu'il a reçu du client)
-- 3. Profitum reverse 10% à l'Apporteur (sur ce qu'il a reçu de l'expert)

-- ============================================================================
-- PARTIE 1 : TABLE Expert
-- ============================================================================

-- Supprimer hourly_rate (colonne inutilisée)
ALTER TABLE "Expert"
  DROP COLUMN IF EXISTS hourly_rate;

-- RENOMMER compensation en client_fee_percentage
-- Car c'est le % que le CLIENT paie à l'EXPERT
ALTER TABLE "Expert"
  RENAME COLUMN compensation TO client_fee_percentage;

-- Mettre à jour avec valeur par défaut 30%
UPDATE "Expert"
SET client_fee_percentage = 0.30
WHERE client_fee_percentage IS NULL OR client_fee_percentage = 0;

-- Modifier la colonne pour avoir un défaut
ALTER TABLE "Expert"
  ALTER COLUMN client_fee_percentage SET DEFAULT 0.30,
  ALTER COLUMN client_fee_percentage SET NOT NULL;

-- Ajouter colonne profitum_fee_percentage (30% de ce que l'expert reçoit)
ALTER TABLE "Expert"
  ADD COLUMN IF NOT EXISTS profitum_fee_percentage NUMERIC(5,4) DEFAULT 0.30 NOT NULL;

-- Commentaires
COMMENT ON COLUMN "Expert".client_fee_percentage IS 
  'Pourcentage payé par le CLIENT à l''EXPERT (défaut: 30% = 0.30). Ex: 10000€ remboursement → Client paie 3000€ à l''expert';

COMMENT ON COLUMN "Expert".profitum_fee_percentage IS 
  'Pourcentage payé par l''EXPERT à PROFITUM sur ce qu''il reçoit du client (défaut: 30% = 0.30). Ex: Expert reçoit 3000€ → Profitum reçoit 900€';

-- ============================================================================
-- PARTIE 2 : TABLE ApporteurAffaires
-- ============================================================================

-- RENOMMER commission_rate en profitum_share_percentage
-- Car c'est le % que l'apporteur reçoit de ce que PROFITUM touche
ALTER TABLE "ApporteurAffaires"
  RENAME COLUMN commission_rate TO profitum_share_percentage;

-- Mettre à jour avec valeur par défaut 10%
UPDATE "ApporteurAffaires"
SET profitum_share_percentage = 0.10
WHERE profitum_share_percentage IS NULL OR profitum_share_percentage = 0;

-- Modifier la colonne pour avoir un défaut
ALTER TABLE "ApporteurAffaires"
  ALTER COLUMN profitum_share_percentage SET DEFAULT 0.10,
  ALTER COLUMN profitum_share_percentage SET NOT NULL;

-- Commentaire
COMMENT ON COLUMN "ApporteurAffaires".profitum_share_percentage IS 
  'Pourcentage que l''apporteur reçoit de la commission PROFITUM (défaut: 10% = 0.10). Ex: Profitum reçoit 900€ → Apporteur reçoit 90€';

-- ============================================================================
-- PARTIE 3 : TABLE invoice (colonnes facture Profitum)
-- ============================================================================

-- Ajouter colonnes si elles n'existent pas
ALTER TABLE invoice
  ADD COLUMN IF NOT EXISTS client_produit_eligible_id UUID REFERENCES "ClientProduitEligible"(id),
  ADD COLUMN IF NOT EXISTS apporteur_id UUID REFERENCES "ApporteurAffaires"(id),
  ADD COLUMN IF NOT EXISTS montant_remboursement NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS client_fee_percentage NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS expert_total_fee NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS profitum_fee_percentage NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS profitum_total_fee NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS apporteur_share_percentage NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS apporteur_commission NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_invoice_dossier 
  ON invoice(client_produit_eligible_id);

CREATE INDEX IF NOT EXISTS idx_invoice_apporteur 
  ON invoice(apporteur_id) 
  WHERE apporteur_id IS NOT NULL;

-- Commentaires explicatifs
COMMENT ON COLUMN invoice.montant_remboursement IS 
  'Montant total du remboursement reçu par le client (base de calcul)';

COMMENT ON COLUMN invoice.client_fee_percentage IS 
  '% payé par CLIENT à EXPERT (ex: 0.30 = 30%)';

COMMENT ON COLUMN invoice.expert_total_fee IS 
  'Montant total payé par client à expert (montant_remboursement × client_fee_percentage)';

COMMENT ON COLUMN invoice.profitum_fee_percentage IS 
  '% payé par EXPERT à PROFITUM (ex: 0.30 = 30% de ce que l''expert reçoit)';

COMMENT ON COLUMN invoice.profitum_total_fee IS 
  'Montant que Profitum reçoit de l''expert (expert_total_fee × profitum_fee_percentage) = montant HT de la facture';

COMMENT ON COLUMN invoice.apporteur_share_percentage IS 
  '% reversé à l''apporteur par Profitum (ex: 0.10 = 10% de ce que Profitum touche)';

COMMENT ON COLUMN invoice.apporteur_commission IS 
  'Commission apporteur (profitum_total_fee × apporteur_share_percentage)';

-- ============================================================================
-- LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration waterfall commission terminée';
  RAISE NOTICE '';
  RAISE NOTICE '📊 NOUVEAU MODÈLE (Exemple: Remboursement 10,000€):';
  RAISE NOTICE '  1️⃣ Client paie 30%% à Expert = 3,000€';
  RAISE NOTICE '  2️⃣ Expert paie 30%% à Profitum = 900€ (garde 2,100€)';
  RAISE NOTICE '  3️⃣ Profitum reverse 10%% à Apporteur = 90€ (garde 810€)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Colonnes renommées:';
  RAISE NOTICE '  - Expert.compensation → client_fee_percentage';
  RAISE NOTICE '  - ApporteurAffaires.commission_rate → profitum_share_percentage';
END $$;

