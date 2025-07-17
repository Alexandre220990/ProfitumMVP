-- Migration simplifiée pour corriger les problèmes de schéma
-- Date: 2025-01-03
-- Version: Simplifiée pour application rapide

-- 1. Ajouter les colonnes manquantes à expertassignment
ALTER TABLE public.expertassignment 
ADD COLUMN IF NOT EXISTS client_produit_eligible_id UUID;

ALTER TABLE public.expertassignment 
ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'pending' CHECK (statut IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));

-- 2. Ajouter les colonnes manquantes à ProduitEligible
ALTER TABLE public."ProduitEligible" 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general';

ALTER TABLE public."ProduitEligible" 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 3. Ajouter la colonne manquante à message
ALTER TABLE public.message 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Créer la contrainte de clé étrangère (seulement si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expertassignment_client_produit_eligible_fkey'
    ) THEN
        ALTER TABLE public.expertassignment 
        ADD CONSTRAINT expertassignment_client_produit_eligible_fkey 
        FOREIGN KEY (client_produit_eligible_id) 
        REFERENCES public."ClientProduitEligible"(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Activer RLS sur les tables critiques
ALTER TABLE public.expertassignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

-- 6. Créer les politiques RLS de base
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expertassignment' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.expertassignment
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'message' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.message
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notification' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.notification
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 7. Créer les index essentiels
CREATE INDEX IF NOT EXISTS idx_expertassignment_statut ON public.expertassignment(statut);
CREATE INDEX IF NOT EXISTS idx_expertassignment_client_produit_eligible_id ON public.expertassignment(client_produit_eligible_id);
CREATE INDEX IF NOT EXISTS idx_produiteligible_category ON public."ProduitEligible"(category);
CREATE INDEX IF NOT EXISTS idx_produiteligible_active ON public."ProduitEligible"(active);
CREATE INDEX IF NOT EXISTS idx_message_timestamp ON public.message(timestamp);

-- 8. Mettre à jour les données existantes
UPDATE public."ProduitEligible" 
SET 
    category = CASE 
        WHEN LOWER(nom) LIKE '%ticpe%' THEN 'ticpe'
        WHEN LOWER(nom) LIKE '%cee%' THEN 'cee'
        WHEN LOWER(nom) LIKE '%audit%' THEN 'audit'
        ELSE 'general'
    END,
    active = true
WHERE category IS NULL OR active IS NULL;

UPDATE public.expertassignment 
SET statut = 'pending' 
WHERE statut IS NULL;

UPDATE public.message 
SET timestamp = created_at 
WHERE timestamp IS NULL AND created_at IS NOT NULL;

-- 9. Créer la vue principale pour les assignations
CREATE OR REPLACE VIEW public.v_expert_assignments AS
SELECT 
    ea.id,
    ea.expert_id,
    ea.client_produit_eligible_id,
    ea.statut,
    ea.created_at,
    ea.updated_at,
    cpe.client_id,
    cpe.produit_eligible_id,
    c.company_name as client_name,
    pe.nom as produit_nom,
    pe.category as produit_category,
    e.first_name as expert_first_name,
    e.last_name as expert_last_name,
    e.email as expert_email
FROM public.expertassignment ea
LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
LEFT JOIN public.client c ON cpe.client_id = c.id
LEFT JOIN public."ProduitEligible" pe ON cpe.produit_eligible_id = pe.id
LEFT JOIN public.expert e ON ea.expert_id = e.id
WHERE pe.active = true;

-- 10. Créer la fonction de statistiques
CREATE OR REPLACE FUNCTION public.get_assignment_statistics()
RETURNS TABLE (
    statut VARCHAR(50),
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            statut,
            COUNT(*) as count,
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
        FROM public.expertassignment
        GROUP BY statut
    )
    SELECT 
        statut,
        count,
        ROUND(percentage, 2) as percentage
    FROM stats
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Finaliser avec des optimisations
ANALYZE public.expertassignment;
ANALYZE public."ProduitEligible";
ANALYZE public.message;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration simplifiée appliquée avec succès !';
    RAISE NOTICE 'Colonnes ajoutées: client_produit_eligible_id, statut, category, active, timestamp';
    RAISE NOTICE 'RLS activé sur: expertassignment, message, notification';
    RAISE NOTICE 'Index créés pour optimiser les performances';
    RAISE NOTICE 'Vue v_expert_assignments créée';
    RAISE NOTICE 'Fonction get_assignment_statistics créée';
END $$; 