-- =====================================================
-- SCRIPT DE VÉRIFICATION - FORMULAIRE PROSPECTS APPORTEUR
-- =====================================================
-- À exécuter après une simulation pour vérifier que tout fonctionne
-- =====================================================

-- 1. VÉRIFIER LES DERNIERS PROSPECTS CRÉÉS
-- Voir les 5 derniers prospects avec leur apporteur
SELECT 
    c.id,
    c.company_name,
    c.name as decisionnaire,
    c.email,
    c.source,
    c.interest_level,
    c.timeline,
    c.apporteur_id,
    aa.first_name || ' ' || aa.last_name as apporteur_name,
    c.created_at
FROM "Client" c
LEFT JOIN "ApporteurAffaires" aa ON aa.id = c.apporteur_id
WHERE c.source = 'apporteur'
ORDER BY c.created_at DESC
LIMIT 5;

-- 2. VÉRIFIER LES SIMULATIONS CRÉÉES
-- Voir les dernières simulations avec leur statut
SELECT 
    s.id as simulation_id,
    s.client_id,
    c.company_name,
    s.type,
    s.status,
    s.created_at,
    s.updated_at,
    jsonb_object_keys(s.answers) as questions_count,
    (s.metadata->>'total_savings')::numeric as total_savings,
    (s.metadata->>'expert_optimization'->'recommended_meetings')::int as rdv_recommandes
FROM "simulations" s
LEFT JOIN "Client" c ON c.id = s.client_id
WHERE s.type = 'apporteur_prospect'
ORDER BY s.created_at DESC
LIMIT 5;

-- 3. ✅ VÉRIFIER LES PRODUITS ÉLIGIBLES AVEC EXPERTS ASSIGNÉS
-- C'est le test crucial : les experts doivent être assignés !
SELECT 
    cpe.id as cpe_id,
    cpe."clientId",
    c.company_name,
    pe.nom as produit,
    cpe.statut,
    cpe."montantFinal",
    cpe.priorite,
    cpe.expert_id,
    COALESCE(
        NULLIF(e.first_name || ' ' || e.last_name, ' '),
        e.name,
        'Expert'
    ) as expert_assigne,
    e.company_name as entreprise_expert,
    e.specializations,
    cpe.created_at
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE c.source = 'apporteur'
  AND cpe.statut IN ('eligible', 'to_confirm')
ORDER BY cpe.created_at DESC
LIMIT 10;

-- 4. STATISTIQUES PAR PROSPECT
-- Voir combien de produits éligibles et combien ont un expert assigné
SELECT 
    c.company_name,
    c.name as decisionnaire,
    COUNT(cpe.id) as total_produits_eligibles,
    COUNT(cpe.expert_id) as produits_avec_expert,
    COUNT(cpe.id) - COUNT(cpe.expert_id) as produits_sans_expert,
    SUM(cpe."montantFinal") as total_economies,
    c.created_at
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE c.source = 'apporteur'
GROUP BY c.id, c.company_name, c.name, c.created_at
ORDER BY c.created_at DESC
LIMIT 5;

-- 5. VÉRIFIER LES RDV CRÉÉS
-- Voir les RDV entre prospects et experts
SELECT 
    r.id as rdv_id,
    c.company_name as prospect,
    e.first_name || ' ' || e.last_name as expert,
    r.meeting_type,
    r.scheduled_date,
    r.scheduled_time,
    r.status,
    r.created_at,
    aa.first_name || ' ' || aa.last_name as cree_par_apporteur
FROM "RDV" r
LEFT JOIN "Client" c ON c.id = r.client_id
LEFT JOIN "Expert" e ON e.id = r.expert_id
LEFT JOIN "ApporteurAffaires" aa ON aa.id = r.apporteur_id
WHERE c.source = 'apporteur'
ORDER BY r.created_at DESC
LIMIT 10;

-- 6. VÉRIFIER LES PRODUITS PAR RDV
-- Voir quels produits sont liés à chaque RDV
SELECT 
    r.id as rdv_id,
    c.company_name as prospect,
    e.first_name || ' ' || e.last_name as expert,
    r.scheduled_date,
    pe.nom as produit,
    cpe."montantFinal",
    rp.notes as notes_rdv_produit
FROM "RDV" r
LEFT JOIN "Client" c ON c.id = r.client_id
LEFT JOIN "Expert" e ON e.id = r.expert_id
LEFT JOIN "RDV_Produits" rp ON rp.rdv_id = r.id
LEFT JOIN "ProduitEligible" pe ON pe.id = rp.product_id
LEFT JOIN "ClientProduitEligible" cpe ON cpe.id = rp.client_produit_eligible_id
WHERE c.source = 'apporteur'
ORDER BY r.created_at DESC, pe.nom
LIMIT 20;

-- =====================================================
-- 7. TEST SPÉCIFIQUE POUR VOTRE PROSPECT "Profitum SAS"
-- =====================================================
SELECT 
    cpe.id as cpe_id,
    c.company_name,
    pe.nom as produit,
    cpe.statut,
    cpe."montantFinal",
    cpe.expert_id,
    COALESCE(
        NULLIF(e.first_name || ' ' || e.last_name, ' '),
        e.name,
        'Expert'
    ) as expert_assigne,
    e.company_name as entreprise_expert,
    e.email as email_expert,
    cpe.metadata->>'expert_validated_by_client' as validation_client,
    cpe.metadata->>'expert_selected_by_client' as choix_client,
    cpe.created_at,
    cpe.updated_at
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE c.company_name = 'Profitum SAS'
ORDER BY cpe.created_at DESC;

-- =====================================================
-- 8. IDENTIFIER LES PROBLÈMES POTENTIELS
-- =====================================================

-- Produits éligibles SANS expert assigné (ne devrait plus arriver !)
SELECT 
    COUNT(*) as produits_sans_expert,
    array_agg(DISTINCT c.company_name) as prospects_concernes
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
WHERE cpe.statut IN ('eligible', 'to_confirm')
  AND cpe.expert_id IS NULL
  AND c.source = 'apporteur'
  AND cpe.created_at > NOW() - INTERVAL '7 days';

-- Simulations sans résultats
SELECT 
    s.id as simulation_id,
    c.company_name,
    s.status,
    s.created_at,
    COUNT(cpe.id) as produits_crees
FROM "simulations" s
LEFT JOIN "Client" c ON c.id = s.client_id
LEFT JOIN "ClientProduitEligible" cpe ON cpe."simulationId" = s.id::text
WHERE s.type = 'apporteur_prospect'
  AND s.status = 'completed'
GROUP BY s.id, c.company_name, s.status, s.created_at
HAVING COUNT(cpe.id) = 0
ORDER BY s.created_at DESC
LIMIT 5;

-- =====================================================
-- RÉSULTAT ATTENDU APRÈS CORRECTIONS
-- =====================================================
-- 
-- ✅ Tous les ClientProduitEligible doivent avoir un expert_id non NULL
-- ✅ Les simulations doivent avoir status = 'completed'
-- ✅ Les RDV doivent être créés avec les bons experts et produits
-- ✅ Le champ metadata des simulations doit contenir expert_optimization
--
-- =====================================================

