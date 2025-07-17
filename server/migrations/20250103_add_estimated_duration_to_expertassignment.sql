-- Migration pour ajouter la colonne estimated_duration_days à ExpertAssignment
-- Date: 2025-01-03

-- Ajouter la colonne estimated_duration_days si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertAssignment' 
        AND column_name = 'estimated_duration_days'
    ) THEN
        ALTER TABLE public.ExpertAssignment 
        ADD COLUMN estimated_duration_days INTEGER;
        
        -- Ajouter un commentaire
        COMMENT ON COLUMN public.ExpertAssignment.estimated_duration_days 
        IS 'Durée estimée de la mission en jours';
    END IF;
END $$;

-- Ajouter la colonne actual_duration_days si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertAssignment' 
        AND column_name = 'actual_duration_days'
    ) THEN
        ALTER TABLE public.ExpertAssignment 
        ADD COLUMN actual_duration_days INTEGER;
        
        -- Ajouter un commentaire
        COMMENT ON COLUMN public.ExpertAssignment.actual_duration_days 
        IS 'Durée réelle de la mission en jours';
    END IF;
END $$;

-- Ajouter la colonne priority si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertAssignment' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.ExpertAssignment 
        ADD COLUMN priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
        
        -- Ajouter un commentaire
        COMMENT ON COLUMN public.ExpertAssignment.priority 
        IS 'Priorité de la mission';
    END IF;
END $$;

-- Ajouter la colonne compensation_percentage si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertAssignment' 
        AND column_name = 'compensation_percentage'
    ) THEN
        ALTER TABLE public.ExpertAssignment 
        ADD COLUMN compensation_percentage DECIMAL(5,2);
        
        -- Ajouter un commentaire
        COMMENT ON COLUMN public.ExpertAssignment.compensation_percentage 
        IS 'Pourcentage de compensation de l''expert';
    END IF;
END $$;

-- Créer des index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_expert_assignment_estimated_duration ON public.ExpertAssignment(estimated_duration_days);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_priority ON public.ExpertAssignment(priority);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_compensation_percentage ON public.ExpertAssignment(compensation_percentage);

-- Mettre à jour les assignations existantes avec des valeurs par défaut
UPDATE public.ExpertAssignment 
SET 
    estimated_duration_days = 30,
    priority = 'normal',
    compensation_percentage = 15.0
WHERE estimated_duration_days IS NULL;

-- Commentaire sur la migration
COMMENT ON TABLE public.ExpertAssignment IS 'Assignations d''experts aux clients pour la marketplace - Version complète avec durée estimée et priorité'; 