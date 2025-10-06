-- ============================================================================
-- VUES RECOMMANDÉES POUR LE DASHBOARD APPORTEUR
-- ============================================================================
-- Ces vues sont basées sur l'analyse des données existantes et des besoins métier

-- ===== 1. VUE DASHBOARD PRINCIPAL =====
-- Supprimer la vue existante si elle existe
DROP VIEW IF EXISTS vue_apporteur_dashboard_principal CASCADE;

CREATE VIEW vue_apporteur_dashboard_principal AS
SELECT 
    aa.id as apporteur_id,
    aa.first_name,
    aa.last_name,
    aa.email,
    aa.company_name,
    aa.status as apporteur_status,
    
    -- Statistiques clients/prospects
    COUNT(DISTINCT c.id) as total_clients,
    COUNT(DISTINCT CASE WHEN c.status = 'prospect' THEN c.id END) as total_prospects,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as total_active_clients,
    COUNT(DISTINCT CASE WHEN c.status = 'converted' THEN c.id END) as total_converted,
    
    -- Statistiques dossiers
    COUNT(DISTINCT d.id) as total_dossiers,
    COUNT(DISTINCT CASE WHEN d.status = 'pending' THEN d.id END) as dossiers_en_cours,
    COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) as dossiers_acceptes,
    COUNT(DISTINCT CASE WHEN d.status = 'rejected' THEN d.id END) as dossiers_refuses,
    
    -- Statistiques financières
    COALESCE(SUM(d.montant), 0) as total_montant,
    COALESCE(SUM(CASE WHEN d.status = 'completed' THEN d.montant ELSE 0 END), 0) as total_montant_accepte,
    COALESCE(AVG(d.montant), 0) as montant_moyen_demande,
    
    -- Statistiques temporelles
    COUNT(DISTINCT CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN c.id END) as nouveaux_clients_30j,
    COUNT(DISTINCT CASE WHEN d.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN d.id END) as nouveaux_dossiers_30j,
    
    -- Calculs de performance
    CASE 
        WHEN COUNT(DISTINCT c.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN c.status = 'converted' THEN c.id END)::DECIMAL / COUNT(DISTINCT c.id)::DECIMAL) * 100, 2)
        ELSE 0 
    END as taux_conversion_pourcent,
    
    CASE 
        WHEN COUNT(DISTINCT d.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END)::DECIMAL / COUNT(DISTINCT d.id)::DECIMAL) * 100, 2)
        ELSE 0 
    END as taux_acceptation_dossiers_pourcent

FROM "ApporteurAffaires" aa
LEFT JOIN "Client" c ON aa.id = c.apporteur_id
LEFT JOIN "Dossier" d ON c.id = d."clientId"
WHERE aa.status = 'active'
GROUP BY aa.id, aa.first_name, aa.last_name, aa.email, aa.company_name, aa.status;

-- ===== 2. VUE PROSPECTS DÉTAILLÉS =====
-- Supprimer la vue existante si elle existe
DROP VIEW IF EXISTS vue_apporteur_prospects_detaille CASCADE;

CREATE VIEW vue_apporteur_prospects_detaille AS
SELECT 
    c.id as prospect_id,
    c.name as prospect_name,
    c.email as prospect_email,
    c.company_name,
    c.phone_number,
    c.city,
    c.siren,
    c.status as prospect_status,
    c.apporteur_id,
    c.qualification_score,
    c.interest_level,
    c.budget_range,
    c.timeline,
    c.source,
    c.notes,
    c.created_at as date_creation,
    c.expert_contacted_at,
    c.converted_at,
    
    -- Statistiques dossiers pour ce prospect
    COUNT(d.id) as nb_dossiers,
    COUNT(CASE WHEN d.status = 'en_cours' THEN 1 END) as dossiers_en_cours,
    COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as dossiers_acceptes,
    COALESCE(SUM(d.montant), 0) as total_montant,
    COALESCE(MAX(d.created_at), c.created_at) as derniere_activite
    
