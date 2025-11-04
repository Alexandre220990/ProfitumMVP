-- ============================================================================
-- VÉRIFICATION DES DOSSIERS AVEC DOCUMENTS VALIDÉS
-- ============================================================================
-- Ce script vérifie l'état des dossiers qui ont des documents validés
-- et analyse si le workflow/statut est cohérent
-- ============================================================================

-- 1️⃣ DOSSIERS AVEC TOUS LES DOCUMENTS VALIDÉS
-- ============================================================================
WITH analyse_dossiers AS (
    SELECT 
        cpe.id as dossier_id,
        cpe."clientId",
        cpe.statut as statut_actuel,
        cpe.current_step as step_actuel,
        cpe.progress as progression,
        cpe.expert_id,
        cpe.expert_pending_id,
        pe.nom as produit_nom,
        pe.type_produit,
        c.company_name as client_nom,
        e.name as expert_nom,
        COUNT(DISTINCT cpd.id) as nb_documents_total,
        COUNT(DISTINCT CASE WHEN cpd.status = 'validated' OR cpd.validation_status = 'validated' THEN cpd.id END) as nb_documents_valides,
        COUNT(DISTINCT CASE WHEN cpd.status = 'rejected' OR cpd.validation_status = 'rejected' THEN cpd.id END) as nb_documents_rejetes,
        COUNT(DISTINCT CASE WHEN cpd.status = 'pending' OR cpd.validation_status = 'pending' THEN cpd.id END) as nb_documents_pending,
        MAX(CASE WHEN cpd.status = 'validated' THEN cpd.validated_at END) as date_derniere_validation,
        -- Analyse de cohérence
        CASE 
            WHEN COUNT(DISTINCT cpd.id) = 0 THEN 'AUCUN_DOCUMENT'
            WHEN COUNT(DISTINCT CASE WHEN cpd.status = 'validated' THEN cpd.id END) = COUNT(DISTINCT cpd.id) THEN 'TOUS_VALIDES'
            WHEN COUNT(DISTINCT CASE WHEN cpd.status = 'rejected' THEN cpd.id END) > 0 THEN 'AVEC_REJETS'
            WHEN COUNT(DISTINCT CASE WHEN cpd.status = 'pending' THEN cpd.id END) > 0 THEN 'AVEC_PENDING'
            ELSE 'MIXTE'
        END as etat_documents,
        -- Workflow attendu
        CASE 
            WHEN cpe.expert_id IS NULL AND cpe.expert_pending_id IS NULL THEN 'ETAPE_1_OU_2_SELECTION_EXPERT'
            WHEN cpe.expert_pending_id IS NOT NULL AND cpe.expert_id IS NULL THEN 'ETAPE_2_ATTENTE_ACCEPTATION'
            WHEN cpe.expert_id IS NOT NULL AND COUNT(DISTINCT CASE WHEN cpd.status = 'validated' THEN cpd.id END) = COUNT(DISTINCT cpd.id) AND COUNT(DISTINCT cpd.id) > 0 THEN 'ETAPE_4_AUDIT_POSSIBLE'
            WHEN cpe.expert_id IS NOT NULL AND COUNT(DISTINCT CASE WHEN cpd.status = 'rejected' THEN cpd.id END) > 0 THEN 'ETAPE_3_DOCUMENTS_MANQUANTS'
            WHEN cpe.expert_id IS NOT NULL THEN 'ETAPE_3_COLLECTE_DOCS'
            ELSE 'INDETERMINE'
        END as workflow_attendu,
        -- Cohérence
        CASE
            -- Si tous validés et expert assigné, devrait être prêt pour audit (étape 4+)
            WHEN COUNT(DISTINCT cpd.id) > 0 
                 AND COUNT(DISTINCT CASE WHEN cpd.status = 'validated' THEN cpd.id END) = COUNT(DISTINCT cpd.id)
                 AND cpe.expert_id IS NOT NULL
                 AND cpe.current_step < 4 
            THEN '⚠️ INCOHÉRENT : Tous docs validés mais étape < 4'
            
            -- Si documents rejetés mais pas au statut documents_manquants
            WHEN COUNT(DISTINCT CASE WHEN cpd.status = 'rejected' THEN cpd.id END) > 0
                 AND cpe.statut != 'documents_manquants'
                 AND cpe.current_step != 3
            THEN '⚠️ INCOHÉRENT : Docs rejetés mais pas étape 3'
            
            -- Si expert_pending_id mais current_step != 2
            WHEN cpe.expert_pending_id IS NOT NULL 
                 AND cpe.expert_id IS NULL 
                 AND cpe.current_step != 2
            THEN '⚠️ INCOHÉRENT : Expert en attente mais pas étape 2'
            
            ELSE '✅ COHÉRENT'
        END as coherence_workflow,
        cpe.metadata->>'documents_missing' as flag_docs_manquants,
        cpe.created_at as date_creation,
        cpe.updated_at as date_mise_a_jour
    FROM "ClientProduitEligible" cpe
    LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
    LEFT JOIN "Client" c ON c.id = cpe."clientId"
    LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
    LEFT JOIN "Expert" e ON e.id = cpe.expert_id
    WHERE cpe.expert_id IS NOT NULL -- Seulement les dossiers avec expert assigné
    GROUP BY cpe.id, cpe."clientId", cpe.statut, cpe.current_step, cpe.progress, cpe.expert_id, cpe.expert_pending_id, cpe.metadata, cpe.created_at, cpe.updated_at, pe.nom, pe.type_produit, c.company_name, e.name
)
SELECT * FROM analyse_dossiers
ORDER BY 
    CASE 
        WHEN coherence_workflow LIKE '⚠️%' THEN 0 
        ELSE 1 
    END,
    date_mise_a_jour DESC;

