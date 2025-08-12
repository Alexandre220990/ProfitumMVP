-- =====================================================
-- ANALYSE DU SYSTÈME DE SÉLECTION D'EXPERT
-- =====================================================

-- 1. Vérifier la structure de la table Expert
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Expert'
ORDER BY ordinal_position;

-- 2. Vérifier la structure de la table expertassignment
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expertassignment'
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table DossierStep
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'DossierStep'
ORDER BY ordinal_position;

-- 4. Analyser les experts disponibles
SELECT 
    id,
    name,
    email,
    company_name,
    specializations,
    experience,
    location,
    rating,
    compensation,
    status,
    disponibilites,
    created_at
FROM "Expert"
WHERE status = 'active'
ORDER BY rating DESC, experience DESC;

-- 5. Compter les experts par spécialisation
SELECT 
    unnest(specializations) as specialisation,
    COUNT(*) as nombre_experts,
    AVG(rating) as note_moyenne
FROM "Expert"
WHERE status = 'active'
GROUP BY unnest(specializations)
ORDER BY nombre_experts DESC;

-- 6. Analyser les assignations d'experts existantes
SELECT 
    ea.id,
    ea.expert_id,
    e.name as expert_name,
    ea.client_id,
    ea.client_produit_eligible_id,
    ea.statut,
    ea.assignment_date,
    ea.notes,
    cpe.statut as statut_dossier,
    pe.nom as produit_nom
FROM "expertassignment" ea
JOIN "Expert" e ON ea.expert_id = e.id
JOIN "ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
ORDER BY ea.assignment_date DESC;

-- 7. Analyser les étapes de sélection d'expert
SELECT 
    ds.id,
    ds.dossier_id,
    ds.step_name,
    ds.status,
    ds.progress,
    ds.assignee_id,
    ds.assignee_name,
    ds.assignee_type,
    ds.created_at,
    ds.updated_at,
    cpe.statut as statut_dossier,
    pe.nom as produit_nom
FROM "DossierStep" ds
JOIN "ClientProduitEligible" cpe ON ds.dossier_id = cpe.id
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE ds.step_name ILIKE '%expert%'
   OR ds.assignee_type = 'expert'
ORDER BY ds.created_at DESC;

-- 8. Vérifier les dossiers avec expert assigné
SELECT 
    cpe.id as dossier_id,
    cpe."clientId",
    cpe.expert_id,
    e.name as expert_name,
    e.email as expert_email,
    cpe.statut,
    cpe.current_step,
    cpe.progress,
    pe.nom as produit_nom,
    cpe.created_at
FROM "ClientProduitEligible" cpe
LEFT JOIN "Expert" e ON cpe.expert_id = e.id
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE cpe.expert_id IS NOT NULL
ORDER BY cpe.created_at DESC;

-- 9. Vérifier les dossiers sans expert assigné
SELECT 
    cpe.id as dossier_id,
    cpe."clientId",
    cpe.statut,
    cpe.current_step,
    cpe.progress,
    pe.nom as produit_nom,
    cpe.created_at
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE cpe.expert_id IS NULL
  AND cpe.statut IN ('eligible', 'en_cours')
ORDER BY cpe.created_at DESC;

-- 10. Statistiques des assignations par expert
SELECT 
    e.id,
    e.name,
    e.email,
    e.company_name,
    COUNT(ea.id) as total_assignations,
    COUNT(CASE WHEN ea.statut = 'completed' THEN 1 END) as assignations_terminees,
    COUNT(CASE WHEN ea.statut = 'pending' THEN 1 END) as assignations_en_cours,
    AVG(e.rating) as note_moyenne,
    e.experience,
    e.status
FROM "Expert" e
LEFT JOIN "expertassignment" ea ON e.id = ea.expert_id
WHERE e.status = 'active'
GROUP BY e.id, e.name, e.email, e.company_name, e.experience, e.status
ORDER BY total_assignations DESC;

-- 11. Analyser les experts par produit
SELECT 
    pe.nom as produit,
    COUNT(DISTINCT ea.expert_id) as nombre_experts_assignes,
    COUNT(ea.id) as nombre_assignations,
    AVG(e.rating) as note_moyenne_experts
FROM "ProduitEligible" pe
LEFT JOIN "ClientProduitEligible" cpe ON pe.id = cpe."produitId"
LEFT JOIN "expertassignment" ea ON cpe.id = ea.client_produit_eligible_id
LEFT JOIN "Expert" e ON ea.expert_id = e.id
WHERE pe.nom IS NOT NULL
GROUP BY pe.nom
ORDER BY nombre_assignations DESC;

