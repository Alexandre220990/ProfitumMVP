-- =====================================================
-- ANALYSE DES DONNÉES DE TEST - TABLE SIMULATIONS
-- Date : 2025-01-26
-- Objectif : Analyser les données de test fournies
-- =====================================================

-- ===== 1. VÉRIFICATION DE LA STRUCTURE =====
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulations'
ORDER BY ordinal_position;

-- ===== 2. ANALYSE DES DONNÉES EXISTANTES =====

-- Compter le nombre total de simulations
SELECT COUNT(*) as total_simulations FROM simulations;

-- Compter les simulations récentes (dernières 24h)
SELECT COUNT(*) as simulations_24h 
FROM simulations 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Analyser les statuts
SELECT 
    status,
    COUNT(*) as nombre,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM simulations), 2) as pourcentage
FROM simulations 
GROUP BY status 
ORDER BY nombre DESC;

-- Analyser les types
SELECT 
    type,
    COUNT(*) as nombre,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM simulations), 2) as pourcentage
FROM simulations 
WHERE type IS NOT NULL
GROUP BY type 
ORDER BY nombre DESC;

-- ===== 3. ANALYSE DES DONNÉES DE TEST SPÉCIFIQUES =====

-- Récupérer les simulations du client spécifique
SELECT 
    id,
    client_id,
    session_token,
    status,
    type,
    created_at,
    updated_at,
    CASE 
        WHEN answers IS NOT NULL THEN 'OUI'
        ELSE 'NON'
    END as a_des_reponses,
    CASE 
        WHEN results IS NOT NULL THEN 'OUI'
        ELSE 'NON'
    END as a_des_resultats,
    CASE 
        WHEN metadata IS NOT NULL THEN 'OUI'
        ELSE 'NON'
    END as a_des_metadonnees
FROM simulations 
WHERE client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
ORDER BY created_at DESC;

-- Analyser le contenu des réponses (answers) pour ce client
SELECT 
    id,
    answers->>'source' as source,
    answers->'profileData'->>'besoinsSpecifiques' as besoins_specifiques,
    answers->'eligibleProducts' as produits_eligibles
FROM simulations 
WHERE client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
AND answers IS NOT NULL
ORDER BY created_at DESC;

-- Analyser le contenu des résultats (results) pour ce client
SELECT 
    id,
    results->>'score' as score,
    results->>'abandonA' as abandon,
    results->>'cheminParcouru' as chemin_parcouru,
    results->>'tempsCompletion' as temps_completion
FROM simulations 
WHERE client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
AND results IS NOT NULL
ORDER BY created_at DESC;

-- Analyser le contenu des métadonnées (metadata) pour ce client
SELECT 
    id,
    metadata->>'type' as type_metadata,
    metadata->>'source' as source_metadata,
    metadata->'metadata' as metadata_details
FROM simulations 
WHERE client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
AND metadata IS NOT NULL
ORDER BY created_at DESC;

-- ===== 4. VÉRIFICATION DES PRODUITS ÉLIGIBLES =====

-- Extraire les produits éligibles de toutes les simulations
WITH eligible_products AS (
    SELECT 
        id,
        jsonb_array_elements(answers->'eligibleProducts') as produit
    FROM simulations 
    WHERE answers IS NOT NULL 
    AND answers ? 'eligibleProducts'
)
SELECT 
    produit->>'nom' as nom_produit,
    produit->>'estimatedGain' as gain_estime,
    COUNT(*) as nombre_occurrences
FROM eligible_products
GROUP BY produit->>'nom', produit->>'estimatedGain'
ORDER BY nombre_occurrences DESC;

-- ===== 5. ANALYSE TEMPORELLE =====

-- Distribution par jour
SELECT 
    DATE(created_at) as date_creation,
    COUNT(*) as nombre_simulations,
    COUNT(CASE WHEN status = 'en_cours' THEN 1 END) as en_cours,
    COUNT(CASE WHEN status = 'termine' THEN 1 END) as terminees
FROM simulations 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date_creation DESC;

-- Distribution par heure (dernières 24h)
SELECT 
    DATE_TRUNC('hour', created_at) as heure_creation,
    COUNT(*) as nombre_simulations
FROM simulations 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY heure_creation DESC;

-- ===== 6. VÉRIFICATION DES CONTRAINTES =====

-- Vérifier les simulations orphelines (client_id invalide)
SELECT COUNT(*) as simulations_orphelines
FROM simulations s
LEFT JOIN "Client" c ON s.client_id = c.id
WHERE c.id IS NULL AND s.client_id IS NOT NULL;

-- Vérifier les champs NULL dans les champs obligatoires
SELECT 
    COUNT(*) as total_simulations,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as sans_client_id,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as sans_status,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as sans_created_at
FROM simulations;

-- ===== 7. RÉSUMÉ FINAL =====

-- Statistiques générales
SELECT 
    'RÉSUMÉ FINAL' as section,
    COUNT(*) as total_simulations,
    COUNT(DISTINCT client_id) as clients_uniques,
    COUNT(CASE WHEN status = 'en_cours' THEN 1 END) as en_cours,
    COUNT(CASE WHEN status = 'termine' THEN 1 END) as terminees,
    COUNT(CASE WHEN answers IS NOT NULL THEN 1 END) as avec_reponses,
    COUNT(CASE WHEN results IS NOT NULL THEN 1 END) as avec_resultats,
    COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) as avec_metadonnees,
    MIN(created_at) as premiere_simulation,
    MAX(created_at) as derniere_simulation
FROM simulations; 