-- Migration: Créer la table import_history pour gérer les imports de prospects
-- Date: 2025-12-05
-- Description: Crée la table import_history si elle n'existe pas, avec toutes les colonnes nécessaires

-- Créer la table import_history si elle n'existe pas
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL DEFAULT 'prospect',
  file_name TEXT,
  file_size INTEGER,
  mapping_config JSONB,
  status TEXT DEFAULT 'processing',
  created_by UUID,
  started_at TIMESTAMPTZ,
  total_rows INTEGER,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  results JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes manquantes si elles n'existent pas déjà
DO $$ 
BEGIN
  -- entity_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'entity_type') THEN
    ALTER TABLE import_history ADD COLUMN entity_type TEXT NOT NULL DEFAULT 'prospect';
  END IF;

  -- file_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'file_name') THEN
    ALTER TABLE import_history ADD COLUMN file_name TEXT;
  END IF;

  -- file_size
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'file_size') THEN
    ALTER TABLE import_history ADD COLUMN file_size INTEGER;
  END IF;

  -- mapping_config
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'mapping_config') THEN
    ALTER TABLE import_history ADD COLUMN mapping_config JSONB;
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'status') THEN
    ALTER TABLE import_history ADD COLUMN status TEXT DEFAULT 'processing';
  END IF;

  -- created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'created_by') THEN
    ALTER TABLE import_history ADD COLUMN created_by UUID;
  END IF;

  -- started_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'started_at') THEN
    ALTER TABLE import_history ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  -- total_rows
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'total_rows') THEN
    ALTER TABLE import_history ADD COLUMN total_rows INTEGER;
  END IF;

  -- success_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'success_count') THEN
    ALTER TABLE import_history ADD COLUMN success_count INTEGER DEFAULT 0;
  END IF;

  -- error_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'error_count') THEN
    ALTER TABLE import_history ADD COLUMN error_count INTEGER DEFAULT 0;
  END IF;

  -- skipped_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'skipped_count') THEN
    ALTER TABLE import_history ADD COLUMN skipped_count INTEGER DEFAULT 0;
  END IF;

  -- results
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'results') THEN
    ALTER TABLE import_history ADD COLUMN results JSONB;
  END IF;

  -- completed_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'completed_at') THEN
    ALTER TABLE import_history ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'created_at') THEN
    ALTER TABLE import_history ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'import_history' AND column_name = 'updated_at') THEN
    ALTER TABLE import_history ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_import_history_entity_type 
ON import_history(entity_type) 
WHERE entity_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_history_status 
ON import_history(status) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_history_created_at 
ON import_history(created_at DESC);

-- Vérifier et ajouter la colonne import_batch_id à prospects si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'prospects' AND column_name = 'import_batch_id') THEN
    ALTER TABLE prospects 
    ADD COLUMN import_batch_id UUID REFERENCES import_history(id) ON DELETE SET NULL;
    
    -- Créer l'index pour cette colonne
    CREATE INDEX IF NOT EXISTS idx_prospects_import_batch 
    ON prospects(import_batch_id) 
    WHERE import_batch_id IS NOT NULL;
    
    -- Ajouter un commentaire
    COMMENT ON COLUMN prospects.import_batch_id IS 'Référence vers l''import d''origine du prospect. Permet de regrouper les prospects par liste d''import.';
  END IF;
END $$;

-- Ajouter des commentaires pour documentation
COMMENT ON TABLE import_history IS 'Historique des imports de données (prospects, clients, etc.)';
COMMENT ON COLUMN import_history.entity_type IS 'Type d''entité importée (prospect, client, etc.)';
COMMENT ON COLUMN import_history.status IS 'Statut de l''import : processing, completed, failed';
COMMENT ON COLUMN import_history.mapping_config IS 'Configuration de mapping utilisée pour l''import';
COMMENT ON COLUMN import_history.results IS 'Résultats détaillés de l''import (erreurs, etc.)';

-- ===================================================================
-- MIGRATION DES ANCIENS PROSPECTS SANS BATCH_ID
-- ===================================================================
-- Créer des batches génériques pour les prospects existants sans import_batch_id
-- et les regrouper par période de création

DO $$ 
DECLARE
  v_batch_id UUID;
  v_prospects_count INTEGER;
  v_min_date TIMESTAMPTZ;
  v_max_date TIMESTAMPTZ;
BEGIN
  -- Compter les prospects sans batch_id
  SELECT COUNT(*), MIN(created_at), MAX(created_at)
  INTO v_prospects_count, v_min_date, v_max_date
  FROM prospects
  WHERE import_batch_id IS NULL;

  -- Si des prospects existent sans batch_id, créer un batch historique
  IF v_prospects_count > 0 THEN
    -- Créer un batch générique pour tous les anciens imports
    INSERT INTO import_history (
      entity_type,
      file_name,
      status,
      total_rows,
      success_count,
      error_count,
      skipped_count,
      started_at,
      completed_at,
      created_at,
      updated_at
    ) VALUES (
      'prospect',
      'Import historique (avant migration)',
      'completed',
      v_prospects_count,
      v_prospects_count,
      0,
      0,
      v_min_date,
      v_max_date,
      v_min_date,
      NOW()
    )
    RETURNING id INTO v_batch_id;

    -- Attribuer ce batch_id à tous les prospects sans batch
    UPDATE prospects
    SET import_batch_id = v_batch_id
    WHERE import_batch_id IS NULL;

    -- Log du résultat
    RAISE NOTICE 'Migration terminée : % prospects attribués au batch historique %', v_prospects_count, v_batch_id;
  ELSE
    RAISE NOTICE 'Aucun prospect à migrer : tous ont déjà un import_batch_id';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la migration des anciens prospects : %', SQLERRM;
    -- On continue même en cas d'erreur pour ne pas bloquer la migration
END $$;

