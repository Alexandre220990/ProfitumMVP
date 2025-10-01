-- ============================================================================
-- CRÉATION DES VUES POUR DASHBOARD ADMIN (VERSION CORRIGÉE)
-- ============================================================================
-- Date : 1er octobre 2025
-- Objectif : Vues optimisées basées sur la VRAIE structure de la BDD
-- ============================================================================
-- ⚠️ ATTENTION : Colonnes camelCase nécessitent des guillemets doubles !
-- ============================================================================

-- ============================================================================
-- 1. VUE DASHBOARD KPIs PRINCIPAUX (CORRIGÉE)
-- ============================================================================

CREATE OR REPLACE VIEW vue_dashboard_kpis_v2 AS
SELECT 
  -- ===== CLIENTS =====
  (SELECT COUNT(*) FROM "Client") as total_clients,
  
  (SELECT COUNT(*) FROM "Client" 
   WHERE statut = 'actif') as clients_actifs,
  
  (SELECT COUNT(*) FROM "Client" 
   WHERE created_at >= NOW() - INTERVAL '30 days') as clients_ce_mois,
  
  (SELECT COUNT(*) FROM "Client" 
   WHERE "derniereConnexion" >= NOW() - INTERVAL '24 hours') as clients_actifs_24h,
  
  -- ===== EXPERTS =====
  (SELECT COUNT(*) FROM "Expert") as total_experts,
  
  (SELECT COUNT(*) FROM "Expert" 
   WHERE status = 'active') as experts_actifs,
  
  (SELECT COUNT(*) FROM "Expert" 
   WHERE approval_status = 'pending') as experts_pending,
  
  (SELECT COUNT(*) FROM "Expert" 
   WHERE approved_at >= NOW() - INTERVAL '30 days') as experts_ce_mois,
  
  -- ===== DOSSIERS =====
  (SELECT COUNT(*) FROM "ClientProduitEligible") as total_dossiers,
  
  (SELECT COUNT(*) FROM "ClientProduitEligible" 
   WHERE statut = 'termine') as dossiers_termines,
  
  (SELECT COUNT(*) FROM "ClientProduitEligible" 
   WHERE statut IN ('eligible', 'en_cours')) as dossiers_en_cours,
  
  (SELECT COUNT(*) FROM "ClientProduitEligible" 
   WHERE created_at >= NOW() - INTERVAL '30 days') as dossiers_ce_mois,
  
  -- ===== MONTANTS (camelCase avec guillemets) =====
  (SELECT COALESCE(SUM("montantFinal"), 0) 
   FROM "ClientProduitEligible" 
   WHERE "montantFinal" IS NOT NULL) as montant_total,
  
  (SELECT COALESCE(SUM("montantFinal"), 0) 
   FROM "ClientProduitEligible" 
   WHERE statut = 'termine') as montant_realise,
  
  (SELECT COALESCE(AVG("montantFinal"), 0) 
   FROM "ClientProduitEligible" 
   WHERE "montantFinal" IS NOT NULL) as montant_moyen,
  
  -- ===== APPORTEURS =====
  (SELECT COUNT(*) FROM "ApporteurAffaires") as total_apporteurs,
  
  (SELECT COUNT(*) FROM "ApporteurAffaires" 
   WHERE status = 'active') as apporteurs_actifs,
  
  (SELECT COUNT(*) FROM "Prospect") as prospects_total,
  
  (SELECT COUNT(*) FROM "Prospect" 
   WHERE status = 'qualified') as prospects_qualifies,
  
  -- ===== PRODUITS =====
  (SELECT COUNT(*) FROM "ProduitEligible" 
   WHERE active = true) as produits_actifs,
  
  -- ===== PERFORMANCE =====
  (SELECT 
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE statut = 'termine')::FLOAT / COUNT(*)::FLOAT * 100)
      ELSE 0 
    END 
   FROM "ClientProduitEligible"
  ) as taux_completion,
  
  (SELECT 
    CASE 
      WHEN (SELECT COUNT(*) FROM "Client" WHERE created_at >= NOW() - INTERVAL '30 days') > 0
      THEN ((SELECT COUNT(*) FROM "ClientProduitEligible" WHERE created_at >= NOW() - INTERVAL '30 days')::FLOAT / 
            (SELECT COUNT(*) FROM "Client" WHERE created_at >= NOW() - INTERVAL '30 days')::FLOAT * 100)
      ELSE 0
    END
  ) as taux_conversion;

