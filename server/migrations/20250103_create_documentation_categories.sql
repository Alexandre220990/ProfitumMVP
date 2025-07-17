-- Migration pour créer la table documentation_categories
-- Date: 2025-01-03

-- Création de la table documentation_categories
CREATE TABLE IF NOT EXISTS public.documentation_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documentation_categories_name ON public.documentation_categories(name);
CREATE INDEX IF NOT EXISTS idx_documentation_categories_sort_order ON public.documentation_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_documentation_categories_active ON public.documentation_categories(is_active);

-- Politique RLS - lecture publique, écriture admin seulement
ALTER TABLE public.documentation_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view documentation categories" ON public.documentation_categories
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage documentation categories" ON public.documentation_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Insertion des catégories de base
INSERT INTO public.documentation_categories (name, description, icon, color, sort_order) VALUES
('Fonctionnalités application', 'Guide des fonctionnalités principales de l''application', 'app', '#3B82F6', 1),
('Guide utilisateur', 'Tutoriels et guides d''utilisation', 'book', '#10B981', 2),
('Support technique', 'Aide technique et résolution de problèmes', 'tool', '#F59E0B', 3),
('Sécurité', 'Informations sur la sécurité et la confidentialité', 'shield', '#EF4444', 4),
('API', 'Documentation technique de l''API', 'code', '#8B5CF6', 5)
ON CONFLICT (name) DO NOTHING;

-- Commentaire sur la table
COMMENT ON TABLE public.documentation_categories IS 'Catégories pour organiser la documentation'; 