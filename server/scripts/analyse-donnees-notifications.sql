-- ============================================================================
-- SCRIPT D'ANALYSE DES DONNÉES DE NOTIFICATIONS
-- ============================================================================
-- Objectif: Analyser les données avant migration vers table unifiée

-- 1. Structure de la table notification
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notification'
ORDER BY ordinal_position;

-- 2. Valeurs de user_type dans notification
SELECT 
  user_type, 
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM notification
GROUP BY user_type
ORDER BY count DESC;

-- 3. Analyse AdminNotification
SELECT 
  COUNT(*) as total,
  COUNT(DISTINCT type) as unique_types,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM "AdminNotification";

-- Exemples de notifications AdminNotification
SELECT 
  id, 
  type, 
  title, 
  status, 
  priority, 
  is_read,
  created_at
FROM "AdminNotification"
ORDER BY created_at DESC
LIMIT 10;

-- 4. Analyse ExpertNotification
SELECT 
  COUNT(*) as total,
  COUNT(DISTINCT notification_type) as unique_types
FROM "ExpertNotification";

-- 5. Vérifier si AdminNotification a des user_id
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'AdminNotification'
ORDER BY ordinal_position;

-- 6. Vérifier les admins actifs pour la migration
SELECT 
  COUNT(*) as total_admins,
  COUNT(DISTINCT auth_user_id) as admins_with_auth_id
FROM "Admin"
WHERE is_active = true;

-- 7. Comparer les colonnes entre notification et AdminNotification
SELECT 
  'notification' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notification'
UNION ALL
SELECT 
  'AdminNotification' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'AdminNotification'
ORDER BY table_name, column_name;
