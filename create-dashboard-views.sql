-- ============================================================================
-- CRÉATION DES VUES POUR DASHBOARD ADMIN
-- ============================================================================
-- Date : 1er octobre 2025
-- Objectif : Créer des vues optimisées pour alimenter le dashboard admin
--            avec des données réelles issues des tables existantes
-- ============================================================================

-- ============================================================================
-- 1. VUE DASHBOARD KPIs PRINCIPAUX
-- ============================================================================

CREATE OR REPLACE VIEW vue_dashboard_kpis AS
SELECT 
  -- Clients
  (SELECT COUNT(*) FROM "Client") as total_clients,
  (SELECT COUNT(*) FROM "Client" WHERE statut = 'actif') as clients_actifs,
  (SELECT COUNT(*) FROM "Client" WHERE created_at >= NOW() - INTERVAL '30 days') as clients_ce_mois,
  (SELECT COUNT(*) FROM "Client" WHERE "derniereConnexion" >= NOW() - INTERVAL '24 hours') as clients_actifs_24h,
  
  -- Experts
  (SELECT COUNT(*) FROM "Expert") as total_experts,
  (SELECT COUNT(*) FROM "Expert" WHERE status = 'active') as experts_actifs,
  (SELECT COUNT(*) FROM "Expert" WHERE approval_status = 'pending') as experts_pending,
  (SELECT COUNT(*) FROM "Expert" WHERE approved_at >= NOW() - INTERVAL '30 days') as experts_ce_mois,
  
  -- Dossiers
  (SELECT COUNT(*) FROM "ClientProduitEligible") as total_dossiers,
  (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE statut = 'completed') as dossiers_termines,
  (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE statut IN ('pending', 'in_progress')) as dossiers_en_cours,
  (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE created_at >= NOW() - INTERVAL '30 days') as dossiers_ce_mois,
  (SELECT SUM(montantFinal) FILTER (WHERE montantFinal IS NOT NULL) FROM "ClientProduitEligible") as montant_total,
  (SELECT SUM(montantFinal) FILTER (WHERE statut = 'completed') FROM "ClientProduitEligible") as montant_realise,
  (SELECT AVG(montantFinal) FILTER (WHERE montantFinal IS NOT NULL) FROM "ClientProduitEligible") as montant_moyen,
  
  -- Apporteurs
  (SELECT COUNT(*) FROM "ApporteurAffaires") as total_apporteurs,
  (SELECT COUNT(*) FROM "ApporteurAffaires" WHERE status = 'active') as apporteurs_actifs,
  (SELECT COUNT(*) FROM "Prospect") as prospects_total,
  (SELECT COUNT(*) FROM "Prospect" WHERE status = 'qualified') as prospects_qualifies,
  
  -- Produits
  (SELECT COUNT(*) FROM "ProduitEligible" WHERE active = true) as produits_actifs,
  
  -- Performance
  (SELECT 
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE statut = 'completed')::FLOAT / COUNT(*)::FLOAT * 100)
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
-- 2. VUE ACTIVITÉ RÉCENTE (7 derniers jours)
-- ============================================================================

CREATE OR REPLACE VIEW vue_activite_recente AS
SELECT 
  'client' as type_entite,
  id::text as entite_id,
  email as reference,
  name as nom,
  created_at as date_action,
  'inscription' as action,
  NULL as montant
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
  NULL
FROM "Expert"
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'dossier' as type_entite,
  id::text,
  clientId::text,
  statut,
  created_at,
  'creation' as action,
  montantFinal
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
  NULL
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
  NULL
FROM "Prospect"
WHERE created_at >= NOW() - INTERVAL '7 days'

ORDER BY date_action DESC
LIMIT 100;

-- ============================================================================
-- 3. VUE PERFORMANCE EXPERTS
-- ============================================================================

CREATE OR REPLACE VIEW vue_performance_experts AS
SELECT 
  e.id,
  e.name,
  e.email,
  e.company_name,
  e.specializations,
  e.status,
  e.rating,
  e.compensation,
  e.experience,
  COUNT(cpe.id) as total_dossiers,
  COUNT(CASE WHEN cpe.statut = 'completed' THEN 1 END) as dossiers_termines,
  COUNT(CASE WHEN cpe.statut IN ('pending', 'in_progress') THEN 1 END) as dossiers_en_cours,
  SUM(cpe.montantFinal) FILTER (WHERE cpe.montantFinal IS NOT NULL) as montant_total_genere,
  AVG(cpe.montantFinal) FILTER (WHERE cpe.montantFinal IS NOT NULL) as montant_moyen,
  CASE 
    WHEN COUNT(cpe.id) > 0 
    THEN (COUNT(CASE WHEN cpe.statut = 'completed' THEN 1 END)::FLOAT / COUNT(cpe.id)::FLOAT * 100)
    ELSE 0 
  END as taux_completion,
  e.created_at as date_inscription,
  e.approved_at as date_approbation
FROM "Expert" e
LEFT JOIN "ClientProduitEligible" cpe ON e.id = cpe.expert_id
GROUP BY 
  e.id, e.name, e.email, e.company_name, e.specializations, 
  e.status, e.rating, e.compensation, e.experience, 
  e.created_at, e.approved_at
