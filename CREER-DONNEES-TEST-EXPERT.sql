-- ============================================================================
-- CRÉER DONNÉES DE TEST POUR DASHBOARD EXPERT
-- ============================================================================
-- Expert ID: 2678526c-488f-45a1-818a-f9ce48882d26
-- Email: expert@profitum.fr
--
-- Ce script crée des données de test pour tester toutes les fonctionnalités
-- du dashboard expert optimisé
-- ============================================================================

-- =====================================================
-- 1. ASSIGNER DES DOSSIERS À L'EXPERT
-- =====================================================

-- Assigner 3 prospects éligibles (pour scoring et alertes)
UPDATE "ClientProduitEligible" 
SET 
  expert_id = '2678526c-488f-45a1-818a-f9ce48882d26',
  "montantFinal" = 50000,
  statut = 'eligible',
  validation_state = 'pending_expert_validation',
  updated_at = NOW() - INTERVAL '2 days'
WHERE id IN (
  SELECT cpe.id 
  FROM "ClientProduitEligible" cpe
  JOIN "Client" c ON c.id = cpe."clientId"
  WHERE c.apporteur_id IS NOT NULL
    AND cpe.expert_id IS NULL
  LIMIT 1
);

UPDATE "ClientProduitEligible" 
SET 
  expert_id = '2678526c-488f-45a1-818a-f9ce48882d26',
  "montantFinal" = 30000,
  statut = 'eligible',
  validation_state = 'pending_expert_validation',
  updated_at = NOW() - INTERVAL '5 days'
WHERE id IN (
  SELECT cpe.id 
  FROM "ClientProduitEligible" cpe
  JOIN "Client" c ON c.id = cpe."clientId"
  WHERE c.apporteur_id IS NOT NULL
    AND cpe.expert_id IS NULL
  LIMIT 1
);

UPDATE "ClientProduitEligible" 
SET 
  expert_id = '2678526c-488f-45a1-818a-f9ce48882d26',
  "montantFinal" = 25000,
  statut = 'eligible',
  validation_state = 'pending_expert_validation',
  updated_at = NOW() - INTERVAL '1 day'
WHERE id IN (
  SELECT cpe.id 
  FROM "ClientProduitEligible" cpe
  JOIN "Client" c ON c.id = cpe."clientId"
  WHERE c.apporteur_id IS NOT NULL
    AND cpe.expert_id IS NULL
  LIMIT 1
);

-- Assigner 2 dossiers en cours (pour section clients)
UPDATE "ClientProduitEligible" 
SET 
  expert_id = '2678526c-488f-45a1-818a-f9ce48882d26',
  "montantFinal" = 40000,
  statut = 'en_cours',
  validation_state = 'eligibility_validated',
  updated_at = NOW() - INTERVAL '6 days'  -- Dossier bloqué = Alerte
WHERE id IN (
  SELECT cpe.id 
  FROM "ClientProduitEligible" cpe
  JOIN "Client" c ON c.id = cpe."clientId"
  WHERE c.apporteur_id IS NOT NULL
    AND cpe.expert_id IS NULL
  LIMIT 1
);

UPDATE "ClientProduitEligible" 
SET 
  expert_id = '2678526c-488f-45a1-818a-f9ce48882d26',
  "montantFinal" = 35000,
  statut = 'en_cours',
  validation_state = 'eligibility_validated',
  updated_at = NOW() - INTERVAL '3 days'
WHERE id IN (
  SELECT cpe.id 
  FROM "ClientProduitEligible" cpe
  JOIN "Client" c ON c.id = cpe."clientId"
  WHERE c.apporteur_id IS NOT NULL
    AND cpe.expert_id IS NULL
  LIMIT 1
);

-- Assigner 1 dossier terminé (pour revenue pipeline)
UPDATE "ClientProduitEligible" 
SET 
  expert_id = '2678526c-488f-45a1-818a-f9ce48882d26',
  "montantFinal" = 60000,
  statut = 'termine',
  validation_state = 'completed',
  updated_at = NOW() - INTERVAL '10 days'
WHERE id IN (
  SELECT cpe.id 
  FROM "ClientProduitEligible" cpe
  WHERE cpe.expert_id IS NULL
  LIMIT 1
);

