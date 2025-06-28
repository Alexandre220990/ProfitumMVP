-- Configurer des politiques RLS appropriées
-- Date: 2025-01-24

-- 1. Créer des politiques pour la table Client
CREATE POLICY "Enable all operations for service_role" ON "Client"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON "Client"
    FOR SELECT USING (auth.uid()::text = "auth_id");

CREATE POLICY "Enable update for authenticated users" ON "Client"
    FOR UPDATE USING (auth.uid()::text = "auth_id");

-- 2. Créer des politiques pour la table Simulation
CREATE POLICY "Enable all operations for service_role" ON "Simulation"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON "Simulation"
    FOR SELECT USING (auth.uid()::text = "clientId");

CREATE POLICY "Enable insert for authenticated users" ON "Simulation"
    FOR INSERT WITH CHECK (auth.uid()::text = "clientId");

-- 3. Créer des politiques pour la table ClientProduitEligible
CREATE POLICY "Enable all operations for service_role" ON "ClientProduitEligible"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON "ClientProduitEligible"
    FOR SELECT USING (auth.uid()::text = "clientId");

CREATE POLICY "Enable insert for authenticated users" ON "ClientProduitEligible"
    FOR INSERT WITH CHECK (auth.uid()::text = "clientId");

-- 4. Créer des politiques pour la table ProduitEligible
CREATE POLICY "Enable all operations for service_role" ON "ProduitEligible"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for all users" ON "ProduitEligible"
    FOR SELECT USING (true);

-- 5. Vérifier les politiques créées
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
WHERE tablename IN ('Client', 'Simulation', 'ClientProduitEligible', 'ProduitEligible'); 