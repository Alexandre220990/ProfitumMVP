-- Script pour supprimer le client de test problématique
-- Client: transport.dupont.2025.unique@test.fr

-- 1. Vérification avant suppression
SELECT 'VÉRIFICATION AVANT SUPPRESSION' as info;

SELECT 
    c.id,
    c.email,
    c.auth_id,
    c.company_name,
    c.created_at,
    COUNT(cpe.id) as produits_count
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.email = 'transport.dupont.2025.unique@test.fr'
GROUP BY c.id, c.email, c.auth_id, c.company_name, c.created_at;

-- 2. Vérification des données liées
SELECT 'DONNÉES LIÉES AU CLIENT' as info;

-- Produits éligibles liés
SELECT 
    'Produits éligibles' as type_donnee,
    COUNT(*) as count
FROM "ClientProduitEligible" cpe
WHERE cpe."clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f'

UNION ALL

-- Simulations liées
SELECT 
    'Simulations' as type_donnee,
    COUNT(*) as count
FROM "Simulation" s
WHERE s."clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f'

UNION ALL

-- Audits liés
SELECT 
    'Audits' as type_donnee,
    COUNT(*) as count
FROM "Audit" a
WHERE a."clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f';

-- 3. Suppression des données liées (dans l'ordre)
SELECT 'SUPPRESSION DES DONNÉES LIÉES' as info;

-- Supprimer les produits éligibles
DELETE FROM "ClientProduitEligible" 
WHERE "clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f';

-- Supprimer les simulations
DELETE FROM "Simulation" 
WHERE "clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f';

-- Supprimer les audits
DELETE FROM "Audit" 
WHERE "clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f';

-- 4. Suppression du client
SELECT 'SUPPRESSION DU CLIENT' as info;

DELETE FROM "Client" 
WHERE email = 'transport.dupont.2025.unique@test.fr';

-- 5. Vérification post-suppression
SELECT 'VÉRIFICATION POST-SUPPRESSION' as info;

-- Vérifier que le client a été supprimé
SELECT 
    'Client supprimé' as verification,
    COUNT(*) as count
FROM "Client" 
WHERE email = 'transport.dupont.2025.unique@test.fr'

UNION ALL

-- Vérifier qu'il n'y a plus de données orphelines
SELECT 
    'Produits éligibles orphelins' as verification,
    COUNT(*) as count
FROM "ClientProduitEligible" cpe
WHERE cpe."clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f'

UNION ALL

SELECT 
    'Simulations orphelines' as verification,
    COUNT(*) as count
FROM "Simulation" s
WHERE s."clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f'

UNION ALL

SELECT 
    'Audits orphelins' as verification,
    COUNT(*) as count
FROM "Audit" a
WHERE a."clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f';

-- 6. Résumé de la suppression
SELECT 'RÉSUMÉ DE LA SUPPRESSION' as info;

SELECT 
    'SUPPRESSION TERMINÉE' as statut,
    'Le client transport.dupont.2025.unique@test.fr et toutes ses données ont été supprimés.' as message,
    'Le problème de redirection vers l admin devrait être résolu.' as resultat; 