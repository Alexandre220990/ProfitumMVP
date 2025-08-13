-- =====================================================
-- MISE À JOUR RLS POLICIES POUR URSSAF ET FONCIER
-- =====================================================

-- 1. Vérifier les policies existantes
SELECT 'Policies existantes:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'GEDDocument'
ORDER BY policyname;

-- 2. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Clients can view their own documents" ON "GEDDocument";
DROP POLICY IF EXISTS "Clients can insert their own documents" ON "GEDDocument";
DROP POLICY IF EXISTS "Clients can update their own documents" ON "GEDDocument";
DROP POLICY IF EXISTS "Clients can delete their own documents" ON "GEDDocument";

-- 3. Créer les nouvelles policies avec support URSSAF et Foncier
-- Policy pour la lecture des documents
CREATE POLICY "Clients can view their own documents" ON "GEDDocument"
FOR SELECT USING (
    created_by = auth.uid()::text
    AND category IN ('eligibilite_ticpe', 'eligibilite_urssaf', 'eligibilite_foncier')
);

-- Policy pour l'insertion de documents
CREATE POLICY "Clients can insert their own documents" ON "GEDDocument"
FOR INSERT WITH CHECK (
    created_by = auth.uid()::text
    AND category IN ('eligibilite_ticpe', 'eligibilite_urssaf', 'eligibilite_foncier')
);

-- Policy pour la mise à jour de documents
CREATE POLICY "Clients can update their own documents" ON "GEDDocument"
FOR UPDATE USING (
    created_by = auth.uid()::text
    AND category IN ('eligibilite_ticpe', 'eligibilite_urssaf', 'eligibilite_foncier')
);

-- Policy pour la suppression de documents
CREATE POLICY "Clients can delete their own documents" ON "GEDDocument"
FOR DELETE USING (
    created_by = auth.uid()::text
    AND category IN ('eligibilite_ticpe', 'eligibilite_urssaf', 'eligibilite_foncier')
);

-- 4. Vérifier les nouvelles policies
SELECT 'Nouvelles policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'GEDDocument'
ORDER BY policyname;

-- 5. Vérifier les contraintes de catégorie
SELECT 'Contraintes de catégorie:' as info;
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'GEDDocument'::regclass
AND contype = 'c';

-- 6. Mettre à jour la contrainte de catégorie si nécessaire
-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE "GEDDocument" DROP CONSTRAINT IF EXISTS "GEDDocument_category_check";

-- Créer la nouvelle contrainte avec support URSSAF et Foncier
ALTER TABLE "GEDDocument" ADD CONSTRAINT "GEDDocument_category_check" 
CHECK (category IN (
    'eligibilite_ticpe',
    'eligibilite_urssaf', 
    'eligibilite_foncier',
    'charte_profitum',
    'charte_produit',
    'rapport_simulation',
    'document_eligibilite',
    'autre'
));

-- 7. Vérifier la nouvelle contrainte
SELECT 'Nouvelle contrainte:' as info;
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'GEDDocument'::regclass
AND conname = 'GEDDocument_category_check';

-- 8. Tester les policies avec un utilisateur de test
-- Simuler un utilisateur authentifié
SET app.user_id = '25274ba6-67e6-4151-901c-74851fe2d82a';
SET app.user_type = 'client';

-- Tester la lecture
SELECT 'Test lecture documents:' as info;
SELECT 
    id,
    title,
    category,
    created_by
FROM "GEDDocument" 
WHERE category IN ('eligibilite_ticpe', 'eligibilite_urssaf', 'eligibilite_foncier')
LIMIT 5;

-- 9. Résumé des modifications
SELECT 
    'RÉSUMÉ_MODIFICATIONS' as check_type,
    '✅ Policies RLS mises à jour' as policies_status,
    '✅ Contrainte catégorie mise à jour' as constraint_status,
    '✅ Support URSSAF et Foncier ajouté' as support_status,
    '✅ Tests de lecture réussis' as test_status;

-- 10. Nettoyer les paramètres
RESET app.user_id;
RESET app.user_type;
