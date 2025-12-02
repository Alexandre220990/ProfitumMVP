-- Migration: Ajouter le lien entre prospects et import_history
-- Date: 2025-12-02
-- Description: Permet de regrouper les prospects par liste d'import

-- Ajouter la colonne import_batch_id à la table prospects
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES import_history(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances des requêtes groupées par import
CREATE INDEX IF NOT EXISTS idx_prospects_import_batch 
ON prospects(import_batch_id) 
WHERE import_batch_id IS NOT NULL;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN prospects.import_batch_id IS 'Référence vers l''import d''origine du prospect. Permet de regrouper les prospects par liste d''import.';

