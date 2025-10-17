-- ============================================================
-- DIAGNOSTIC COMPLET API /api/admin/produits
-- ============================================================

-- 1. VÉRIFIER L'EXISTENCE DE LA TABLE ProduitEligible
-- ============================================================
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ProduitEligible'
  ) AS table_existe;

-- 2. STRUCTURE DE LA TABLE ProduitEligible
-- ============================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- 3. COMPTER LES PRODUITS ÉLIGIBLES
-- ============================================================
SELECT COUNT(*) as nombre_produits
FROM "ProduitEligible";

-- 4. LISTER TOUS LES PRODUITS ÉLIGIBLES (avec détails)
-- ============================================================
SELECT 
  id,
  nom,
  categorie,
  description,
  montant_min,
  montant_max,
  taux_min,
  taux_max,
  duree_min,
  duree_max,
  created_at,
  updated_at
FROM "ProduitEligible"
ORDER BY created_at DESC;

-- 5. VÉRIFIER LES CATÉGORIES DE PRODUITS
-- ============================================================
SELECT 
  categorie,
  COUNT(*) as nombre_produits
FROM "ProduitEligible"
GROUP BY categorie
ORDER BY nombre_produits DESC;

-- 6. VÉRIFIER LES POLITIQUES RLS (Row Level Security)
-- ============================================================
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
WHERE tablename = 'ProduitEligible';

-- 7. VÉRIFIER SI RLS EST ACTIVÉ
-- ============================================================
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'ProduitEligible';

-- 8. VÉRIFIER LES UTILISATEURS ADMIN
-- ============================================================
SELECT 
  id,
  email,
  name,
  created_at
FROM "Admin"
ORDER BY created_at DESC
LIMIT 5;

-- 9. VÉRIFIER LES RELATIONS ClientProduitEligible
-- ============================================================
SELECT 
  COUNT(*) as nombre_relations,
  COUNT(DISTINCT "produitId") as produits_utilises,
  COUNT(DISTINCT "clientId") as clients_concernes
FROM "ClientProduitEligible";

-- 10. TOP 5 DES PRODUITS LES PLUS UTILISÉS
-- ============================================================
SELECT 
  pe.id,
  pe.nom,
  pe.categorie,
  COUNT(cpe.id) as nombre_utilisations
FROM "ProduitEligible" pe
LEFT JOIN "ClientProduitEligible" cpe ON pe.id = cpe."produitId"
GROUP BY pe.id, pe.nom, pe.categorie
ORDER BY nombre_utilisations DESC
LIMIT 5;

-- 11. VÉRIFIER LES INDEXES SUR ProduitEligible
-- ============================================================
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'ProduitEligible';

-- 12. VÉRIFIER LES CONTRAINTES
-- ============================================================
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE n.nspname = 'public'
  AND cl.relname = 'ProduitEligible';

-- 13. INSÉRER UN PRODUIT DE TEST (si la table est vide)
-- ============================================================
-- DÉCOMMENTEZ CETTE SECTION SI VOUS N'AVEZ AUCUN PRODUIT
/*
INSERT INTO "ProduitEligible" (
  nom,
  description,
  categorie,
  montant_min,
  montant_max,
  taux_min,
  taux_max,
  duree_min,
  duree_max
) VALUES 
(
  'Prêt Immobilier Standard',
  'Prêt immobilier pour acquisition résidence principale',
  'immobilier',
  50000,
  500000,
  1.5,
  3.5,
  120,
  300
),
(
  'Prêt à Taux Zéro (PTZ)',
  'Prêt sans intérêt pour primo-accédants',
  'immobilier',
  10000,
  150000,
  0,
  0,
  180,
  300
),
(
  'Crédit Auto',
  'Financement véhicule neuf ou occasion',
  'credit_conso',
  5000,
  75000,
  2.5,
  6.5,
  12,
  84
)
RETURNING *;
*/

-- 14. VÉRIFIER LA CONNEXION SUPABASE (via les variables d'environnement)
-- ============================================================
-- Cette requête vérifie si les extensions nécessaires sont activées
SELECT 
  extname,
  extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- 15. DIAGNOSTIC COMPLET DES PERMISSIONS
-- ============================================================
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'ProduitEligible';

