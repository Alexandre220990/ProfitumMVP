-- =====================================================
-- ANALYSE DES DOCUMENTS TICPE DANS LA BASE DE DONNÉES GED
-- =====================================================

-- 1. Vérifier les labels TICPE existants
SELECT 
    id,
    name,
    description,
    created_at
FROM "GEDDocumentLabel"
WHERE name IN ('kbis', 'immatriculation', 'facture_carburant')
   OR name ILIKE '%ticpe%'
   OR name ILIKE '%kbis%'
   OR name ILIKE '%immatriculation%'
   OR name ILIKE '%carburant%';

-- 2. Compter les documents par type pour TICPE
SELECT 
    gdl.name as document_type,
    COUNT(*) as nombre_documents,
    COUNT(DISTINCT gd.created_by) as nombre_utilisateurs,
    MIN(gd.created_at) as premier_upload,
    MAX(gd.created_at) as dernier_upload
FROM "GEDDocument" gd
JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
WHERE gd.category = 'eligibilite_ticpe' 
   OR gdl.name IN ('kbis', 'immatriculation', 'facture_carburant')
GROUP BY gdl.name
ORDER BY gdl.name;

-- 3. Analyser les documents par dossier TICPE
SELECT 
    gdl.name as document_type,
    gd.title as original_filename,
    gd.description,
    gd.category,
    gd.file_path,
    gd.created_at,
    cpe.id as dossier_id,
    cpe.statut as statut_dossier,
    cpe.current_step,
    cpe.progress,
    cpe."clientId"
FROM "GEDDocument" gd
JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
JOIN "ClientProduitEligible" cpe ON gd.content LIKE 'dossier_id:' || cpe.id::text
WHERE (gd.category = 'eligibilite_ticpe' 
   OR gdl.name IN ('kbis', 'immatriculation', 'facture_carburant'))
   AND cpe."produitId" IN (SELECT id FROM "ProduitEligible" WHERE nom ILIKE '%TICPE%')
ORDER BY gd.created_at DESC
LIMIT 50;

-- 4. Vérifier les documents TICPE existants
SELECT 
    gd.id,
    gd.title,
    gd.description,
    gd.category,
    gd.file_path,
    gd.created_at,
    gd.created_by,
    gdl.name as label_name
FROM "GEDDocument" gd
LEFT JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
LEFT JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
WHERE gd.category ILIKE '%ticpe%'
   OR gd.title ILIKE '%ticpe%'
   OR gd.description ILIKE '%ticpe%'
   OR gdl.name IN ('kbis', 'immatriculation', 'facture_carburant')
ORDER BY gd.created_at DESC;

-- 5. Analyser les dossiers TICPE
SELECT 
    cpe.id,
    cpe."clientId",
    cpe.statut,
    cpe.current_step,
    cpe.progress,
    cpe.created_at,
    pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE pe.nom ILIKE '%TICPE%'
ORDER BY cpe.created_at DESC;

-- 6. Vérifier les dossiers TICPE sans documents
SELECT 
    cpe.id,
    cpe."clientId",
    cpe.statut,
    cpe.current_step,
    cpe.progress,
    cpe.created_at
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE pe.nom ILIKE '%TICPE%'
AND cpe.id NOT IN (
    SELECT DISTINCT SUBSTRING(gd.content FROM 12)::uuid
    FROM "GEDDocument" gd
    JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
    JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
    WHERE gd.category = 'eligibilite_ticpe' 
       OR gdl.name IN ('kbis', 'immatriculation', 'facture_carburant')
);

-- 7. Compter les documents par catégorie
SELECT 
    gd.category,
    COUNT(*) as nombre_documents,
    COUNT(DISTINCT gd.created_by) as nombre_utilisateurs,
    MIN(gd.created_at) as premier_document,
    MAX(gd.created_at) as dernier_document
FROM "GEDDocument" gd
GROUP BY gd.category
ORDER BY nombre_documents DESC;

-- 8. Analyser les permissions sur les documents TICPE
SELECT 
    gdp.user_type,
    COUNT(*) as nombre_permissions,
    COUNT(DISTINCT gdp.document_id) as nombre_documents
FROM "GEDDocumentPermission" gdp
JOIN "GEDDocument" gd ON gdp.document_id = gd.id
JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
WHERE gd.category = 'eligibilite_ticpe' 
   OR gdl.name IN ('kbis', 'immatriculation', 'facture_carburant')
GROUP BY gdp.user_type;

-- 9. Résumé global TICPE
SELECT 
    'TICPE' as produit,
    COUNT(DISTINCT cpe.id) as nombre_dossiers,
    COUNT(DISTINCT cpe."clientId") as nombre_clients,
    COUNT(gd.id) as nombre_documents,
    COUNT(DISTINCT gd.created_by) as clients_avec_documents,
    ROUND(COUNT(gd.id) * 100.0 / COUNT(DISTINCT cpe.id), 2) as pourcentage_dossiers_avec_documents
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
LEFT JOIN "GEDDocument" gd ON gd.content LIKE 'dossier_id:' || cpe.id::text
LEFT JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
LEFT JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
WHERE pe.nom ILIKE '%TICPE%'
AND (gd.category = 'eligibilite_ticpe' 
   OR gdl.name IN ('kbis', 'immatriculation', 'facture_carburant')
   OR gd.id IS NULL);

-- =====================================================
-- VALEURS ATTENDUES SELON LE CODE
-- =====================================================

-- Types de documents attendus
SELECT 'kbis' as document_type, 'Extrait KBIS' as label
UNION ALL
SELECT 'immatriculation', 'Certificat d''immatriculation'
UNION ALL
SELECT 'facture_carburant', 'Facture de carburant';

-- Catégories attendues
SELECT 'eligibilite_ticpe' as category_attendue;

-- Types d'utilisateur attendus
SELECT 'client' as user_type_attendu;

-- Statuts attendus
SELECT 'uploaded' as status_attendu
UNION ALL
SELECT 'pending' as validation_status_attendu;

-- =====================================================
-- REQUÊTES DE DIAGNOSTIC
-- =====================================================

-- Vérifier si les labels TICPE existent
SELECT 
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ Tous les labels TICPE existent'
        ELSE '❌ Labels manquants: ' || (3 - COUNT(*)) || ' sur 3'
    END as statut_labels
FROM "GEDDocumentLabel"
WHERE name IN ('kbis', 'immatriculation', 'facture_carburant');

-- Vérifier la structure des colonnes importantes
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('id', 'title', 'description', 'category', 'file_path', 'created_at', 'created_by') 
        THEN '✅ Colonne présente'
        ELSE '⚠️ Colonne manquante ou différente'
    END as statut_colonne
FROM information_schema.columns 
WHERE table_name = 'GEDDocument'
AND column_name IN ('id', 'title', 'description', 'category', 'file_path', 'created_at', 'created_by', 'content');
