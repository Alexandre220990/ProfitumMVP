-- Désactiver RLS temporairement pour les tests
-- Date: 2025-01-24

-- 1. Désactiver RLS sur les tables principales
ALTER TABLE "Client" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Simulation" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientProduitEligible" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ProduitEligible" DISABLE ROW LEVEL SECURITY;

-- 2. Vérifier que RLS est désactivé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('Client', 'Simulation', 'ClientProduitEligible', 'ProduitEligible');

-- 3. Donner les permissions complètes
GRANT ALL PRIVILEGES ON TABLE "Client" TO anon;
GRANT ALL PRIVILEGES ON TABLE "Client" TO authenticated;
GRANT ALL PRIVILEGES ON TABLE "Client" TO service_role;

GRANT ALL PRIVILEGES ON TABLE "Simulation" TO anon;
GRANT ALL PRIVILEGES ON TABLE "Simulation" TO authenticated;
GRANT ALL PRIVILEGES ON TABLE "Simulation" TO service_role;

GRANT ALL PRIVILEGES ON TABLE "ClientProduitEligible" TO anon;
GRANT ALL PRIVILEGES ON TABLE "ClientProduitEligible" TO authenticated;
GRANT ALL PRIVILEGES ON TABLE "ClientProduitEligible" TO service_role;

GRANT ALL PRIVILEGES ON TABLE "ProduitEligible" TO anon;
GRANT ALL PRIVILEGES ON TABLE "ProduitEligible" TO authenticated;
GRANT ALL PRIVILEGES ON TABLE "ProduitEligible" TO service_role;

-- 4. Donner les permissions sur les séquences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role; 