-- ============================================================================
-- ANALYSE COMPLÈTE DU SYSTÈME ACTUEL - SIMULATION ET PRODUITS ÉLIGIBLES
-- ============================================================================

-- 1. ANALYSE DES TABLES PRINCIPALES
-- =================================

-- Table ClientProduitEligible (produits éligibles actuels)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- Structure détaillée de ClientProduitEligible
SELECT 
    'ClientProduitEligible' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- 2. ANALYSE DES TABLES DE SIMULATION
-- ===================================

-- Vérifier s'il existe des tables liées aux simulations
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%simul%' 
   OR table_name LIKE '%eligib%'
   OR table_name LIKE '%session%'
ORDER BY table_name;

-- 3. ANALYSE DES CONTRAINTES ET RELATIONS
-- =======================================

-- Clés primaires et étrangères
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('ClientProduitEligible', 'Client', 'ProduitEligible')
ORDER BY tc.table_name, tc.constraint_type;

-- 4. ANALYSE DES DONNÉES ACTUELLES
-- =================================

-- Compter les produits éligibles par client
SELECT 
    c.email,
    COUNT(cpe.id) as produits_count,
    SUM(cpe.montant_final) as total_montant,
    AVG(cpe.taux_final) as taux_moyen
FROM Client c
LEFT JOIN ClientProduitEligible cpe ON c.id = cpe.clientId
GROUP BY c.id, c.email
ORDER BY produits_count DESC;

-- Statuts des produits éligibles
SELECT 
    cpe.statut,
    COUNT(*) as count,
    AVG(cpe.montant_final) as montant_moyen
FROM ClientProduitEligible cpe
GROUP BY cpe.statut
ORDER BY count DESC;

-- 5. ANALYSE DES ROUTES API EXISTANTES
-- ====================================

-- Vérifier les routes de simulation existantes
SELECT 
    'Routes de simulation à vérifier dans le code' as info;

-- 6. ANALYSE DES HOOKS ET SERVICES
-- =================================

-- Vérifier les services de simulation
SELECT 
    'Services à analyser dans le code TypeScript' as info;

-- 7. RECOMMANDATIONS POUR LES NOUVELLES TABLES
-- ============================================

-- Script pour créer une table d'historique des simulations
CREATE TABLE IF NOT EXISTS SimulationHistory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES Client(id) ON DELETE CASCADE,
    session_token VARCHAR(255),
    simulation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responses JSONB,
    results JSONB,
    products_updated INTEGER DEFAULT 0,
    products_created INTEGER DEFAULT 0,
    total_potential_savings DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_simulation_history_client_id ON SimulationHistory(client_id);
CREATE INDEX IF NOT EXISTS idx_simulation_history_date ON SimulationHistory(simulation_date);

-- 8. ANALYSE DES RÈGLES MÉTIER ACTUELLES
-- ======================================

-- Vérifier les règles de validation des produits
SELECT 
    'Règles métier à analyser dans le code' as info;

-- 9. RÉSUMÉ DE L'ANALYSE
-- ======================

SELECT 
    'ANALYSE TERMINÉE - Voir les résultats ci-dessus' as status;
