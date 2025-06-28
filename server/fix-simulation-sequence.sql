-- Correction des permissions de la séquence Simulation
-- Date: 2025-01-24

-- 1. Vérifier l'existence de la séquence
SELECT 
    sequence_name,
    data_type,
    start_value,
    increment,
    last_value
FROM information_schema.sequences 
WHERE sequence_name = 'Simulation_id_seq';

-- 2. Donner les permissions à la séquence
GRANT USAGE, SELECT ON SEQUENCE "Simulation_id_seq" TO anon;
GRANT USAGE, SELECT ON SEQUENCE "Simulation_id_seq" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE "Simulation_id_seq" TO service_role;

-- 3. Vérifier les permissions de la table Simulation
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'Simulation';

-- 4. Donner les permissions complètes à la table
GRANT ALL PRIVILEGES ON TABLE "Simulation" TO anon;
GRANT ALL PRIVILEGES ON TABLE "Simulation" TO authenticated;
GRANT ALL PRIVILEGES ON TABLE "Simulation" TO service_role;

-- 5. Vérifier les permissions de ClientProduitEligible
GRANT ALL PRIVILEGES ON TABLE "ClientProduitEligible" TO anon;
GRANT ALL PRIVILEGES ON TABLE "ClientProduitEligible" TO authenticated;
GRANT ALL PRIVILEGES ON TABLE "ClientProduitEligible" TO service_role;

-- 6. Vérifier les permissions de ProduitEligible
GRANT ALL PRIVILEGES ON TABLE "ProduitEligible" TO anon;
GRANT ALL PRIVILEGES ON TABLE "ProduitEligible" TO authenticated;
GRANT ALL PRIVILEGES ON TABLE "ProduitEligible" TO service_role; 