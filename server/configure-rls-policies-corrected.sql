-- Configurer des politiques RLS appropriées avec les bons types
-- Date: 2025-01-24

-- 1. Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Enable all operations for service_role" ON "Client";
DROP POLICY IF EXISTS "Enable read for authenticated users" ON "Client";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "Client";

DROP POLICY IF EXISTS "Enable all operations for service_role" ON "Simulation";
DROP POLICY IF EXISTS "Enable read for authenticated users" ON "Simulation";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "Simulation";

DROP POLICY IF EXISTS "Enable all operations for service_role" ON "ClientProduitEligible";
DROP POLICY IF EXISTS "Enable read for authenticated users" ON "ClientProduitEligible";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "ClientProduitEligible";

DROP POLICY IF EXISTS "Enable all operations for service_role" ON "ProduitEligible";
DROP POLICY IF EXISTS "Enable read for all users" ON "ProduitEligible";

-- 2. Créer des politiques pour la table Client
-- Politique pour service_role (toutes les opérations)
CREATE POLICY "Enable all operations for service_role" ON "Client"
    FOR ALL USING (true) WITH CHECK (true);

-- Politique pour les utilisateurs authentifiés (lecture de leurs propres données)
CREATE POLICY "Enable read for authenticated users" ON "Client"
    FOR SELECT USING (auth.uid()::text = "auth_id");

-- Politique pour les utilisateurs authentifiés (mise à jour de leurs propres données)
CREATE POLICY "Enable update for authenticated users" ON "Client"
    FOR UPDATE USING (auth.uid()::text = "auth_id");

-- 3. Créer des politiques pour la table Simulation
-- Politique pour service_role (toutes les opérations)
CREATE POLICY "Enable all operations for service_role" ON "Simulation"
    FOR ALL USING (true) WITH CHECK (true);

-- Politique pour les utilisateurs authentifiés (lecture de leurs simulations)
CREATE POLICY "Enable read for authenticated users" ON "Simulation"
    FOR SELECT USING (auth.uid()::text = "clientId");

-- Politique pour les utilisateurs authentifiés (création de simulations)
CREATE POLICY "Enable insert for authenticated users" ON "Simulation"
    FOR INSERT WITH CHECK (auth.uid()::text = "clientId");

-- 4. Créer des politiques pour la table ClientProduitEligible
-- Politique pour service_role (toutes les opérations)
CREATE POLICY "Enable all operations for service_role" ON "ClientProduitEligible"
    FOR ALL USING (true) WITH CHECK (true);

-- Politique pour les utilisateurs authentifiés (lecture de leurs produits éligibles)
CREATE POLICY "Enable read for authenticated users" ON "ClientProduitEligible"
    FOR SELECT USING (auth.uid()::text = "clientId");

-- Politique pour les utilisateurs authentifiés (création de produits éligibles)
CREATE POLICY "Enable insert for authenticated users" ON "ClientProduitEligible"
    FOR INSERT WITH CHECK (auth.uid()::text = "clientId");

-- 5. Créer des politiques pour la table ProduitEligible
-- Politique pour service_role (toutes les opérations)
CREATE POLICY "Enable all operations for service_role" ON "ProduitEligible"
    FOR ALL USING (true) WITH CHECK (true);

-- Politique pour tous les utilisateurs (lecture des produits éligibles)
CREATE POLICY "Enable read for all users" ON "ProduitEligible"
    FOR SELECT USING (true);

-- 6. Vérifier les politiques créées
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
WHERE tablename IN ('Client', 'Simulation', 'ClientProduitEligible', 'ProduitEligible')
ORDER BY tablename, policyname; 