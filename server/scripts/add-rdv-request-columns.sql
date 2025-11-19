-- ============================================================================
-- MIGRATION : Ajout des colonnes pour la demande de RDV
-- Date: 2025-01-19
-- Objectif: Ajouter les colonnes nécessaires pour gérer les demandes de RDV
--           lors de l'approbation des candidatures apporteur
-- ============================================================================

-- Ajouter les colonnes manquantes pour la gestion des demandes de RDV
ALTER TABLE "ApporteurAffaires"
  ADD COLUMN IF NOT EXISTS rdv_requested BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rdv_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rdv_requested_by UUID REFERENCES "Admin"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rdv_title CHARACTER VARYING(255),
  ADD COLUMN IF NOT EXISTS rdv_date DATE,
  ADD COLUMN IF NOT EXISTS rdv_time TIME;

-- Ajouter un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_apporteur_rdv_requested 
  ON "ApporteurAffaires"(rdv_requested) 
  WHERE rdv_requested = TRUE;

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN "ApporteurAffaires".rdv_requested IS 
  'Indique si une demande de RDV a été faite pour cette candidature';
COMMENT ON COLUMN "ApporteurAffaires".rdv_requested_at IS 
  'Date et heure de la demande de RDV';
COMMENT ON COLUMN "ApporteurAffaires".rdv_requested_by IS 
  'ID de l''admin qui a demandé le RDV';
COMMENT ON COLUMN "ApporteurAffaires".rdv_title IS 
  'Titre du RDV proposé (ex: "RDV de qualification")';
COMMENT ON COLUMN "ApporteurAffaires".rdv_date IS 
  'Date du RDV proposé';
COMMENT ON COLUMN "ApporteurAffaires".rdv_time IS 
  'Heure du RDV proposé';

-- Vérifier que les colonnes ont été créées
SELECT 
    column_name AS "Colonne",
    data_type AS "Type",
    is_nullable AS "Nullable",
    column_default AS "Défaut"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ApporteurAffaires'
AND column_name IN ('rdv_requested', 'rdv_requested_at', 'rdv_requested_by', 'rdv_title', 'rdv_date', 'rdv_time')
ORDER BY column_name;