-- =====================================================
-- 2. CRÉER DES RDV POUR ALERTES
-- =====================================================

-- RDV demain non confirmé (ALERTE CRITIQUE)
INSERT INTO "RDV" (
  client_id,
  expert_id,
  scheduled_date,
  scheduled_time,
  status,
  meeting_type,
  created_by,
  title,
  duration_minutes,
  created_at
)
SELECT 
  cpe."clientId",
  '2678526c-488f-45a1-818a-f9ce48882d26',
  CURRENT_DATE + 1,
  '14:00',
  'proposed',  -- Non confirmé = Alerte
  'video',
  '2678526c-488f-45a1-818a-f9ce48882d26',
  'RDV Visio - Présentation produit',
  60,
  NOW()
FROM "ClientProduitEligible" cpe
WHERE cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26'
  AND cpe.statut = 'eligible'
LIMIT 1;

-- RDV dans 3 jours confirmé (pas d'alerte)
INSERT INTO "RDV" (
  client_id,
  expert_id,
  scheduled_date,
  scheduled_time,
  status,
  meeting_type,
  created_by,
  title,
  duration_minutes,
  created_at
)
SELECT 
  cpe."clientId",
  '2678526c-488f-45a1-818a-f9ce48882d26',
  CURRENT_DATE + 3,
  '10:00',
  'confirmed',  -- Confirmé = OK
  'physical',
  '2678526c-488f-45a1-818a-f9ce48882d26',
  'RDV Physique - Audit complet',
  90,
  NOW()
FROM "ClientProduitEligible" cpe
WHERE cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26'
  AND cpe.statut = 'en_cours'
LIMIT 1;

-- =====================================================
-- 3. VÉRIFIER LES DONNÉES CRÉÉES
-- =====================================================

-- Vérifier les CPE assignés
SELECT 
  cpe.id,
  c.company_name as client,
  pe.nom as produit,
  cpe.statut,
  cpe."montantFinal" as montant,
  cpe.updated_at,
  aa.company_name as apporteur
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitEligibleId"
LEFT JOIN "ApporteurAffaires" aa ON aa.id = c.apporteur_id
WHERE cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26'
ORDER BY cpe.statut, cpe.updated_at DESC;

-- Vérifier les RDV créés
SELECT 
  r.id,
  r.scheduled_date,
  r.scheduled_time,
  r.status,
  r.meeting_type,
  c.company_name as client
FROM "RDV" r
JOIN "Client" c ON c.id = r.client_id
WHERE r.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26'
ORDER BY r.scheduled_date, r.scheduled_time;

-- =====================================================
-- 4. COMPTEURS POUR VÉRIFICATION
-- =====================================================

-- KPIs attendus
SELECT 
  COUNT(DISTINCT cpe."clientId") as clients_actifs,
  COUNT(CASE WHEN cpe.statut = 'en_cours' THEN 1 END) as dossiers_en_cours,
  COUNT(CASE WHEN cpe.statut = 'eligible' THEN 1 END) as prospects,
  COUNT(DISTINCT c.apporteur_id) as apporteurs_actifs
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
WHERE cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26'
  AND cpe.statut IN ('eligible', 'en_cours');

-- Revenue Pipeline attendu
SELECT 
  COUNT(CASE WHEN statut = 'eligible' THEN 1 END) as prospects_count,
  SUM(CASE WHEN statut = 'eligible' THEN "montantFinal" ELSE 0 END) as prospects_montant,
  COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as en_signature_count,
  SUM(CASE WHEN statut = 'en_cours' THEN "montantFinal" ELSE 0 END) as en_signature_montant,
  COUNT(CASE WHEN statut = 'termine' THEN 1 END) as signes_count,
  SUM(CASE WHEN statut = 'termine' THEN "montantFinal" ELSE 0 END) as signes_montant
FROM "ClientProduitEligible"
WHERE expert_id = '2678526c-488f-45a1-818a-f9ce48882d26';

-- =====================================================
-- 5. SCORES DE PRIORITÉ ATTENDUS (Simulation)
-- =====================================================

SELECT 
  cpe.id,
  c.company_name as client,
  pe.nom as produit,
  cpe."montantFinal" as montant,
  DATE_PART('day', NOW() - cpe.updated_at) as jours_depuis_contact,
  
  -- Calcul du score (identique à l'API)
  CASE 
    WHEN DATE_PART('day', NOW() - cpe.updated_at) <= 1 THEN 10
    WHEN DATE_PART('day', NOW() - cpe.updated_at) <= 3 THEN 20
    WHEN DATE_PART('day', NOW() - cpe.updated_at) <= 7 THEN 30
    ELSE 40
  END as urgence_score,
  
  CASE 
    WHEN cpe."montantFinal" >= 50000 THEN 30
    WHEN cpe."montantFinal" >= 30000 THEN 25
    WHEN cpe."montantFinal" >= 15000 THEN 20
    WHEN cpe."montantFinal" >= 5000 THEN 15
    ELSE 10
  END as valeur_score,
  
  CASE 
    WHEN cpe.statut = 'en_cours' THEN 20
    WHEN cpe.validation_state = 'eligibility_validated' THEN 15
    ELSE 10
  END as probabilite_score,
  
  CASE 
    WHEN cpe.validation_state = 'eligibility_validated' THEN 10
    WHEN cpe.validation_state = 'pending_expert_validation' THEN 5
    ELSE 3
  END as facilite_score,
  
  -- Score total
  (
    CASE 
      WHEN DATE_PART('day', NOW() - cpe.updated_at) <= 1 THEN 10
      WHEN DATE_PART('day', NOW() - cpe.updated_at) <= 3 THEN 20
      WHEN DATE_PART('day', NOW() - cpe.updated_at) <= 7 THEN 30
      ELSE 40
    END +
    CASE 
      WHEN cpe."montantFinal" >= 50000 THEN 30
      WHEN cpe."montantFinal" >= 30000 THEN 25
      WHEN cpe."montantFinal" >= 15000 THEN 20
      WHEN cpe."montantFinal" >= 5000 THEN 15
      ELSE 10
    END +
    CASE 
      WHEN cpe.statut = 'en_cours' THEN 20
      WHEN cpe.validation_state = 'eligibility_validated' THEN 15
      ELSE 10
    END +
    CASE 
      WHEN cpe.validation_state = 'eligibility_validated' THEN 10
      WHEN cpe.validation_state = 'pending_expert_validation' THEN 5
      ELSE 3
    END
  ) as priority_score

FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitEligibleId"
WHERE cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26'
  AND cpe.statut IN ('eligible', 'en_cours')
ORDER BY priority_score DESC;

-- =====================================================
-- RÉSULTATS ATTENDUS
-- =====================================================

-- KPIs Dashboard:
-- • Clients actifs: 5
-- • RDV cette semaine: 2
-- • Dossiers en cours: 2
-- • Apporteurs actifs: ~3

-- Alertes attendues:
-- 🔴 1 RDV non confirmé demain (CRITIQUE)
-- 🔴 1 Dossier bloqué 6 jours (CRITIQUE)

-- Revenue Pipeline:
-- • Prospects: 3 dossiers, 105K€, potentiel 31.5K€ (30%)
-- • En signature: 2 dossiers, 75K€, potentiel 63.75K€ (85%)
-- • Signés: 1 dossier, 60K€, commission 6K€ (10%)
-- • TOTAL: ~101K€

-- Dossiers priorisés (ordre attendu):
-- 1. 50K€ + 2j contact = Score ~75 🔴
-- 2. 40K€ + 6j contact = Score ~70 🟠
-- 3. 30K€ + 5j contact = Score ~65 🟡

-- =====================================================
-- NETTOYER LES DONNÉES DE TEST (si besoin)
-- =====================================================

/*
-- Désassigner tous les CPE de l'expert
UPDATE "ClientProduitEligible" 
SET expert_id = NULL
WHERE expert_id = '2678526c-488f-45a1-818a-f9ce48882d26';

-- Supprimer les RDV de test
DELETE FROM "RDV" 
WHERE expert_id = '2678526c-488f-45a1-818a-f9ce48882d26';
*/

