-- Diagnostic complet des tables liées à l'éligibilité
-- ====================================================

-- 1. Vérifier les tables de règles spécifiques
SELECT 
  'RegleEligibilite' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'RegleEligibilite'
  ) as exists,
  (SELECT COUNT(*) FROM "RegleEligibilite") as row_count
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RegleEligibilite')
UNION ALL
SELECT 
  'RegleEligibiliteProduit' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'RegleEligibiliteProduit'
  ) as exists,
  (SELECT COUNT(*) FROM "RegleEligibiliteProduit") as row_count
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RegleEligibiliteProduit')
UNION ALL
SELECT 
  'EligibilityRules' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'EligibilityRules'
  ) as exists,
  (SELECT COUNT(*) FROM "EligibilityRules") as row_count
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'EligibilityRules');

-- 2. Lister TOUTES les tables de la base de données
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Chercher les tables avec 'regle' dans le nom
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND LOWER(table_name) LIKE '%regle%'
ORDER BY table_name;

-- 3. Chercher les tables avec 'eligib' dans le nom
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND LOWER(table_name) LIKE '%eligib%'
ORDER BY table_name;

-- 4. Chercher les tables avec 'rule' dans le nom
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND LOWER(table_name) LIKE '%rule%'
ORDER BY table_name;

-- 5. Chercher les tables avec 'condition' dans le nom
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND LOWER(table_name) LIKE '%condition%'
ORDER BY table_name;

-- 6. Voir la structure de la table ProduitEligible
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- 7. Vérifier le contenu des colonnes conditions/criteres dans ProduitEligible
SELECT 
  id,
  nom,
  active,
  conditions,
  criteres,
  "questionsRequises"
FROM "ProduitEligible"
WHERE active = true
LIMIT 5;

-- 8. Chercher les tables liées aux questions
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND LOWER(table_name) LIKE '%question%'
ORDER BY table_name;

-- 9. Chercher les tables liées aux simulations
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND LOWER(table_name) LIKE '%simul%'
ORDER BY table_name;

-- 10. Voir toutes les tables avec 'Produit' dans le nom
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND LOWER(table_name) LIKE '%produit%'
ORDER BY table_name;

