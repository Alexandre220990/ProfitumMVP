-- =====================================================
-- FIX: Corriger le compte de documents dans la timeline
-- =====================================================
-- Date: 2025-11-04
-- Problème: Timeline affiche "0 documents uploadés"
-- Solution: Recalculer le nombre réel de documents
-- =====================================================

-- 1️⃣ Vérifier les événements concernés
SELECT 
  dt.id,
  dt.dossier_id,
  dt.title,
  dt.description,
  dt.date,
  (
    SELECT COUNT(*)
    FROM "ClientProcessDocument" cpd
    WHERE cpd.client_produit_id = dt.dossier_id
  ) as documents_reels
FROM dossier_timeline dt
WHERE dt.type = 'document'
  AND dt.title LIKE '%Documents de pré-éligibilité%'
  AND (dt.description LIKE '%0 documents%' OR dt.description IS NULL)
ORDER BY dt.date DESC;

-- 2️⃣ Mettre à jour les descriptions avec le vrai compte
UPDATE dossier_timeline dt
SET 
  description = CONCAT(
    (
      SELECT COUNT(*)::text
      FROM "ClientProcessDocument" cpd
      WHERE cpd.client_produit_id = dt.dossier_id
    ),
    ' documents uploadés'
  ),
  metadata = jsonb_set(
    COALESCE(dt.metadata, '{}'::jsonb),
    '{documents_count}',
    (
      SELECT COUNT(*)::text::jsonb
      FROM "ClientProcessDocument" cpd
      WHERE cpd.client_produit_id = dt.dossier_id
    )
  ),
  updated_at = NOW()
WHERE dt.type = 'document'
  AND dt.title LIKE '%Documents de pré-éligibilité%'
  AND (dt.description LIKE '%0 documents%' OR dt.description IS NULL);

-- 3️⃣ Vérification après mise à jour
SELECT 
  dt.id,
  dt.dossier_id,
  dt.title,
  dt.description,
  dt.metadata->>'documents_count' as count_in_metadata,
  (
    SELECT COUNT(*)
    FROM "ClientProcessDocument" cpd
    WHERE cpd.client_produit_id = dt.dossier_id
  ) as documents_reels,
  dt.updated_at
FROM dossier_timeline dt
WHERE dt.type = 'document'
  AND dt.title LIKE '%Documents de pré-éligibilité%'
ORDER BY dt.date DESC
LIMIT 20;

-- 4️⃣ Mettre à jour AUSSI avec la liste des noms de fichiers
UPDATE dossier_timeline dt
SET 
  description = CONCAT(
    (
      SELECT COUNT(*)::text
      FROM "ClientProcessDocument" cpd
      WHERE cpd.client_produit_id = dt.dossier_id
    ),
    ' documents uploadés',
    CASE 
      WHEN (SELECT COUNT(*) FROM "ClientProcessDocument" cpd WHERE cpd.client_produit_id = dt.dossier_id) > 0
      THEN E'\n' || (
        SELECT STRING_AGG('• ' || filename, E'\n' ORDER BY created_at)
        FROM "ClientProcessDocument" cpd
        WHERE cpd.client_produit_id = dt.dossier_id
      )
      ELSE ''
    END
  ),
  metadata = jsonb_set(
    jsonb_set(
      COALESCE(dt.metadata, '{}'::jsonb),
      '{documents_count}',
      (
        SELECT COUNT(*)::text::jsonb
        FROM "ClientProcessDocument" cpd
        WHERE cpd.client_produit_id = dt.dossier_id
      )
    ),
    '{documents}',
    (
      SELECT COALESCE(jsonb_agg(filename), '[]'::jsonb)
      FROM "ClientProcessDocument" cpd
      WHERE cpd.client_produit_id = dt.dossier_id
    )
  ),
  updated_at = NOW()
WHERE dt.type = 'document'
  AND dt.title LIKE '%Documents de pré-éligibilité%';

-- 5️⃣ Vérification finale détaillée
SELECT 
  dt.id,
  dt.dossier_id,
  dt.title,
  dt.description,
  dt.metadata,
  dt.updated_at
FROM dossier_timeline dt
WHERE dt.type = 'document'
  AND dt.title LIKE '%Documents de pré-éligibilité%'
ORDER BY dt.date DESC
LIMIT 10;

-- 6️⃣ Stats des corrections
SELECT 
  'Événements timeline mis à jour' as action,
  COUNT(*) as nombre
FROM dossier_timeline
WHERE type = 'document'
  AND title LIKE '%Documents de pré-éligibilité%'
  AND updated_at > NOW() - INTERVAL '5 minutes';

-- =====================================================
-- 7️⃣ VÉRIFICATION POUR TOUS LES DOSSIERS
-- =====================================================

-- Afficher pour chaque dossier: événement timeline vs documents réels
SELECT 
  cpe.id as dossier_id,
  cpe."clientId",
  pe.nom as produit,
  (
    SELECT COUNT(*)
    FROM "ClientProcessDocument" cpd
    WHERE cpd.client_produit_id = cpe.id
  ) as documents_en_bdd,
  (
    SELECT description
    FROM dossier_timeline dt
    WHERE dt.dossier_id = cpe.id
      AND dt.type = 'document'
      AND dt.title LIKE '%Documents de pré-éligibilité%'
    ORDER BY dt.date DESC
    LIMIT 1
  ) as timeline_description
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
WHERE EXISTS (
  SELECT 1 
  FROM "ClientProcessDocument" cpd 
  WHERE cpd.client_produit_id = cpe.id
)
ORDER BY cpe.created_at DESC
LIMIT 20;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

