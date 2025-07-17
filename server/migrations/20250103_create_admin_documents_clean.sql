-- Migration pour créer la table admin_documents
-- Date: 2025-01-03
-- Version: 1.0

-- Créer la table admin_documents
CREATE TABLE IF NOT EXISTS public.admin_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    author VARCHAR(100) DEFAULT 'Admin',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_admin_documents_category ON public.admin_documents(category);
CREATE INDEX IF NOT EXISTS idx_admin_documents_status ON public.admin_documents(status);
CREATE INDEX IF NOT EXISTS idx_admin_documents_created_at ON public.admin_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_documents_title ON public.admin_documents USING gin(to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS idx_admin_documents_content ON public.admin_documents USING gin(to_tsvector('french', content));

-- Activer RLS
ALTER TABLE public.admin_documents ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Enable read access for authenticated users" ON public.admin_documents
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.admin_documents
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.admin_documents
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.admin_documents
FOR DELETE USING (auth.role() = 'authenticated');

-- Créer une vue pour les documents publiés
CREATE OR REPLACE VIEW public.v_admin_documents_published AS
SELECT 
    id,
    title,
    category,
    content,
    version,
    author,
    created_at,
    updated_at
FROM public.admin_documents
WHERE status = 'published'
ORDER BY created_at DESC;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table admin_documents créée avec succès !';
    RAISE NOTICE 'Vue v_admin_documents_published créée';
    RAISE NOTICE 'RLS activé avec politiques';
    RAISE NOTICE 'Index de performance créés';
END $$; 