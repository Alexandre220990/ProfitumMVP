-- ============================================================================
-- CORRECTION DE L'ERREUR ON CONFLICT - document_sections
-- ============================================================================

-- 1. Ajouter la contrainte UNIQUE manquante sur la colonne name
ALTER TABLE public.document_sections 
ADD CONSTRAINT document_sections_name_unique UNIQUE (name);

-- 2. Ajouter la colonne display_name manquante
ALTER TABLE public.document_sections 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- 3. Ajouter les autres colonnes manquantes si elles n'existent pas
ALTER TABLE public.document_sections 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.document_sections 
ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

ALTER TABLE public.document_sections 
ADD COLUMN IF NOT EXISTS color VARCHAR(7);

ALTER TABLE public.document_sections 
ADD COLUMN IF NOT EXISTS order_index INTEGER;

ALTER TABLE public.document_sections 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Vérifier que la contrainte a été ajoutée
SELECT 
    'CONSTRAINT_CHECK' as check_type,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND table_name = 'document_sections'
    AND constraint_type = 'UNIQUE';

-- 5. Vérifier la structure de la table
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

-- 6. Réinsérer les sections par défaut avec ON CONFLICT
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

-- 7. Vérifier l'insertion
SELECT 
    'INSERTION_CHECK' as check_type,
    name,
    display_name,
    is_active,
    created_at
FROM public.document_sections
ORDER BY order_index;

-- 8. Vérifier la structure finale de la table
SELECT 
    'FINAL_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'document_sections'
ORDER BY ordinal_position;