FROM "Client" c
LEFT JOIN "Dossier" d ON c.id = d."clientId"
WHERE c.apporteur_id IS NOT NULL
GROUP BY c.id, c.name, c.email, c.company_name, c.phone_number, c.city, c.siren, 
         c.status, c.apporteur_id, c.qualification_score, c.interest_level, 
         c.budget_range, c.timeline, c.source, c.notes, c.created_at, 
         c.expert_contacted_at, c.converted_at;

-- ===== 3. VUE PERFORMANCE PAR PRODUIT =====
-- Supprimer la vue existante si elle existe
DROP VIEW IF EXISTS vue_apporteur_performance_produits CASCADE;

CREATE VIEW vue_apporteur_performance_produits AS
SELECT 
    c.apporteur_id,
    pe.nom as produit_nom,
    pe.categorie,
    pe.taux_max,
    pe.duree_max,
    
    -- Statistiques par produit
    COUNT(cpe.id) as nb_dossiers_produit,
    COUNT(CASE WHEN cpe.statut = 'opportunité' THEN 1 END) as dossiers_acceptes,
    COUNT(CASE WHEN cpe.statut = 'refuse' THEN 1 END) as dossiers_refuses,
    
    COALESCE(SUM(cpe."montantFinal"), 0) as total_montant,
    COALESCE(SUM(CASE WHEN cpe.statut = 'opportunité' THEN cpe."montantFinal" ELSE 0 END), 0) as montant_accepte,
    COALESCE(AVG(cpe."montantFinal"), 0) as montant_moyen_demande,
    
    -- Taux de réussite par produit
    CASE 
        WHEN COUNT(cpe.id) > 0 
        THEN ROUND((COUNT(CASE WHEN cpe.statut = 'opportunité' THEN 1 END)::DECIMAL / COUNT(cpe.id)::DECIMAL) * 100, 2)
        ELSE 0 
    END as taux_reussite_pourcent,
    
    -- Montant moyen accepté
    CASE 
        WHEN COUNT(CASE WHEN cpe.statut = 'opportunité' THEN 1 END) > 0 
        THEN ROUND((SUM(CASE WHEN cpe.statut = 'opportunité' THEN cpe."montantFinal" ELSE 0 END) / COUNT(CASE WHEN cpe.statut = 'opportunité' THEN 1 END))::DECIMAL, 2)
        ELSE 0 
    END as montant_moyen_accepte

FROM "Client" c
JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE c.apporteur_id IS NOT NULL
GROUP BY c.apporteur_id, pe.id, pe.nom, pe.categorie, pe.taux_max, pe.duree_max
ORDER BY c.apporteur_id, nb_dossiers_produit DESC;

-- ===== 4. VUE ACTIVITÉ RÉCENTE =====
DROP VIEW IF EXISTS vue_apporteur_activite_recente CASCADE;

CREATE VIEW vue_apporteur_activite_recente AS
SELECT 
    c.apporteur_id,
    'nouveau_client' as type_activite,
    c.name as libelle,
    c.created_at as date_activite,
    c.status as statut,
    NULL as montant,
    'Client' as table_source,
    c.id as source_id
FROM "Client" c
WHERE c.apporteur_id IS NOT NULL

UNION ALL

SELECT 
    c.apporteur_id,
    'nouveau_dossier' as type_activite,
    CONCAT('Dossier ', cpe.id::text, ' - ', pe.nom) as libelle,
    cpe.created_at as date_activite,
    cpe.statut as statut,
    cpe."montantFinal" as montant,
    'Dossier' as table_source,
    cpe.id as source_id
FROM "Client" c
JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE c.apporteur_id IS NOT NULL

UNION ALL

SELECT 
    c.apporteur_id,
    'dossier_accepte' as type_activite,
    CONCAT('Dossier accepté: ', pe.nom, ' - ', cpe."montantFinal", '€') as libelle,
    cpe.updated_at as date_activite,
    'opportunité' as statut,
    cpe."montantFinal" as montant,
    'Dossier' as table_source,
    cpe.id as source_id
FROM "Client" c
JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE c.apporteur_id IS NOT NULL AND cpe.statut = 'opportunité'

ORDER BY date_activite DESC;

-- ===== 5. VUE STATISTIQUES MENSUELLES =====
DROP VIEW IF EXISTS vue_apporteur_statistiques_mensuelles CASCADE;