-- ============================================================================
-- 2. VUE ACTIVITÉ RÉCENTE (CORRIGÉE)
-- ============================================================================

CREATE OR REPLACE VIEW vue_activite_recente_v2 AS
SELECT 
  'client' as type_entite,
  id::text as entite_id,
  email as reference,
  name as nom,
  created_at as date_action,
  'inscription' as action,
  NULL::numeric as montant
FROM "Client"
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'expert' as type_entite,
  id::text,
  email,
  name,
  created_at,
  'inscription' as action,
  NULL::numeric
FROM "Expert"
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'dossier' as type_entite,
  id::text,
  "clientId"::text,
  statut,
  created_at,
  'creation' as action,
  "montantFinal"
FROM "ClientProduitEligible"
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'apporteur' as type_entite,
  id::text,
  email,
  CONCAT(first_name, ' ', last_name),
  created_at,
  'inscription' as action,
  NULL::numeric
FROM "ApporteurAffaires"
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'prospect' as type_entite,
  id::text,
  decision_maker_email,
  company_name,
  created_at,
  'creation' as action,
  NULL::numeric
FROM "Prospect"
WHERE created_at >= NOW() - INTERVAL '7 days'

ORDER BY date_action DESC
LIMIT 100;

-- ============================================================================
-- 3. VUE STATISTIQUES PAR PRODUIT (CORRIGÉE)
-- ============================================================================

CREATE OR REPLACE VIEW vue_stats_produits_v2 AS
SELECT 
  p.id,
  p.nom,
  p.categorie,
  p.montant_min,
  p.montant_max,
  p.active,
  COUNT(cpe.id) as total_dossiers,
  COUNT(CASE WHEN cpe.statut = 'termine' THEN 1 END) as dossiers_termines,
  COALESCE(SUM(cpe."montantFinal"), 0) as montant_total,
  COALESCE(AVG(cpe."montantFinal"), 0) as montant_moyen,
  COUNT(DISTINCT cpe."clientId") as clients_uniques,
  COUNT(DISTINCT cpe.expert_id) as experts_assignes,
  CASE 
    WHEN COUNT(cpe.id) > 0 
    THEN (COUNT(CASE WHEN cpe.statut = 'termine' THEN 1 END)::FLOAT / COUNT(cpe.id)::FLOAT * 100)
    ELSE 0 
  END as taux_completion
FROM "ProduitEligible" p
LEFT JOIN "ClientProduitEligible" cpe ON p.id = cpe."produitId"
GROUP BY p.id, p.nom, p.categorie, p.montant_min, p.montant_max, p.active
ORDER BY total_dossiers DESC;

-- ============================================================================
-- 4. VUE SESSIONS ACTIVES (UTILISE TABLE EXISTANTE)
-- ============================================================================

CREATE OR REPLACE VIEW vue_sessions_actives AS
SELECT 
  user_type,
  COUNT(*) as sessions_actives,
  COUNT(DISTINCT user_id) as utilisateurs_uniques
FROM "user_sessions"
WHERE last_activity >= NOW() - INTERVAL '5 minutes'
  AND expires_at > NOW()
GROUP BY user_type;

-- ============================================================================
-- 5. VUE MÉTRIQUES SYSTÈME (UTILISE TABLE EXISTANTE)
-- ============================================================================

CREATE OR REPLACE VIEW vue_metriques_systeme_recentes AS
SELECT 
  metric_type,
  metric_name,
  AVG(metric_value) as valeur_moyenne,
  MAX(metric_value) as valeur_max,
  MIN(metric_value) as valeur_min,
  COUNT(*) as nb_mesures
FROM "system_metrics"
WHERE "timestamp" >= NOW() - INTERVAL '1 hour'
GROUP BY metric_type, metric_name
ORDER BY metric_type, metric_name;

-- ============================================================================
-- 6. VUE ALERTES DASHBOARD (CORRIGÉE)
-- ============================================================================

CREATE OR REPLACE VIEW vue_alertes_dashboard_v2 AS
SELECT 
  'expert_pending' as type_alerte,
  'warning' as severity,
  COUNT(*) as nombre,
  'Experts en attente de validation' as message,
  ARRAY_AGG(id) as entites_concernees
