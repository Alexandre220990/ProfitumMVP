-- =====================================================
-- TEST COMPLET PROSPECT "Profitum SAS"
-- =====================================================
-- À exécuter dans Supabase SQL Editor pour vérifier
-- que tout fonctionne correctement après les modifications
-- =====================================================

-- 1. VÉRIFIER LE PROSPECT EXISTE
SELECT 
    c.id,
    c.company_name,
    c.name as decisionnaire,
    c.email,
    c.phone_number,
    c.siren,
    c.address,
    c.source,
    c.interest_level,
    c.timeline,
    c.apporteur_id,
    aa.first_name || ' ' || aa.last_name as apporteur_nom,
    c.created_at,
    c.updated_at
FROM "Client" c
LEFT JOIN "ApporteurAffaires" aa ON aa.id = c.apporteur_id
WHERE c.company_name = 'Profitum SAS'
ORDER BY c.created_at DESC
LIMIT 1;

-- 2. VÉRIFIER LES SIMULATIONS DU PROSPECT
SELECT 
    s.id as simulation_id,
    s.type,
    s.status,
    s.created_at,
    s.updated_at,
    jsonb_object_keys(s.answers) as nb_reponses_keys,
    s.metadata->>'apporteur_id' as apporteur_id,
    s.metadata->>'total_savings' as total_savings,
    (s.metadata->'summary'->>'highly_eligible')::int as highly_eligible,
    (s.metadata->'summary'->>'eligible')::int as eligible
FROM "simulations" s
LEFT JOIN "Client" c ON c.id = s.client_id
WHERE c.company_name = 'Profitum SAS'
ORDER BY s.created_at DESC;

-- 3. ✅ VÉRIFIER LES PRODUITS ÉLIGIBLES AVEC EXPERTS
-- TEST PRINCIPAL : Vérifier expert_id
SELECT 
    cpe.id as cpe_id,
    pe.nom as produit,
    cpe.statut,
    cpe."montantFinal" as montant,
    cpe.expert_id,
    CASE 
        WHEN cpe.expert_id IS NULL THEN '❌ AUCUN EXPERT'
        ELSE '✅ Expert assigné'
    END as statut_expert,
    COALESCE(
        NULLIF(e.first_name || ' ' || e.last_name, ' '),
        e.name,
        'Expert'
    ) as expert_nom,
    e.company_name as expert_entreprise,
    e.email as expert_email,
    e.specializations as expert_specializations,
    e.rating as expert_rating,
    cpe.metadata->>'source' as source_creation,
    cpe.metadata->>'expert_validated_by_client' as validation_client,
    cpe.metadata->>'expert_selected_by_client' as choix_client,
    cpe.created_at
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE c.company_name = 'Profitum SAS'
ORDER BY cpe.created_at DESC;

-- 4. STATISTIQUES DU PROSPECT
SELECT 
    COUNT(*) as total_produits_eligibles,
    COUNT(cpe.expert_id) as produits_avec_expert,
    COUNT(*) - COUNT(cpe.expert_id) as produits_sans_expert,
    SUM(cpe."montantFinal") as total_economies_estimees,
    array_agg(pe.nom) FILTER (WHERE cpe.expert_id IS NULL) as produits_sans_expert_liste,
    array_agg(
        COALESCE(
            NULLIF(e.first_name || ' ' || e.last_name, ' '),
            e.name,
            'Expert'
        )
    ) FILTER (WHERE cpe.expert_id IS NOT NULL) as experts_assignes
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE c.company_name = 'Profitum SAS';

-- 5. VÉRIFIER LES RDV DU PROSPECT
SELECT 
    r.id as rdv_id,
    r.meeting_type,
    r.scheduled_date,
    r.scheduled_time,
    r.location,
    r.status,
    COALESCE(
        NULLIF(e.first_name || ' ' || e.last_name, ' '),
        e.name,
        'Expert'
    ) as expert_rdv,
    aa.first_name || ' ' || aa.last_name as apporteur,
    r.created_at
FROM "RDV" r
LEFT JOIN "Client" c ON c.id = r.client_id
LEFT JOIN "Expert" e ON e.id = r.expert_id
LEFT JOIN "ApporteurAffaires" aa ON aa.id = r.apporteur_id
WHERE c.company_name = 'Profitum SAS'
ORDER BY r.created_at DESC;

-- 6. DÉTAILS COMPLETS (TOUT EN UNE REQUÊTE)
SELECT 
    '=== CLIENT ===' as section,
    c.company_name,
    c.name as decisionnaire,
    c.email,
    c.source,
    '=== SIMULATION ===' as simulation,
    s.status as sim_status,
    (s.metadata->'summary'->>'eligible')::int as produits_eligible,
    s.metadata->>'total_savings' as economies_totales,
    '=== PRODUITS ===' as produits,
    COUNT(cpe.id) as nb_produits,
    COUNT(cpe.expert_id) as nb_avec_expert,
    '=== RDV ===' as rdv,
    COUNT(r.id) as nb_rdv
FROM "Client" c
LEFT JOIN "simulations" s ON s.client_id = c.id AND s.type = 'apporteur_prospect'
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
LEFT JOIN "RDV" r ON r.client_id = c.id
WHERE c.company_name = 'Profitum SAS'
GROUP BY c.id, c.company_name, c.name, c.email, c.source, s.status, s.metadata;

-- =====================================================
-- RÉSULTATS ATTENDUS
-- =====================================================
-- 
-- ✅ Section 1 : Prospect existe avec source='apporteur'
-- ✅ Section 2 : Simulation(s) avec status='completed'
-- ✅ Section 3 : CPE avec expert_id NON NULL (après assignation apporteur)
-- ✅ Section 4 : Au moins 1 produit avec expert
-- ✅ Section 5 : RDV optionnels (peut être 0)
-- ✅ Section 6 : Résumé complet
--
-- ⚠️ Si expert_id = NULL partout : L'apporteur n'a pas sélectionné d'expert
-- ⚠️ Si produits_sans_expert > 0 : Normal, le client peut choisir
--
-- =====================================================