-- ============================================================================

-- 2️⃣ FOCUS : DOSSIERS AVEC TOUS LES DOCUMENTS VALIDÉS
-- ============================================================================
SELECT 
    cpe.id as dossier_id,
    c.company_name as client,
    pe.nom as produit,
    e.name as expert,
    cpe.statut as statut_actuel,
    cpe.current_step as etape_actuelle,
    COUNT(cpd.id) as nb_documents,
    STRING_AGG(cpd.filename, ', ' ORDER BY cpd.created_at) as liste_documents,
    MAX(cpd.validated_at) as derniere_validation,
    -- Recommandation
    CASE 
        WHEN cpe.current_step < 4 THEN '🔄 DEVRAIT ÊTRE À L''ÉTAPE 4 (Audit)'
        WHEN cpe.current_step = 4 THEN '✅ OK - Audit en cours/terminé'
        WHEN cpe.current_step > 4 THEN '✅ OK - Étapes suivantes'
        ELSE '❓ À vérifier'
    END as recommandation
FROM "ClientProduitEligible" cpe
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE cpe.expert_id IS NOT NULL
GROUP BY cpe.id, c.company_name, pe.nom, e.name, cpe.statut, cpe.current_step
HAVING COUNT(cpd.id) > 0 -- Au moins 1 document
   AND COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) = COUNT(cpd.id) -- Tous validés
ORDER BY cpe.updated_at DESC;

-- ============================================================================

-- 3️⃣ DÉTAIL DES DOCUMENTS PAR DOSSIER
-- ============================================================================
SELECT 
    cpe.id as dossier_id,
    c.company_name as client,
    pe.nom as produit,
    cpd.filename as document,
    cpd.status as statut_doc,
    cpd.validation_status,
    cpd.validated_at as date_validation,
    cpd.rejection_reason,
    e.name as validateur,
    cpd.workflow_step,
    cpd.created_at as date_upload
FROM "ClientProduitEligible" cpe
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpd.validated_by
WHERE cpe.expert_id IS NOT NULL
ORDER BY cpe.id, cpd.created_at DESC;

-- ============================================================================

