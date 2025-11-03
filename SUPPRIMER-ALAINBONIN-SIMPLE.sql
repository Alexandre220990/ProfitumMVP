-- =====================================================
-- SUPPRESSION SIMPLE: alainbonin@gmail.com
-- =====================================================
-- ⚠️ À EXÉCUTER DANS SUPABASE SQL EDITOR (pas l'interface)

-- ORDRE IMPORTANT: Supprimer les dépendances AVANT le client

-- 1️⃣ Supprimer les produits éligibles
DELETE FROM "ClientProduitEligible"
WHERE "clientId" = (
    SELECT id FROM "Client" WHERE email = 'alainbonin@gmail.fr'
);

-- 2️⃣ Supprimer les simulations
DELETE FROM "simulations"
WHERE client_id = (
    SELECT id FROM "Client" WHERE email = 'alainbonin@gmail.com'
);

-- 3️⃣ Supprimer les sessions utilisateur
DELETE FROM "user_sessions"
WHERE user_id = (
    SELECT auth_user_id FROM "Client" WHERE email = 'alainbonin@gmail.com'
);

-- 4️⃣ Supprimer le client
DELETE FROM "Client"
WHERE email = 'alainbonin@gmail.com';

-- 5️⃣ Vérification
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Client alainbonin@gmail.com supprimé avec succès'
        ELSE '❌ ERREUR: Le client existe encore'
    END as resultat
FROM "Client"
WHERE email = 'alainbonin@gmail.com';

-- ⚠️ IMPORTANT: Supprimer aussi de Supabase Auth
-- Dashboard Supabase → Authentication → Users → Supprimer alainbonin@gmail.com