-- 12. Vérifier les experts disponibles pour TICPE
SELECT 
    e.id,
    e.name,
    e.email,
    e.company_name,
    e.specializations,
    e.experience,
    e.rating,
    e.compensation,
    e.status,
    e.disponibilites,
    COUNT(ea.id) as assignations_actuelles
FROM "Expert" e
LEFT JOIN "expertassignment" ea ON e.id = ea.expert_id 
    AND ea.statut IN ('pending', 'in_progress')
WHERE e.status = 'active'
  AND (
    e.specializations @> '["TICPE"]'::jsonb
    OR e.specializations @> '["transport"]'::jsonb
    OR e.specializations @> '["carburant"]'::jsonb
    OR e.specializations @> '["véhicule"]'::jsonb
  )
GROUP BY e.id, e.name, e.email, e.company_name, e.specializations, e.experience, e.rating, e.compensation, e.status, e.disponibilites
ORDER BY e.rating DESC;

-- =====================================================
-- VALEURS ATTENDUES SELON LE CODE
-- =====================================================

-- Statuts d'experts attendus
SELECT 'active' as status_attendu
UNION ALL
SELECT 'inactive' as status_attendu
UNION ALL
SELECT 'pending' as status_attendu;

-- Statuts d'assignation attendus
SELECT 'pending' as assignment_status_attendu
UNION ALL
SELECT 'in_progress' as assignment_status_attendu
UNION ALL
SELECT 'completed' as assignment_status_attendu
UNION ALL
SELECT 'cancelled' as assignment_status_attendu;

-- Statuts de dossier pour sélection d'expert
SELECT 'eligible' as dossier_status_attendu
UNION ALL
SELECT 'en_cours' as dossier_status_attendu;

-- Types d'assignee attendus
SELECT 'expert' as assignee_type_attendu;

-- =====================================================
-- REQUÊTES DE DIAGNOSTIC
-- =====================================================

-- Vérifier si les experts TICPE existent
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Experts TICPE disponibles: ' || COUNT(*)
        ELSE '❌ Aucun expert TICPE trouvé'
    END as statut_experts_ticpe
FROM "Expert" e
WHERE e.status = 'active'
  AND (
    e.specializations @> '["TICPE"]'::jsonb
    OR e.specializations @> '["transport"]'::jsonb
    OR e.specializations @> '["carburant"]'::jsonb
    OR e.specializations @> '["véhicule"]'::jsonb
  );

-- Vérifier la structure des colonnes importantes Expert
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('id', 'name', 'email', 'company_name', 'specializations', 'experience', 'rating', 'status', 'disponibilites') 
        THEN '✅ Colonne présente'
        ELSE '⚠️ Colonne manquante ou différente'
    END as statut_colonne
FROM information_schema.columns 
WHERE table_name = 'Expert'
AND column_name IN ('id', 'name', 'email', 'company_name', 'specializations', 'experience', 'rating', 'status', 'disponibilites', 'compensation');

-- Vérifier la structure des colonnes importantes expertassignment
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('id', 'expert_id', 'client_id', 'client_produit_eligible_id', 'statut', 'assignment_date') 
        THEN '✅ Colonne présente'
        ELSE '⚠️ Colonne manquante ou différente'
    END as statut_colonne
FROM information_schema.columns 
WHERE table_name = 'expertassignment'
AND column_name IN ('id', 'expert_id', 'client_id', 'client_produit_eligible_id', 'statut', 'assignment_date', 'notes');

-- Vérifier la structure des colonnes importantes DossierStep
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('id', 'dossier_id', 'step_name', 'status', 'progress', 'assignee_id', 'assignee_name', 'assignee_type') 
        THEN '✅ Colonne présente'
        ELSE '⚠️ Colonne manquante ou différente'
    END as statut_colonne
FROM information_schema.columns 
WHERE table_name = 'DossierStep'
AND column_name IN ('id', 'dossier_id', 'step_name', 'status', 'progress', 'assignee_id', 'assignee_name', 'assignee_type');

-- Résumé global du système d'experts
SELECT 
    'SYSTÈME EXPERTS' as systeme,
    COUNT(DISTINCT e.id) as nombre_experts,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as experts_actifs,
    COUNT(DISTINCT ea.id) as nombre_assignations,
    COUNT(DISTINCT ea.client_produit_eligible_id) as dossiers_avec_expert,
    COUNT(DISTINCT ds.id) as etapes_expert_crees
FROM "Expert" e
LEFT JOIN "expertassignment" ea ON e.id = ea.expert_id
LEFT JOIN "DossierStep" ds ON ds.assignee_type = 'expert';