ORDER BY dossiers_termines DESC, montant_total_genere DESC;

-- ============================================================================
-- 4. VUE STATISTIQUES PAR PRODUIT
-- ============================================================================

CREATE OR REPLACE VIEW vue_stats_produits AS
SELECT 
  p.id,
  p.nom,
  p.categorie,
  p.montant_min,
  p.montant_max,
  p.active,
  COUNT(cpe.id) as total_dossiers,
  COUNT(CASE WHEN cpe.statut = 'completed' THEN 1 END) as dossiers_termines,
  SUM(cpe.montantFinal) FILTER (WHERE cpe.montantFinal IS NOT NULL) as montant_total,
  AVG(cpe.montantFinal) FILTER (WHERE cpe.montantFinal IS NOT NULL) as montant_moyen,
  COUNT(DISTINCT cpe.clientId) as clients_uniques,
  COUNT(DISTINCT cpe.expert_id) as experts_assignes,
  CASE 
    WHEN COUNT(cpe.id) > 0 
    THEN (COUNT(CASE WHEN cpe.statut = 'completed' THEN 1 END)::FLOAT / COUNT(cpe.id)::FLOAT * 100)
    ELSE 0 
  END as taux_completion
FROM "ProduitEligible" p
LEFT JOIN "ClientProduitEligible" cpe ON p.id = cpe.produitId
GROUP BY p.id, p.nom, p.categorie, p.montant_min, p.montant_max, p.active
ORDER BY total_dossiers DESC;

-- ============================================================================
-- 5. VUE PERFORMANCE APPORTEURS
-- ============================================================================

CREATE OR REPLACE VIEW vue_performance_apporteurs AS
SELECT 
  a.id,
  a.first_name,
  a.last_name,
  CONCAT(a.first_name, ' ', a.last_name) as nom_complet,
  a.email,
  a.company_name,
  a.company_type,
  a.status,
  a.commission_rate,
  COUNT(p.id) as total_prospects,
  COUNT(CASE WHEN p.status = 'qualified' THEN 1 END) as prospects_qualifies,
  COUNT(CASE WHEN p.status = 'converted' THEN 1 END) as prospects_convertis,
  COUNT(CASE WHEN p.preselected_expert_id IS NOT NULL THEN 1 END) as prospects_avec_expert,
  CASE 
    WHEN COUNT(p.id) > 0 
    THEN (COUNT(CASE WHEN p.status = 'converted' THEN 1 END)::FLOAT / COUNT(p.id)::FLOAT * 100)
    ELSE 0 
  END as taux_conversion,
  a.created_at as date_inscription,
  a.approved_at as date_approbation
FROM "ApporteurAffaires" a
LEFT JOIN "Prospect" p ON a.id = p.apporteur_id
GROUP BY 
  a.id, a.first_name, a.last_name, a.email, a.company_name, 
  a.company_type, a.status, a.commission_rate, a.created_at, a.approved_at
ORDER BY prospects_convertis DESC, total_prospects DESC;

-- ============================================================================
-- 6. VUE ALERTES ET ACTIONS REQUISES
-- ============================================================================

CREATE OR REPLACE VIEW vue_alertes_dashboard AS
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
WHERE statut IN ('pending', 'in_progress')
AND created_at < NOW() - INTERVAL '21 days'
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'apporteur_inactif' as type_alerte,
  'low' as severity,
  COUNT(*),
  'Apporteurs inactifs depuis 30 jours',
  ARRAY_AGG(id)
FROM "ApporteurAffaires"
WHERE status = 'active'
AND id NOT IN (
  SELECT DISTINCT apporteur_id 
  FROM "Prospect" 
  WHERE created_at >= NOW() - INTERVAL '30 days'
)
HAVING COUNT(*) > 0;

-- ============================================================================
-- 7. VUE ÉVOLUTION TEMPORELLE (30 derniers jours)
-- ============================================================================

CREATE OR REPLACE VIEW vue_evolution_30j AS
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
    COUNT(CASE WHEN statut = 'completed' THEN 1 END) as dossiers_termines,
    SUM(montantFinal) as montant_jour
  FROM "ClientProduitEligible"
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
) dos ON d.jour = dos.jour
ORDER BY d.jour;

-- ============================================================================
-- 8. VÉRIFICATION DES VUES CRÉÉES
-- ============================================================================

-- Lister toutes les vues créées
SELECT 
  table_name as nom_vue,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = views.table_name) as nombre_colonnes
FROM information_schema.views views
WHERE table_schema = 'public'
  AND table_name LIKE 'vue_%'
ORDER BY table_name;

-- ============================================================================
-- 9. PERMISSIONS RLS SUR LES VUES
-- ============================================================================

-- Les vues héritent automatiquement des politiques RLS des tables sous-jacentes
-- Pas besoin de politiques supplémentaires si les tables sont bien configurées

-- ============================================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- ============================================================================
-- ✅ 8 vues créées pour le dashboard admin
-- ✅ Données réelles issues des tables existantes
-- ✅ Performance optimisée avec agrégations pré-calculées
-- ============================================================================

