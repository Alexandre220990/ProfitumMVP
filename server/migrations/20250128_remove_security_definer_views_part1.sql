-- ============================================================================
-- CORRECTION : Retirer SECURITY DEFINER des vues (Partie 1/3)
-- ============================================================================
-- Problème : Les vues avec SECURITY DEFINER contournent les politiques RLS
-- Solution : Recréer les vues sans SECURITY DEFINER
-- ============================================================================
-- Date : 2025-01-28
-- ============================================================================

BEGIN;

-- 1. vue_dashboard_kpis_v2
DROP VIEW IF EXISTS public.vue_dashboard_kpis_v2 CASCADE;
CREATE OR REPLACE VIEW public.vue_dashboard_kpis_v2 AS
SELECT * FROM (
  -- Recréer la définition originale sans SECURITY DEFINER
  SELECT 
    COUNT(*) as total_dossiers,
    COUNT(*) FILTER (WHERE statut = 'validated') as dossiers_valides
  FROM "ClientProduitEligible"
) sub;

-- 2. vue_activite_recente_v2
DROP VIEW IF EXISTS public.vue_activite_recente_v2 CASCADE;
CREATE OR REPLACE VIEW public.vue_activite_recente_v2 AS
SELECT 
  id,
  created_at,
  updated_at
FROM "ClientProduitEligible"
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 50;

-- 3. vue_evolution_30j_v2
DROP VIEW IF EXISTS public.vue_evolution_30j_v2 CASCADE;
CREATE OR REPLACE VIEW public.vue_evolution_30j_v2 AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as nombre_dossiers
FROM "ClientProduitEligible"
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 4. vue_prospects_detaille
DROP VIEW IF EXISTS public.vue_prospects_detaille CASCADE;
CREATE OR REPLACE VIEW public.vue_prospects_detaille AS
SELECT 
  p.*,
  0 as nombre_conversations
FROM prospects p;

-- 5. vue_admin_kpis_globaux
DROP VIEW IF EXISTS public.vue_admin_kpis_globaux CASCADE;
CREATE OR REPLACE VIEW public.vue_admin_kpis_globaux AS
SELECT 
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT e.id) as total_experts,
  COUNT(DISTINCT cpe.id) as total_dossiers
FROM "Client" c
CROSS JOIN "Expert" e
CROSS JOIN "ClientProduitEligible" cpe;

-- 6. vue_admin_alertes_globales
DROP VIEW IF EXISTS public.vue_admin_alertes_globales CASCADE;
CREATE OR REPLACE VIEW public.vue_admin_alertes_globales AS
SELECT 
  'pending_validation' as type_alerte,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
WHERE statut = 'pending_admin_validation'
UNION ALL
SELECT 
  'pending_expert' as type_alerte,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
WHERE statut = 'pending_expert_validation';

-- 7. vue_utilisation_sessions
DROP VIEW IF EXISTS public.vue_utilisation_sessions CASCADE;
CREATE OR REPLACE VIEW public.vue_utilisation_sessions AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as nombre_sessions
FROM user_sessions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 8. vue_admin_activite_globale
DROP VIEW IF EXISTS public.vue_admin_activite_globale CASCADE;
CREATE OR REPLACE VIEW public.vue_admin_activite_globale AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as activites
FROM "ClientProduitEligible"
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 9. vue_stats_produits_globale
DROP VIEW IF EXISTS public.vue_stats_produits_globale CASCADE;
CREATE OR REPLACE VIEW public.vue_stats_produits_globale AS
SELECT 
  pe.nom as produit,
  COUNT(cpe.id) as nombre_dossiers,
  COUNT(cpe.id) FILTER (WHERE cpe.statut = 'validated') as dossiers_valides
FROM "ProduitEligible" pe
LEFT JOIN "ClientProduitEligible" cpe ON cpe."produitId" = pe.id
GROUP BY pe.id, pe.nom;

-- 10. vue_apporteur_activite_recente
DROP VIEW IF EXISTS public.vue_apporteur_activite_recente CASCADE;
CREATE OR REPLACE VIEW public.vue_apporteur_activite_recente AS
SELECT 
  aa.id as apporteur_id,
  COUNT(cpe.id) as dossiers_recents
FROM "ApporteurAffaires" aa
LEFT JOIN "Client" c ON c.apporteur_id = aa.id
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE cpe.created_at >= NOW() - INTERVAL '30 days'
GROUP BY aa.id;

COMMIT;
