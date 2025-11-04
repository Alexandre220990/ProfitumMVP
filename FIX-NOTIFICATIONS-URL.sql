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

-- 4️⃣ Stats
SELECT 
  'Notifications corrigées' as action,
  COUNT(*) as nombre
FROM notification
WHERE updated_at = CURRENT_DATE
  AND action_url LIKE '/expert/dossier/%'
  AND action_url NOT LIKE '%/review%';

