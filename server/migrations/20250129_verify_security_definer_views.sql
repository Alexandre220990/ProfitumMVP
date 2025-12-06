-- ============================================================================
-- VÉRIFICATION : Liste toutes les vues avec SECURITY DEFINER
-- ============================================================================
-- Ce script permet de vérifier l'état des vues avant et après la migration
-- ============================================================================
-- Date : 2025-01-29
-- ============================================================================

-- Méthode 1: Via reloptions (méthode la plus fiable)
SELECT 
  'Méthode 1: Via reloptions' as methode,
  n.nspname as schema_name,
  c.relname as view_name,
  c.reloptions as options
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.reloptions IS NOT NULL
  AND 'security_definer=true' = ANY(c.reloptions)
ORDER BY c.relname;

-- Méthode 2: Via la définition (pour les vues créées différemment)
SELECT 
  'Méthode 2: Via définition' as methode,
  schemaname as schema_name,
  viewname as view_name,
  LEFT(definition, 200) as definition_preview
FROM pg_views
WHERE schemaname = 'public'
  AND (definition LIKE '%SECURITY DEFINER%' 
       OR definition LIKE '%security definer%'
       OR definition LIKE '%SECURITY_DEFINER%')
ORDER BY viewname;

-- Résumé : Compte total des vues avec SECURITY DEFINER
SELECT 
  COUNT(DISTINCT view_name) as total_vues_avec_security_definer,
  string_agg(DISTINCT view_name, ', ' ORDER BY view_name) as liste_vues
FROM (
  SELECT c.relname as view_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND c.reloptions IS NOT NULL
    AND 'security_definer=true' = ANY(c.reloptions)
  
  UNION
  
  SELECT v.viewname as view_name
  FROM pg_views v
  WHERE v.schemaname = 'public'
    AND (v.definition LIKE '%SECURITY DEFINER%' 
         OR v.definition LIKE '%security definer%'
         OR v.definition LIKE '%SECURITY_DEFINER%')
) combined_views;