FROM "Expert"
WHERE approval_status = 'pending'
AND created_at < NOW() - INTERVAL '48 hours'
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'dossier_retard' as type_alerte,
  'high' as severity,
  COUNT(*),
  'Dossiers en retard (> 21 jours)',
  ARRAY_AGG(id)
FROM "ClientProduitEligible"
WHERE statut IN ('eligible', 'en_cours')
AND created_at < NOW() - INTERVAL '21 days'
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'client_inactif' as type_alerte,
  'low' as severity,
  COUNT(*),
  'Clients inactifs depuis 30 jours',
  ARRAY_AGG(id)
FROM "Client"
WHERE statut = 'actif'
AND ("derniereConnexion" IS NULL OR "derniereConnexion" < NOW() - INTERVAL '30 days')
HAVING COUNT(*) > 0;

-- ============================================================================
-- 7. VUE ÉVOLUTION TEMPORELLE (30 jours - CORRIGÉE)
-- ============================================================================

CREATE OR REPLACE VIEW vue_evolution_30j_v2 AS
WITH dates AS (
  SELECT generate_series(
    DATE(NOW() - INTERVAL '30 days'),
    DATE(NOW()),
    '1 day'::interval
  )::date as jour
)
SELECT 
  d.jour,
  COALESCE(c.nouveaux_clients, 0) as nouveaux_clients,
  COALESCE(e.nouveaux_experts, 0) as nouveaux_experts,
  COALESCE(dos.nouveaux_dossiers, 0) as nouveaux_dossiers,
  COALESCE(dos.dossiers_termines, 0) as dossiers_termines,
  COALESCE(dos.montant_jour, 0) as montant_jour
FROM dates d
LEFT JOIN (
  SELECT DATE(created_at) as jour, COUNT(*) as nouveaux_clients
  FROM "Client"
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
) c ON d.jour = c.jour
LEFT JOIN (
  SELECT DATE(created_at) as jour, COUNT(*) as nouveaux_experts
  FROM "Expert"
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
) e ON d.jour = e.jour
LEFT JOIN (
  SELECT 
    DATE(created_at) as jour, 
    COUNT(*) as nouveaux_dossiers,
    COUNT(CASE WHEN statut = 'termine' THEN 1 END) as dossiers_termines,
    SUM("montantFinal") as montant_jour
  FROM "ClientProduitEligible"
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
) dos ON d.jour = dos.jour
ORDER BY d.jour;

-- ============================================================================
-- 8. VUE UTILISATION DES SESSIONS (RÉUTILISE TABLE EXISTANTE)
-- ============================================================================

CREATE OR REPLACE VIEW vue_utilisation_sessions AS
SELECT 
  DATE("timestamp") as jour,
  COUNT(*) as total_mesures,
  AVG(metric_value) as valeur_moyenne
FROM "system_metrics"
WHERE metric_type = 'session'
  AND "timestamp" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("timestamp")
ORDER BY jour DESC;

-- ============================================================================
-- VÉRIFICATION DES VUES CRÉÉES
-- ============================================================================

SELECT 
  table_name as nom_vue,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = views.table_name) as nombre_colonnes
FROM information_schema.views views
WHERE table_schema = 'public'
  AND table_name LIKE 'vue_%'
ORDER BY table_name;

-- ============================================================================
-- TEST DES VUES
-- ============================================================================

-- Tester la vue KPIs
SELECT * FROM vue_dashboard_kpis_v2;

-- Tester la vue activité
SELECT * FROM vue_activite_recente_v2 LIMIT 10;

-- Tester la vue stats produits
SELECT * FROM vue_stats_produits_v2;

-- Tester la vue sessions
SELECT * FROM vue_sessions_actives;

-- Tester la vue alertes
SELECT * FROM vue_alertes_dashboard_v2;

-- ============================================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- ============================================================================
-- ✅ Vues créées avec les VRAIES colonnes de la BDD
-- ✅ Respect de la casse (camelCase avec guillemets)
-- ✅ Réutilisation des tables existantes (user_sessions, system_metrics)
-- ✅ Compatible avec la structure réelle de production
-- ============================================================================

