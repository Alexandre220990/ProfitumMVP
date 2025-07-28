-- Script pour récupérer les UUIDs des produits éligibles
-- À exécuter pour mettre à jour le mapping dans session-migration.ts

SELECT 
    id,
    nom,
    categorie,
    description,
    active,
    created_at
FROM "ProduitEligible"
WHERE active = true
ORDER BY nom;

-- Résultat attendu pour le mapping :
-- TICPE -> [UUID du produit TICPE]
-- URSSAF -> [UUID du produit URSSAF] 
-- DFS -> [UUID du produit DFS]
-- FONCIER -> [UUID du produit FONCIER]

-- Exemple de mise à jour du mapping dans session-migration.ts :
/*
const PRODUCT_MAPPING: { [key: string]: string } = {
  'TICPE': 'uuid-ticpe-trouve',
  'URSSAF': 'uuid-urssaf-trouve', 
  'DFS': 'uuid-dfs-trouve',
  'FONCIER': 'uuid-foncier-trouve'
};
*/ 