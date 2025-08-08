-- Script simple pour identifier l'admin
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Voir tous les admins
SELECT 'ADMIN' as type, id, email, name, created_at FROM "Admin" ORDER BY created_at DESC;

-- 2. Voir tous les clients (pour vérifier si votre admin est là)
SELECT 'CLIENT' as type, id, email, name, created_at FROM "Client" ORDER BY created_at DESC;

-- 3. Voir tous les experts (pour vérifier si votre admin est là)
SELECT 'EXPERT' as type, id, email, name, created_at FROM "Expert" ORDER BY created_at DESC;

-- 4. Recherche par email (remplacez par votre email)
-- SELECT 'ADMIN' as type, id, email, name, created_at FROM "Admin" WHERE email = 'votre-email@profitum.app'
-- UNION ALL
-- SELECT 'CLIENT' as type, id, email, name, created_at FROM "Client" WHERE email = 'votre-email@profitum.app'
-- UNION ALL
-- SELECT 'EXPERT' as type, id, email, name, created_at FROM "Expert" WHERE email = 'votre-email@profitum.app';
