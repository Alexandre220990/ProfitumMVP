-- =====================================================
-- FIX: Corriger les URLs de notifications avec /review
-- =====================================================
-- Date: 2025-11-04
-- Problème: Anciennes notifications pointent vers /expert/dossier/:id/review
-- Solution: Remplacer par /expert/dossier/:id
-- =====================================================

-- 1️⃣ Vérifier les notifications concernées
SELECT 
  id,
  title,
  action_url,
  created_at
FROM notification
WHERE action_url LIKE '%/review%'
ORDER BY created_at DESC;

-- 2️⃣ Corriger les URLs
UPDATE notification
SET 
  action_url = REPLACE(action_url, '/review', ''),
  updated_at = NOW()
WHERE action_url LIKE '%/review%';

-- 3️⃣ Vérification post-correction
SELECT 
  id,
  title,
  action_url,
  updated_at
FROM notification
WHERE notification_type = 'dossier_pending_acceptance'
ORDER BY created_at DESC
LIMIT 10;

-- 4️⃣ Stats URLs corrigées
SELECT 
  'URLs corrigées' as action,
  COUNT(*) as nombre
FROM notification
WHERE updated_at = CURRENT_DATE
  AND action_url LIKE '/expert/dossier/%'
  AND action_url NOT LIKE '%/review%';

-- =====================================================
-- 5️⃣ CORRIGER LES TITRES - Remplacer TICPE par le vrai produit
-- =====================================================

-- Vérifier d'abord les dossiers et leurs produits
SELECT 
  n.id as notification_id,
  n.title as titre_actuel,
  SUBSTRING(n.action_url FROM '/expert/dossier/([a-f0-9-]+)') as dossier_id,
  cpe.id as client_produit_id,
  pe.nom as vrai_nom_produit
FROM notification n
LEFT JOIN "ClientProduitEligible" cpe ON cpe.id = SUBSTRING(n.action_url FROM '/expert/dossier/([a-f0-9-]+)')::uuid
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
WHERE n.notification_type = 'dossier_pending_acceptance'
  AND n.title LIKE '%TICPE%'
ORDER BY n.created_at DESC;

-- Mettre à jour les titres avec le vrai nom du produit
UPDATE notification n
SET 
  title = CONCAT('📋 Nouveau dossier ', pe.nom, ' en attente'),
  message = REPLACE(
    n.message,
    'TICPE',
    pe.nom
  ),
  updated_at = NOW()
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
WHERE 
  n.notification_type = 'dossier_pending_acceptance'
  AND cpe.id = SUBSTRING(n.action_url FROM '/expert/dossier/([a-f0-9-]+)')::uuid
  AND n.title LIKE '%TICPE%';

-- Vérification finale
SELECT 
  n.id,
  n.title,
  n.message,
  n.action_url,
  pe.nom as produit_reel,
  n.updated_at
FROM notification n
LEFT JOIN "ClientProduitEligible" cpe ON cpe.id = SUBSTRING(n.action_url FROM '/expert/dossier/([a-f0-9-]+)')::uuid
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
WHERE n.notification_type = 'dossier_pending_acceptance'
ORDER BY n.created_at DESC
LIMIT 10;

-- Stats finales
SELECT 
  'Titres corrigés' as action,
  COUNT(*) as nombre
FROM notification
WHERE updated_at > NOW() - INTERVAL '5 minutes'
  AND notification_type = 'dossier_pending_acceptance';