CREATE VIEW vue_apporteur_statistiques_mensuelles AS
SELECT 
    c.apporteur_id,
    DATE_TRUNC('month', c.created_at) as mois,
    EXTRACT(YEAR FROM c.created_at) as annee,
    EXTRACT(MONTH FROM c.created_at) as mois_numero,
    TO_CHAR(c.created_at, 'YYYY-MM') as periode,
    
    -- Statistiques clients
    COUNT(DISTINCT c.id) as nouveaux_clients,
    COUNT(DISTINCT CASE WHEN c.status = 'converted' THEN c.id END) as clients_convertis,
    
    -- Statistiques dossiers
    COUNT(DISTINCT d.id) as nouveaux_dossiers,
    COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) as dossiers_acceptes,
    COUNT(DISTINCT CASE WHEN d.status = 'rejected' THEN d.id END) as dossiers_refuses,
    
    -- Montants
    COALESCE(SUM(d.montant), 0) as total_montant,
    COALESCE(SUM(CASE WHEN d.status = 'completed' THEN d.montant ELSE 0 END), 0) as montant_accepte,
    COALESCE(AVG(d.montant), 0) as montant_moyen_demande,
    
    -- Taux
    CASE 
        WHEN COUNT(DISTINCT c.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN c.status = 'converted' THEN c.id END)::DECIMAL / COUNT(DISTINCT c.id)::DECIMAL) * 100, 2)
        ELSE 0 
    END as taux_conversion_pourcent,
    
    CASE 
        WHEN COUNT(DISTINCT d.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END)::DECIMAL / COUNT(DISTINCT d.id)::DECIMAL) * 100, 2)
        ELSE 0 
    END as taux_acceptation_pourcent

FROM "Client" c
LEFT JOIN "Dossier" d ON c.id = d."clientId"
WHERE c.apporteur_id IS NOT NULL
GROUP BY c.apporteur_id, DATE_TRUNC('month', c.created_at), EXTRACT(YEAR FROM c.created_at), EXTRACT(MONTH FROM c.created_at), TO_CHAR(c.created_at, 'YYYY-MM')
ORDER BY c.apporteur_id, mois DESC;

-- ===== 6. VUE COMMISSIONS CALCULÉES =====
DROP VIEW IF EXISTS vue_apporteur_commissions_calculees CASCADE;

CREATE VIEW vue_apporteur_commissions_calculees AS
SELECT 
    c.apporteur_id,
    aa.commission_rate as taux_commission,
    
    -- Dossiers acceptés
    COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) as dossiers_acceptes,
    COALESCE(SUM(CASE WHEN d.status = 'completed' THEN d.montant ELSE 0 END), 0) as montant_total_accepte,
    
    -- Commissions calculées
    COALESCE(
        SUM(CASE WHEN d.status = 'completed' THEN d.montant * (aa.commission_rate / 100) ELSE 0 END), 
        0
    ) as commission_totale_calculee,
    
    -- Commission moyenne par dossier
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) > 0 
        THEN ROUND(
            (SUM(CASE WHEN d.status = 'completed' THEN d.montant * (aa.commission_rate / 100) ELSE 0 END) / 
            COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END))::DECIMAL, 
            2
        )
        ELSE 0 
    END as commission_moyenne_par_dossier,
    
    -- Statistiques par mois (dernier mois)
    COUNT(DISTINCT CASE 
        WHEN d.status = 'completed' 
        AND d.updated_at >= CURRENT_DATE - INTERVAL '30 days' 
        THEN d.id 
    END) as dossiers_acceptes_30j,
    
    COALESCE(
        SUM(CASE 
            WHEN d.status = 'completed' 
            AND d.updated_at >= CURRENT_DATE - INTERVAL '30 days' 
            THEN d.montant * (aa.commission_rate / 100) 
            ELSE 0 
        END), 
        0
    ) as commission_mois_courant

FROM "Client" c
LEFT JOIN "Dossier" d ON c.id = d."clientId"
LEFT JOIN "ApporteurAffaires" aa ON c.apporteur_id = aa.id
WHERE c.apporteur_id IS NOT NULL
GROUP BY c.apporteur_id, aa.commission_rate;

