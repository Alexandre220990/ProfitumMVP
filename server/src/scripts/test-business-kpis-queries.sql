-- =====================================================
-- TEST DES REQUÊTES KPIs MÉTIER
-- Vérification des bonnes références de colonnes
-- =====================================================

-- ===== 1. TEST DES DONNÉES CLIENTS =====

SELECT 
  '📊 DONNÉES CLIENTS' as section,
  COUNT(*) as total_clients,
  COUNT(CASE WHEN statut = 'actif' THEN 1 END) as active_clients,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_clients_this_month
FROM "Client";

-- ===== 2. TEST DES DONNÉES EXPERTS =====

SELECT 
  '👨‍💼 DONNÉES EXPERTS' as section,
  COUNT(*) as total_experts,
  COUNT(CASE WHEN "approval_status" = 'pending' THEN 1 END) as pending_experts,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_experts
FROM "Expert";

-- ===== 3. TEST DES DONNÉES DOSSIERS =====

SELECT 
  '📋 DONNÉES DOSSIERS' as section,
  COUNT(*) as total_dossiers,
  COUNT(CASE WHEN statut = 'opportunite' THEN 1 END) as dossiers_opportunites,
  COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as dossiers_en_cours,
  COUNT(CASE WHEN statut = 'termine' THEN 1 END) as dossiers_termines
FROM "ClientProduitEligible";

-- ===== 4. TEST DES MONTANTS FINANCIERS =====

SELECT 
  '💰 MONTANTS FINANCIERS' as section,
  COALESCE(SUM("montantFinal"), 0) as montant_total_eligible,
  COALESCE(SUM(CASE WHEN statut = 'opportunite' THEN "montantFinal" ELSE 0 END), 0) as gains_potentiels,
  COALESCE(SUM(CASE WHEN statut = 'termine' THEN "montantFinal" ELSE 0 END), 0) as gains_realises
FROM "ClientProduitEligible"
WHERE "montantFinal" IS NOT NULL;

-- ===== 5. TEST DES DONNÉES DÉTAILLÉES =====

-- Clients récents
SELECT 
  '👥 CLIENTS RÉCENTS' as section,
  id,
  name,
  "company_name",
  statut,
  created_at
FROM "Client"
ORDER BY created_at DESC
LIMIT 5;

-- Experts en attente
SELECT 
  '⏳ EXPERTS EN ATTENTE' as section,
  id,
  name,
  email,
  "approval_status",
  specializations
FROM "Expert"
WHERE "approval_status" = 'pending'
ORDER BY created_at DESC;

-- Dossiers opportunités
SELECT 
  '🎯 DOSSIERS OPPORTUNITÉS' as section,
  cpe.id,
  cpe.statut,
  cpe."montantFinal",
  cpe.progress,
  c.name as client_name,
  c."company_name" as client_company,
  pe.nom as produit_name
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE cpe.statut = 'opportunite'
ORDER BY cpe.created_at DESC;

-- ===== 6. CALCUL DES TENDANCES =====

WITH client_stats AS (
  SELECT 
    COUNT(*) as total_clients,
    COUNT(CASE WHEN statut = 'actif' THEN 1 END) as active_clients,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_clients_month
  FROM "Client"
),
expert_stats AS (
  SELECT 
    COUNT(*) as total_experts,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_experts
  FROM "Expert"
),
dossier_stats AS (
  SELECT 
    COUNT(*) as total_dossiers,
    COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as dossiers_en_cours
  FROM "ClientProduitEligible"
)
SELECT 
  '📈 TENDANCES CALCULÉES' as section,
  cs.total_clients,
  cs.active_clients,
  cs.new_clients_month,
  es.total_experts,
  es.active_experts,
  ds.total_dossiers,
  ds.dossiers_en_cours,
  CASE 
    WHEN cs.total_clients > 0 THEN ROUND((cs.new_clients_month::DECIMAL / cs.total_clients) * 100, 1)
    ELSE 0 
  END as croissance_clients_pourcent,
  CASE 
    WHEN ds.total_dossiers > 0 THEN ROUND((ds.dossiers_en_cours::DECIMAL / ds.total_dossiers) * 100, 1)
    ELSE 0 
  END as taux_conversion_pourcent,
  ROUND(
    ((cs.active_clients::DECIMAL / GREATEST(cs.total_clients, 1)) * 0.4 + 
     (es.active_experts::DECIMAL / GREATEST(es.total_experts, 1)) * 0.3 + 
     (ds.dossiers_en_cours::DECIMAL / GREATEST(ds.total_dossiers, 1)) * 0.3) * 100, 1
  ) as performance_globale_pourcent
FROM client_stats cs
CROSS JOIN expert_stats es
CROSS JOIN dossier_stats ds;

-- ===== 7. VÉRIFICATION DES RELATIONS =====

SELECT 
  '🔗 VÉRIFICATION RELATIONS' as section,
  'ClientProduitEligible' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN "clientId" IS NOT NULL THEN 1 END) as with_client,
  COUNT(CASE WHEN "produitId" IS NOT NULL THEN 1 END) as with_produit,
  COUNT(CASE WHEN "expert_id" IS NOT NULL THEN 1 END) as with_expert
FROM "ClientProduitEligible";

-- ===== 8. RAPPORT FINAL DE CONFORMITÉ =====

WITH kpis_summary AS (
  SELECT 
    (SELECT COUNT(*) FROM "Client") as total_clients,
    (SELECT COUNT(*) FROM "Expert") as total_experts,
    (SELECT COUNT(*) FROM "ClientProduitEligible") as total_dossiers,
    (SELECT COALESCE(SUM("montantFinal"), 0) FROM "ClientProduitEligible" WHERE "montantFinal" IS NOT NULL) as montant_total
)
SELECT 
  '🎯 RAPPORT FINAL KPIs' as section,
  'Conformité des données' as test,
  total_clients as clients_count,
  total_experts as experts_count,
  total_dossiers as dossiers_count,
  montant_total as montant_total_eligible,
  CASE 
    WHEN total_clients > 0 AND total_experts > 0 AND total_dossiers > 0 
    THEN '✅ Données complètes'
    WHEN total_clients > 0 OR total_experts > 0 OR total_dossiers > 0 
    THEN '⚠️ Données partielles'
    ELSE '❌ Aucune donnée'
  END as status
FROM kpis_summary; 