-- ============================================================================
-- SCRIPT DE TEST ET CORRECTION - document_sections
-- ============================================================================

-- 1. Vérifier si la table existe
SELECT 
    'TABLE_EXISTS' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'document_sections';

-- 2. Vérifier la structure de la table
SELECT 
    'STRUCTURE_CHECK' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'document_sections'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes
SELECT 
    'CONSTRAINTS_CHECK' as check_type,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND table_name = 'document_sections';

-- 4. Vérifier les données existantes
SELECT 
    'DATA_CHECK' as check_type,
    id,
    name,
    display_name,
    description,
    icon,
    color,
    order_index,
    is_active,
    created_at,
    updated_at
FROM public.document_sections
ORDER BY order_index;

-- 5. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.document_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Ajouter la contrainte UNIQUE si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'document_sections_name_unique' 
        AND table_name = 'document_sections'
    ) THEN
        ALTER TABLE public.document_sections 
        ADD CONSTRAINT document_sections_name_unique UNIQUE (name);
    END IF;
END $$;

-- 7. Insérer les sections par défaut avec ON CONFLICT
INSERT INTO public.document_sections (name, display_name, description, icon, color, order_index, is_active, created_at, updated_at)
VALUES 
    ('formation', 'Formation', 'Documents de formation et guides d''utilisation', 'graduation-cap', '#3B82F6', 1, true, NOW(), NOW()),
    ('mes_documents', 'Mes documents', 'Documents personnels et privés', 'folder', '#10B981', 2, true, NOW(), NOW()),
    ('mes_rapports', 'Mes rapports', 'Rapports d''audit et analyses', 'file-text', '#F59E0B', 3, true, NOW(), NOW()),
    ('mes_factures', 'Mes factures', 'Factures et documents comptables', 'receipt', '#EF4444', 4, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 8. Vérifier le résultat final
SELECT 
    'FINAL_CHECK' as check_type,
    name,
    display_name,
    is_active,
    created_at,
    updated_at
FROM public.document_sections
ORDER BY order_index;

-- 9. Vérifier les politiques RLS
SELECT 
    'RLS_CHECK' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'document_sections';

-- 10. Activer RLS si nécessaire
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;

-- 11. Créer les politiques RLS si elles n'existent pas
DO $$
BEGIN
    -- Politique de lecture pour tous les utilisateurs authentifiés
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_sections' 
        AND policyname = 'document_sections_read_policy'
    ) THEN
        CREATE POLICY "document_sections_read_policy" ON public.document_sections
        FOR SELECT USING (auth.role() IS NOT NULL);
    END IF;
    
    -- Politique d'écriture pour les admins uniquement
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_sections' 
        AND policyname = 'document_sections_write_policy'
    ) THEN
        CREATE POLICY "document_sections_write_policy" ON public.document_sections
        FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;
END $$;

-- 12. Vérification finale complète
SELECT 
    'COMPLETE_CHECK' as check_type,
    'document_sections' as table_name,
    COUNT(*) as total_sections,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_sections,
    MIN(created_at) as oldest_record,
    MAX(updated_at) as latest_update
FROM public.document_sections;
