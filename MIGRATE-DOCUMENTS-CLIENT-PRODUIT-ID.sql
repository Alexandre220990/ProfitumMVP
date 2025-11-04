-- =====================================================
-- MIGRATION: Remplir client_produit_id pour anciens documents
-- =====================================================
-- Date: 2025-11-04
-- Problème: Documents uploadés avant ajout colonne n'ont pas client_produit_id
-- Solution: Extraire depuis metadata.client_produit_id
-- =====================================================

-- 1️⃣ Vérifier les documents sans client_produit_id
SELECT 
  id,
  filename,
  document_type,
  client_id,
  metadata->>'client_produit_id' as client_produit_id_in_metadata,
  client_produit_id as current_client_produit_id,
  created_at
FROM "ClientProcessDocument"
WHERE client_produit_id IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- 2️⃣ Compter les documents concernés
SELECT 
  'Documents sans client_produit_id' as statut,
  COUNT(*) as nombre,
  COUNT(CASE WHEN metadata->>'client_produit_id' IS NOT NULL THEN 1 END) as avec_metadata,
  COUNT(CASE WHEN metadata->>'client_produit_id' IS NULL THEN 1 END) as sans_metadata
FROM "ClientProcessDocument"
WHERE client_produit_id IS NULL;

-- 3️⃣ Remplir client_produit_id depuis metadata
UPDATE "ClientProcessDocument"
SET 
  client_produit_id = (metadata->>'client_produit_id')::uuid,
  updated_at = NOW()
WHERE client_produit_id IS NULL
  AND metadata->>'client_produit_id' IS NOT NULL
  AND metadata->>'client_produit_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 4️⃣ Pour les documents sans metadata, essayer de trouver via client_id + produit_id
-- On associe au ClientProduitEligible correspondant
UPDATE "ClientProcessDocument" cpd
SET 
  client_produit_id = cpe.id,
  updated_at = NOW()
FROM "ClientProduitEligible" cpe
WHERE cpd.client_produit_id IS NULL
  AND cpd.client_id = cpe."clientId"
  AND cpd.produit_id = cpe."produitId"
  AND cpe.created_at <= cpd.created_at;

-- 5️⃣ Si plusieurs ClientProduitEligible pour même client + produit, prendre le plus récent
UPDATE "ClientProcessDocument" cpd
SET 
  client_produit_id = (
    SELECT cpe.id
    FROM "ClientProduitEligible" cpe
    WHERE cpe."clientId" = cpd.client_id
      AND cpe."produitId" = cpd.produit_id
    ORDER BY cpe.created_at DESC
    LIMIT 1
  ),
  updated_at = NOW()
WHERE cpd.client_produit_id IS NULL
  AND cpd.client_id IS NOT NULL
  AND cpd.produit_id IS NOT NULL;

-- 6️⃣ Vérification post-migration
SELECT 
  'Documents avec client_produit_id' as statut,
  COUNT(*) as nombre
FROM "ClientProcessDocument"
WHERE client_produit_id IS NOT NULL;

SELECT 
  'Documents SANS client_produit_id (à vérifier)' as statut,
  COUNT(*) as nombre
FROM "ClientProcessDocument"
WHERE client_produit_id IS NULL;

-- 7️⃣ Détails des documents migrés
SELECT 
  cpd.id,
  cpd.filename,
  cpd.client_id,
  cpd.produit_id,
  cpd.client_produit_id,
  c.company_name as client_name,
  pe.nom as produit_name,
  cpd.created_at
FROM "ClientProcessDocument" cpd
LEFT JOIN "Client" c ON c.id = cpd.client_id
LEFT JOIN "ProduitEligible" pe ON pe.id = cpd.produit_id
WHERE cpd.updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY cpd.created_at DESC
LIMIT 20;

-- 8️⃣ Vérifier le dossier spécifique mentionné
SELECT 
  cpd.id,
  cpd.filename,
  cpd.document_type,
  cpd.client_produit_id,
  cpd.validation_status,
  cpd.created_at
FROM "ClientProcessDocument" cpd
WHERE cpd.client_produit_id = 'ffddb8df-4182-4447-8a43-3944bb85d976'
ORDER BY cpd.created_at DESC;

-- Si aucun résultat, chercher par metadata
SELECT 
  cpd.id,
  cpd.filename,
  cpd.document_type,
  cpd.metadata->>'client_produit_id' as client_produit_id_metadata,
  cpd.client_produit_id,
  cpd.validation_status,
  cpd.created_at
FROM "ClientProcessDocument" cpd
WHERE cpd.metadata->>'client_produit_id' = 'ffddb8df-4182-4447-8a43-3944bb85d976'
ORDER BY cpd.created_at DESC;

-- 9️⃣ Stats finales
SELECT 
  validation_status,
  COUNT(*) as nombre_documents
FROM "ClientProcessDocument"
WHERE client_produit_id IS NOT NULL
GROUP BY validation_status
ORDER BY nombre_documents DESC;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Résumé attendu:
SELECT 
  'Migration terminée' as status,
  NOW() as executed_at;

