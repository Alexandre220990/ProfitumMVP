-- Migration pour ajouter les colonnes manquantes au dashboard expert
-- Date: 2025-01-03

-- Ajouter la colonne progress à expertassignment si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'expertassignment' AND column_name = 'progress') THEN
        ALTER TABLE expertassignment ADD COLUMN progress INTEGER DEFAULT 0;
    END IF;
END $$;

-- Ajouter la colonne documents à expertassignment si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'expertassignment' AND column_name = 'documents') THEN
        ALTER TABLE expertassignment ADD COLUMN documents JSONB;
    END IF;
END $$;

-- Ajouter la colonne rejection_reason à expertassignment si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'expertassignment' AND column_name = 'rejection_reason') THEN
        ALTER TABLE expertassignment ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Ajouter la colonne rejected_at à expertassignment si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'expertassignment' AND column_name = 'rejected_at') THEN
        ALTER TABLE expertassignment ADD COLUMN rejected_at TIMESTAMPTZ;
    END IF;
END $$;

-- Mettre à jour les contraintes de statut pour inclure les nouveaux statuts
ALTER TABLE expertassignment 
DROP CONSTRAINT IF EXISTS expertassignment_status_check;

ALTER TABLE expertassignment 
ADD CONSTRAINT expertassignment_status_check 
CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'));

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_expertassignment_expert_id_status 
ON expertassignment(expert_id, status);

CREATE INDEX IF NOT EXISTS idx_expertassignment_assignment_date 
ON expertassignment(assignment_date DESC);

-- Créer un index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notification_final_user_id_type 
ON notification_final(user_id, user_type);

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN expertassignment.progress IS 'Progression de l''assignation en pourcentage (0-100)';
COMMENT ON COLUMN expertassignment.documents IS 'Documents associés à l''assignation au format JSONB';
COMMENT ON COLUMN expertassignment.rejection_reason IS 'Raison du rejet de l''assignation';
COMMENT ON COLUMN expertassignment.rejected_at IS 'Date de rejet de l''assignation'; 