-- ===== 7. VUE OBJECTIFS ET PERFORMANCE =====
DROP VIEW IF EXISTS vue_apporteur_objectifs_performance CASCADE;

CREATE VIEW vue_apporteur_objectifs_performance AS
SELECT 
    c.apporteur_id,
    aa.first_name,
    aa.last_name,
    
    -- Objectifs (à définir selon vos besoins)
    10 as objectif_clients_mensuel,  -- Exemple
    5 as objectif_dossiers_mensuel,  -- Exemple
    100000 as objectif_montant_mensuel,  -- Exemple
    
    -- Performance actuelle (30 derniers jours)
    COUNT(DISTINCT CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN c.id END) as clients_30j,
    COUNT(DISTINCT CASE WHEN d.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN d.id END) as dossiers_30j,
    COALESCE(SUM(CASE WHEN d.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN d.montant ELSE 0 END), 0) as montant_30j,
    
    -- Pourcentage d'atteinte des objectifs
    CASE 
        WHEN 10 > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN c.id END)::DECIMAL / 10) * 100, 2)
        ELSE 0 
    END as pourcentage_objectif_clients,
    
    CASE 
        WHEN 5 > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN d.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN d.id END)::DECIMAL / 5) * 100, 2)
        ELSE 0 
    END as pourcentage_objectif_dossiers,
    
    CASE 
        WHEN 100000 > 0 
        THEN ROUND(((COALESCE(SUM(CASE WHEN d.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN d.montant ELSE 0 END), 0) / 100000) * 100)::DECIMAL, 2)
        ELSE 0 
    END as pourcentage_objectif_montant

FROM "Client" c
LEFT JOIN "Dossier" d ON c.id = d."clientId"
LEFT JOIN "ApporteurAffaires" aa ON c.apporteur_id = aa.id
WHERE c.apporteur_id IS NOT NULL
GROUP BY c.apporteur_id, aa.first_name, aa.last_name;

-- ===== 8. POLITIQUES RLS POUR SÉCURISER LES VUES =====

-- RLS pour vue_apporteur_dashboard_principal
ALTER VIEW vue_apporteur_dashboard_principal SET (security_barrier = true);

-- RLS pour vue_apporteur_prospects_detaille
ALTER VIEW vue_apporteur_prospects_detaille SET (security_barrier = true);

-- RLS pour vue_apporteur_performance_produits
ALTER VIEW vue_apporteur_performance_produits SET (security_barrier = true);

-- RLS pour vue_apporteur_activite_recente
ALTER VIEW vue_apporteur_activite_recente SET (security_barrier = true);

-- RLS pour vue_apporteur_statistiques_mensuelles
ALTER VIEW vue_apporteur_statistiques_mensuelles SET (security_barrier = true);

-- RLS pour vue_apporteur_commissions_calculees
ALTER VIEW vue_apporteur_commissions_calculees SET (security_barrier = true);

-- RLS pour vue_apporteur_objectifs_performance
ALTER VIEW vue_apporteur_objectifs_performance SET (security_barrier = true);

-- ===== 9. COMMENTAIRES POUR DOCUMENTATION =====
COMMENT ON VIEW vue_apporteur_dashboard_principal IS 'Vue principale du dashboard apporteur avec toutes les statistiques clés';
COMMENT ON VIEW vue_apporteur_prospects_detaille IS 'Vue détaillée des prospects avec informations complètes et statistiques dossiers';
COMMENT ON VIEW vue_apporteur_performance_produits IS 'Performance par produit avec taux de réussite et montants';
COMMENT ON VIEW vue_apporteur_activite_recente IS 'Activité récente chronologique (clients, dossiers, conversions)';
COMMENT ON VIEW vue_apporteur_statistiques_mensuelles IS 'Statistiques agrégées par mois pour les graphiques';
COMMENT ON VIEW vue_apporteur_commissions_calculees IS 'Calcul automatique des commissions basé sur les dossiers acceptés';
COMMENT ON VIEW vue_apporteur_objectifs_performance IS 'Suivi des objectifs mensuels et performance';
