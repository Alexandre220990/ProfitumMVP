-- Migration pour créer la table documentation_items
-- Date: 2025-01-03

-- Création de la table documentation_items
CREATE TABLE IF NOT EXISTS public.documentation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.documentation_categories(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    meta_description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    author_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documentation_items_category_id ON public.documentation_items(category_id);
CREATE INDEX IF NOT EXISTS idx_documentation_items_slug ON public.documentation_items(slug);
CREATE INDEX IF NOT EXISTS idx_documentation_items_published ON public.documentation_items(is_published);
CREATE INDEX IF NOT EXISTS idx_documentation_items_featured ON public.documentation_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_documentation_items_tags ON public.documentation_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documentation_items_created_at ON public.documentation_items(created_at);

-- Politique RLS
ALTER TABLE public.documentation_items ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les articles publiés
CREATE POLICY "Anyone can view published documentation" ON public.documentation_items
    FOR SELECT USING (is_published = true);

-- Lecture complète pour les admins
CREATE POLICY "Admins can view all documentation" ON public.documentation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Gestion complète pour les admins
CREATE POLICY "Only admins can manage documentation" ON public.documentation_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_documentation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documentation_items_updated_at
    BEFORE UPDATE ON public.documentation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_documentation_items_updated_at();

-- Commentaire sur la table
COMMENT ON TABLE public.documentation_items IS 'Articles et éléments de documentation'; 