-- 4️⃣ STATISTIQUES GLOBALES
-- ============================================================================
WITH dossier_stats AS (
    SELECT 
        cpe.id,
        cpe.statut,
        cpe.current_step,
        cpe.expert_id,
        COUNT(cpd.id) as nb_docs,
        COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) as nb_valides,
        COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) as nb_rejetes,
        COUNT(CASE WHEN cpd.status = 'pending' THEN 1 END) as nb_pending
    FROM "ClientProduitEligible" cpe
    LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
    WHERE cpe.expert_id IS NOT NULL
    GROUP BY cpe.id, cpe.statut, cpe.current_step, cpe.expert_id
)
SELECT 
    '📊 STATISTIQUES GLOBALES' as titre,
    COUNT(*) as total_dossiers_avec_expert,
    COUNT(CASE WHEN nb_docs = 0 THEN 1 END) as sans_documents,
    COUNT(CASE WHEN nb_valides = nb_docs AND nb_docs > 0 THEN 1 END) as tous_docs_valides,
    COUNT(CASE WHEN nb_rejetes > 0 THEN 1 END) as avec_docs_rejetes,
    COUNT(CASE WHEN nb_pending > 0 THEN 1 END) as avec_docs_pending,
    COUNT(CASE WHEN current_step = 2 THEN 1 END) as etape_2_selection_expert,
    COUNT(CASE WHEN current_step = 3 THEN 1 END) as etape_3_collecte_docs,
    COUNT(CASE WHEN current_step = 4 THEN 1 END) as etape_4_audit,
    COUNT(CASE WHEN current_step >= 5 THEN 1 END) as etape_5_plus,
    COUNT(CASE WHEN statut = 'documents_manquants' THEN 1 END) as statut_docs_manquants
FROM dossier_stats;

-- ============================================================================

-- 5️⃣ ACTIONS RECOMMANDÉES
-- ============================================================================
WITH dossiers_a_corriger AS (
    SELECT 
        cpe.id,
        cpe.statut,
        cpe.current_step,
        COUNT(cpd.id) as nb_docs,
        COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) as nb_valides,
        COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) as nb_rejetes,
        CASE 
            -- Tous validés → devrait être étape 4+
            WHEN COUNT(cpd.id) > 0 
                 AND COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) = COUNT(cpd.id)
                 AND cpe.current_step < 4 
            THEN 'PASSER_ETAPE_4'
            
            -- Documents rejetés → devrait être étape 3 + statut documents_manquants
            WHEN COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) > 0
                 AND (cpe.statut != 'documents_manquants' OR cpe.current_step != 3)
            THEN 'CORRIGER_STATUT_REJET'
            
            ELSE NULL
        END as action_recommandee
    FROM "ClientProduitEligible" cpe
    LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
    WHERE cpe.expert_id IS NOT NULL
    GROUP BY cpe.id, cpe.statut, cpe.current_step
)
SELECT 
    '🔧 ACTIONS RECOMMANDÉES' as titre,
    action_recommandee,
    COUNT(*) as nb_dossiers,
    CASE 
        WHEN action_recommandee = 'PASSER_ETAPE_4' 
        THEN 'UPDATE "ClientProduitEligible" SET current_step = 4, statut = ''audit_en_cours'' WHERE id IN (...)'
        WHEN action_recommandee = 'CORRIGER_STATUT_REJET'
        THEN 'UPDATE "ClientProduitEligible" SET current_step = 3, statut = ''documents_manquants'' WHERE id IN (...)'
        ELSE NULL
    END as sql_suggestion
FROM dossiers_a_corriger
WHERE action_recommandee IS NOT NULL
GROUP BY action_recommandee
ORDER BY nb_dossiers DESC;

-- ============================================================================
-- NOTES IMPORTANTES :
-- ============================================================================
-- 1. Workflow attendu :
--    - Étape 1 : Upload documents éligibilité
--    - Étape 2 : Sélection expert (expert_pending_id renseigné)
--    - Étape 3 : Collecte documents complémentaires
--    - Étape 4 : Audit technique (quand tous docs validés)
--    - Étape 5+ : Validation finale, remboursement
--
-- 2. Statuts importants :
--    - documents_manquants : Quand docs rejetés par expert
--    - audit_en_cours : Quand expert fait l'audit (tous docs validés)
--    - audit_termine : Audit complété
--
-- 3. Cohérence à vérifier :
--    - Si tous docs validés → étape >= 4
--    - Si docs rejetés → étape 3 + statut documents_manquants
--    - Si expert_pending_id sans expert_id → étape 2
-- ============================================================================

