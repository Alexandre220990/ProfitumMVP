-- ============================================================================
-- MIGRATION : Correction colonnes de commissions
-- Date: 2025-11-05
-- Objectif: Nettoyer et standardiser les taux de commission
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : TABLE Expert
-- ============================================================================

-- Supprimer hourly_rate (colonne inutilisée)
ALTER TABLE "Expert"
  DROP COLUMN IF EXISTS hourly_rate;

-- Mettre à jour compensation avec valeur par défaut 30%
-- Pour tous les experts qui ont NULL ou 0
UPDATE "Expert"
SET compensation = 0.30
WHERE compensation IS NULL OR compensation = 0;

-- Modifier la colonne pour avoir un défaut
ALTER TABLE "Expert"
  ALTER COLUMN compensation SET DEFAULT 0.30,
  ALTER COLUMN compensation SET NOT NULL;

-- Ajouter commentaire
COMMENT ON COLUMN "Expert".compensation IS 
  'Taux de rémunération Profitum (défaut: 30% = 0.30). Le client paie ce % du montant du dossier.';

-- ============================================================================
-- PARTIE 2 : TABLE ApporteurAffaires
-- ============================================================================

-- Mettre à jour commission_rate avec valeur par défaut 10%
-- Pour tous les apporteurs qui ont NULL ou 0
UPDATE "ApporteurAffaires"
SET commission_rate = 0.10
WHERE commission_rate IS NULL OR commission_rate = 0 OR commission_rate = 0.00;

-- Modifier la colonne pour avoir un défaut
ALTER TABLE "ApporteurAffaires"
  ALTER COLUMN commission_rate SET DEFAULT 0.10,
  ALTER COLUMN commission_rate SET NOT NULL;

-- Ajouter commentaire
COMMENT ON COLUMN "ApporteurAffaires".commission_rate IS 
  'Taux de commission apporteur (défaut: 10% = 0.10). Calculé sur la commission de l''expert.';

-- ============================================================================
-- PARTIE 3 : TABLE invoice (ajout colonnes pour factures Profitum)
-- ============================================================================

-- La table "invoice" existe déjà, on ajoute les colonnes manquantes pour notre workflow

-- Ajouter colonnes spécifiques Profitum si elles n'existent pas
ALTER TABLE "invoice"
  ADD COLUMN IF NOT EXISTS client_produit_eligible_id UUID REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS apporteur_id UUID REFERENCES "ApporteurAffaires"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS montant_audit NUMERIC, -- Base de calcul
  ADD COLUMN IF NOT EXISTS taux_compensation_expert NUMERIC, -- % expert
  ADD COLUMN IF NOT EXISTS taux_commission_apporteur NUMERIC, -- % apporteur
  ADD COLUMN IF NOT EXISTS error_message TEXT, -- Si erreur calcul
  ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT, -- Chemin PDF dans Storage
  ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE; -- Date génération PDF

-- Index supplémentaires
CREATE INDEX IF NOT EXISTS idx_invoice_cpe ON "invoice"(client_produit_eligible_id) WHERE client_produit_eligible_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_apporteur ON "invoice"(apporteur_id) WHERE apporteur_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_status ON "invoice"(status);

-- Commentaires
COMMENT ON COLUMN "invoice".client_produit_eligible_id IS 'Référence au dossier ClientProduitEligible';
COMMENT ON COLUMN "invoice".montant_audit IS 'Montant du dossier validé par le client (base de calcul)';
COMMENT ON COLUMN "invoice".taux_compensation_expert IS 'Taux de rémunération Profitum (ex: 0.30 = 30%)';
COMMENT ON COLUMN "invoice".taux_commission_apporteur IS 'Taux de commission apporteur (ex: 0.10 = 10%)';
COMMENT ON COLUMN "invoice".error_message IS 'Message d''erreur si calcul impossible (données manquantes)';
COMMENT ON COLUMN "invoice".pdf_storage_path IS 'Chemin du PDF généré dans Supabase Storage';

-- ============================================================================
-- PARTIE 4 : VÉRIFICATIONS
-- ============================================================================

-- Vérifier les taux experts
SELECT 
  compensation,
  COUNT(*) as nombre_experts,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM "Expert"
GROUP BY compensation
ORDER BY COUNT(*) DESC;

-- Vérifier les taux apporteurs
SELECT 
  commission_rate,
  COUNT(*) as nombre_apporteurs,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM "ApporteurAffaires"
GROUP BY commission_rate
ORDER BY COUNT(*) DESC;

-- Vérifier que les colonnes ont été ajoutées à invoice
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice'
AND column_name IN (
  'client_produit_eligible_id',
  'apporteur_id',
  'montant_audit',
  'taux_compensation_expert',
  'taux_commission_apporteur',
  'error_message',
  'pdf_storage_path'
)
ORDER BY column_name;

-- ============================================================================
-- ROLLBACK (En cas de problème)
-- ============================================================================
/*
-- Restaurer hourly_rate
ALTER TABLE "Expert" ADD COLUMN hourly_rate DOUBLE PRECISION DEFAULT 0;

-- Remettre NULL aux compensations
UPDATE "Expert" SET compensation = NULL WHERE compensation = 0.30;

-- Remettre 0 aux commissions apporteur
UPDATE "ApporteurAffaires" SET commission_rate = 0.00 WHERE commission_rate = 0.10;

-- Supprimer colonnes ajoutées à invoice
ALTER TABLE "invoice"
  DROP COLUMN IF EXISTS client_produit_eligible_id,
  DROP COLUMN IF EXISTS apporteur_id,
  DROP COLUMN IF EXISTS montant_audit,
  DROP COLUMN IF EXISTS taux_compensation_expert,
  DROP COLUMN IF EXISTS taux_commission_apporteur,
  DROP COLUMN IF EXISTS error_message,
  DROP COLUMN IF EXISTS pdf_storage_path,
  DROP COLUMN IF EXISTS pdf_generated_at;
*/

-- ============================================================================
-- FIN
-- ============================================================================
SELECT '✅ Migration commissions terminée !' as statut, NOW() as horodatage;

