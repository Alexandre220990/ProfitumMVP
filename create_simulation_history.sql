-- ============================================================================
-- CRÉATION DE LA TABLE SimulationHistory
-- ============================================================================

-- Table d'historique des simulations pour les clients connectés
CREATE TABLE IF NOT EXISTS SimulationHistory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
    session_token VARCHAR(255),
    simulation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Données de la simulation
    responses JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    
    -- Statistiques de fusion
    products_updated INTEGER DEFAULT 0,
    products_created INTEGER DEFAULT 0,
    products_protected INTEGER DEFAULT 0,
    total_potential_savings DECIMAL(10,2) DEFAULT 0,
    
    -- Métadonnées
    simulation_type VARCHAR(50) DEFAULT 'client_update',
    fusion_rules_applied JSONB DEFAULT '{}',
    conflicts_resolved JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_simulation_history_client_id ON SimulationHistory(client_id);
CREATE INDEX IF NOT EXISTS idx_simulation_history_date ON SimulationHistory(simulation_date);
CREATE INDEX IF NOT EXISTS idx_simulation_history_type ON SimulationHistory(simulation_type);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_simulation_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_simulation_history_updated_at
    BEFORE UPDATE ON SimulationHistory
    FOR EACH ROW
    EXECUTE FUNCTION update_simulation_history_updated_at();

-- ============================================================================
-- FONCTION POUR LA FUSION INTELLIGENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION merge_client_products(
    p_client_id UUID,
    p_new_simulation_id UUID,
    p_new_products JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB := '{}';
    v_product JSONB;
    v_existing_product RECORD;
    v_products_updated INTEGER := 0;
    v_products_created INTEGER := 0;
    v_products_protected INTEGER := 0;
    v_total_savings DECIMAL(10,2) := 0;
    v_fusion_rules JSONB := '{}';
    v_conflicts JSONB := '{}';
BEGIN
    -- Parcourir chaque nouveau produit
    FOR v_product IN SELECT * FROM jsonb_array_elements(p_new_products)
    LOOP
        -- Vérifier si le produit existe déjà
        SELECT * INTO v_existing_product
        FROM "ClientProduitEligible"
        WHERE "clientId" = p_client_id 
          AND "produitId" = (v_product->>'produitId')::UUID;
        
        -- Règles de fusion
        IF v_existing_product IS NULL THEN
            -- NOUVEAU PRODUIT - Créer
            INSERT INTO "ClientProduitEligible" (
                "clientId", "produitId", "statut", "tauxFinal", 
                "montantFinal", "dureeFinale", "simulationId", 
                "metadata", "progress", "current_step"
            ) VALUES (
                p_client_id,
                (v_product->>'produitId')::UUID,
                'opportunité',
                (v_product->>'tauxFinal')::DOUBLE PRECISION,
                (v_product->>'montantFinal')::DOUBLE PRECISION,
                (v_product->>'dureeFinale')::INTEGER,
                p_new_simulation_id,
                v_product->'metadata',
                0,
                0
            );
            v_products_created := v_products_created + 1;
            
        ELSIF v_existing_product.statut IN ('en_cours', 'en_attente', 'valide', 'termine') THEN
            -- PRODUIT PROTÉGÉ - Ne pas modifier
            v_products_protected := v_products_protected + 1;
            v_conflicts := v_conflicts || jsonb_build_object(
                'protected_product', v_existing_product.id,
                'reason', 'Produit en cours de traitement'
            );
            
        ELSE
            -- PRODUIT EXISTANT - Mise à jour intelligente
            UPDATE "ClientProduitEligible"
            SET 
                "tauxFinal" = (v_product->>'tauxFinal')::DOUBLE PRECISION,
                "montantFinal" = (v_product->>'montantFinal')::DOUBLE PRECISION,
                "dureeFinale" = (v_product->>'dureeFinale')::INTEGER,
                "simulationId" = p_new_simulation_id,
                "metadata" = v_product->'metadata',
                "updated_at" = NOW()
            WHERE id = v_existing_product.id;
            
            v_products_updated := v_products_updated + 1;
        END IF;
        
        -- Calculer le total des économies
        v_total_savings := v_total_savings + COALESCE((v_product->>'montantFinal')::DECIMAL(10,2), 0);
    END LOOP;
    
    -- Enregistrer l'historique
    INSERT INTO SimulationHistory (
        client_id,
        session_token,
        simulation_date,
        responses,
        results,
        products_updated,
        products_created,
        products_protected,
        total_potential_savings,
        simulation_type,
        fusion_rules_applied,
        conflicts_resolved
    ) VALUES (
        p_client_id,
        NULL, -- session_token pour client connecté
        NOW(),
        '{}', -- responses
        p_new_products,
        v_products_updated,
        v_products_created,
        v_products_protected,
        v_total_savings,
        'client_update',
        v_fusion_rules,
        v_conflicts
    );
    
    -- Retourner le résultat
    v_result := jsonb_build_object(
        'success', true,
        'products_updated', v_products_updated,
        'products_created', v_products_created,
        'products_protected', v_products_protected,
        'total_savings', v_total_savings,
        'conflicts', v_conflicts
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VÉRIFICATION DE LA CRÉATION
-- ============================================================================

-- Vérifier que la table a été créée
SELECT 
    'SimulationHistory créée avec succès' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_name = 'simulationhistory';

-- Vérifier la fonction
SELECT 
    'Fonction merge_client_products créée' as status,
    proname as function_name
FROM pg_proc 
WHERE proname = 'merge_client_products';
