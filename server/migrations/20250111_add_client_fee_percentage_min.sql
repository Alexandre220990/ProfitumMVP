-- ============================================================================
-- Migration : Ajouter client_fee_percentage_min dans CabinetProduitEligible
-- ============================================================================
-- Date: 2025-01-11
-- Objectif: Permettre au owner du cabinet de définir un minimum de commission
--            par produit pour limiter la négociation par les experts
-- ============================================================================

BEGIN;

-- Ajouter la colonne client_fee_percentage_min dans CabinetProduitEligible
-- Cette colonne représente le pourcentage minimum de commission que le client
-- doit payer à l'expert (en décimal, ex: 0.25 = 25%)
-- Si NULL, aucun minimum n'est défini et l'expert ne peut pas baisser le fee
-- Si défini, l'expert peut négocier entre ce minimum et le client_fee_percentage max
ALTER TABLE "CabinetProduitEligible"
ADD COLUMN IF NOT EXISTS "client_fee_percentage_min" NUMERIC(5,4) DEFAULT NULL;

COMMENT ON COLUMN "CabinetProduitEligible"."client_fee_percentage_min" IS 
'Pourcentage minimum de commission client (en décimal, ex: 0.25 = 25%). 
Si NULL, aucun minimum défini et négociation impossible. 
Si défini, l''expert peut négocier entre ce minimum et le client_fee_percentage max du produit.';

COMMIT;

