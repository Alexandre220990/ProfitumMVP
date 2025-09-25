-- ============================================================================
-- VÉRIFICATION DES CONTRAINTES DE LA TABLE DOSSIERSTEP
-- ============================================================================

-- 1. Vérifier les contraintes de la table DossierStep
SELECT 
    'DOSSIER_STEP_CONSTRAINTS' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = '"DossierStep"'::regclass
ORDER BY conname;

-- 2. Vérifier les valeurs autorisées pour step_type
SELECT 
    'STEP_TYPE_VALUES' as check_type,
    'Vérifier les valeurs autorisées dans la contrainte step_type_check' as info;

-- 3. Vérifier les valeurs autorisées pour status
SELECT 
    'STATUS_VALUES' as check_type,
    'Vérifier les valeurs autorisées dans la contrainte status_check' as info;

-- 4. Vérifier les valeurs autorisées pour priority
SELECT 
    'PRIORITY_VALUES' as check_type,
    'Vérifier les valeurs autorisées dans la contrainte priority_check' as info;

-- 5. Vérifier les valeurs autorisées pour assignee_type
SELECT 
    'ASSIGNEE_TYPE_VALUES' as check_type,
    'Vérifier les valeurs autorisées dans la contrainte assignee_type_check' as info;
