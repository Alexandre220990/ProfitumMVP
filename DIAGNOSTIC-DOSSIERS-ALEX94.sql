-- ============================================================================
-- DIAGNOSTIC : Dossiers du client alex94@profitum.fr
-- ============================================================================
-- Ce script analyse tous les dossiers du client pour vérifier leur état
-- Date : 4 novembre 2025
-- ============================================================================

-- 1️⃣ INFORMATIONS CLIENT
-- ============================================================================
SELECT 
    '👤 INFORMATIONS CLIENT' as section,
    c.id,
    c.company_name,
    c.email,
    c.created_at as date_inscription,
    COUNT(DISTINCT cpe.id) as nb_dossiers_total
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE c.email = 'alex94@profitum.fr'
GROUP BY c.id, c.company_name, c.email, c.created_at;

-- ============================================================================

-- 2️⃣ LISTE DES DOSSIERS AVEC STATUT DÉTAILLÉ
-- ============================================================================
SELECT 
    '📁 DOSSIERS' as section,
    cpe.id as dossier_id,
    pe.nom as produit,
    pe.type_produit,
    cpe.statut as statut_actuel,
    cpe.current_step as etape_actuelle,
    cpe.progress as progression_pct,
    e.name as expert_assigne,
    cpe.expert_id as expert_id,
    CASE 
        WHEN cpe.statut = 'eligible' THEN '🆕 Nouveau dossier'
        WHEN cpe.statut = 'opportunité' THEN '🆕 Opportunité détectée'
        WHEN cpe.statut = 'documents_uploaded' THEN '📄 Documents uploadés'
        WHEN cpe.statut = 'eligibility_validated' THEN '✅ Éligibilité validée'
        WHEN cpe.statut = 'eligibility_rejected' THEN '❌ Éligibilité rejetée'
        WHEN cpe.statut = 'documents_manquants' THEN '🟠 Documents manquants'
        WHEN cpe.statut = 'audit_en_cours' THEN '🔍 Audit en cours'
        WHEN cpe.statut = 'en_attente' THEN '⏳ En attente'
        ELSE cpe.statut
    END as statut_lisible,
    CASE 
        WHEN cpe.current_step = 1 THEN '1️⃣ Confirmer éligibilité'
        WHEN cpe.current_step = 2 THEN '2️⃣ Sélection expert'
        WHEN cpe.current_step = 3 THEN '3️⃣ Collecte documents'
        WHEN cpe.current_step = 4 THEN '4️⃣ Audit technique'
        WHEN cpe.current_step = 5 THEN '5️⃣ Validation finale'
        WHEN cpe.current_step = 6 THEN '6️⃣ Demande remboursement'
        ELSE 'Étape ' || cpe.current_step::text
    END as etape_lisible,
    cpe.metadata->>'documents_missing' as flag_docs_manquants,
    cpe.metadata->>'eligibility_decision' as decision_eligibilite,
    cpe.created_at as date_creation,
    cpe.updated_at as derniere_maj
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE c.email = 'alex94@profitum.fr'
ORDER BY cpe.created_at DESC;

-- ============================================================================

-- 3️⃣ DOCUMENTS PAR DOSSIER
-- ============================================================================
SELECT 
    '📄 DOCUMENTS' as section,
    cpe.id as dossier_id,
    pe.nom as produit,
    cpd.id as document_id,
    cpd.filename as nom_fichier,
    cpd.status as statut_document,
    cpd.validation_status as statut_validation,
    CASE 
        WHEN cpd.status = 'pending' THEN '⏳ En attente'
        WHEN cpd.status = 'uploaded' THEN '📤 Uploadé'
        WHEN cpd.status = 'validated' THEN '✅ Validé'
        WHEN cpd.status = 'rejected' THEN '❌ Rejeté'
        ELSE cpd.status
    END as statut_lisible,
    cpd.rejection_reason as raison_rejet,
    cpd.validated_at as date_validation,
    e.name as valide_par,
    cpd.created_at as date_upload
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
LEFT JOIN "Expert" e ON e.id = cpd.validated_by
WHERE c.email = 'alex94@profitum.fr'
ORDER BY cpe.created_at DESC, cpd.created_at DESC;

-- ============================================================================

-- 4️⃣ STATISTIQUES PAR DOSSIER
-- ============================================================================
SELECT 
    '📊 STATISTIQUES DOCUMENTS' as section,
    cpe.id as dossier_id,
    pe.nom as produit,
    cpe.statut as statut_dossier,
    cpe.current_step as etape,
    COUNT(cpd.id) as nb_documents_total,
    COUNT(CASE WHEN cpd.status = 'pending' THEN 1 END) as nb_en_attente,
    COUNT(CASE WHEN cpd.status = 'uploaded' THEN 1 END) as nb_uploades,
    COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) as nb_valides,
    COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) as nb_rejetes,
    CASE 
        WHEN COUNT(cpd.id) = 0 THEN '❌ Aucun document'
        WHEN COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) > 0 THEN '🟠 Documents rejetés'
        WHEN COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) = COUNT(cpd.id) THEN '✅ Tous validés'
        WHEN COUNT(CASE WHEN cpd.status = 'uploaded' THEN 1 END) > 0 THEN '⏳ En attente validation'
        ELSE '📝 En cours'
    END as etat_documents
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
WHERE c.email = 'alex94@profitum.fr'
GROUP BY cpe.id, pe.nom, cpe.statut, cpe.current_step
ORDER BY cpe.created_at DESC;

-- ============================================================================

-- 5️⃣ PROBLÈMES POTENTIELS À CORRIGER
-- ============================================================================
SELECT 
    '⚠️ ANALYSE DES PROBLÈMES' as section,
    cpe.id as dossier_id,
    pe.nom as produit,
    cpe.statut as statut,
    cpe.current_step as etape,
    CASE 
        -- Vérifier cohérence statut / étape
        WHEN cpe.statut = 'eligibility_rejected' AND cpe.current_step != 1 
            THEN '❌ Rejet admin mais pas étape 1'
        WHEN cpe.statut = 'documents_manquants' AND cpe.current_step != 3 
            THEN '❌ Documents manquants mais pas étape 3'
        WHEN cpe.statut = 'audit_en_cours' AND cpe.current_step != 4 
            THEN '❌ Audit en cours mais pas étape 4'
        
        -- Vérifier documents vs statut
        WHEN cpe.statut = 'documents_manquants' AND NOT EXISTS (
            SELECT 1 FROM "ClientProcessDocument" cpd2 
            WHERE cpd2.client_produit_id = cpe.id AND cpd2.status = 'rejected'
        ) THEN '⚠️ Statut documents_manquants mais aucun document rejeté'
        
        WHEN EXISTS (
            SELECT 1 FROM "ClientProcessDocument" cpd2 
            WHERE cpd2.client_produit_id = cpe.id AND cpd2.status = 'rejected'
        ) AND cpe.statut != 'documents_manquants' AND cpe.statut != 'eligibility_rejected'
            THEN '⚠️ Documents rejetés mais statut incohérent'
        
        -- Vérifier progression vs étape
        WHEN cpe.current_step = 1 AND cpe.progress > 20 
            THEN '⚠️ Étape 1 mais progression > 20%'
        WHEN cpe.current_step = 2 AND (cpe.progress < 20 OR cpe.progress > 40) 
            THEN '⚠️ Étape 2 mais progression incohérente'
        WHEN cpe.current_step = 3 AND (cpe.progress < 40 OR cpe.progress > 60) 
            THEN '⚠️ Étape 3 mais progression incohérente'
        
        ELSE '✅ OK - Cohérent'
    END as diagnostic,
    COUNT(cpd.id) as nb_docs,
    COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) as nb_rejetes,
    STRING_AGG(
        CASE WHEN cpd.status = 'rejected' 
        THEN cpd.filename || ' (' || cpd.rejection_reason || ')' 
        ELSE NULL END, 
        ', '
    ) as documents_rejetes
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
WHERE c.email = 'alex94@profitum.fr'
GROUP BY cpe.id, pe.nom, cpe.statut, cpe.current_step
ORDER BY cpe.created_at DESC;

-- ============================================================================

-- 6️⃣ TIMELINE DES ÉVÉNEMENTS
-- ============================================================================
SELECT 
    '📅 TIMELINE' as section,
    cpe.id as dossier_id,
    pe.nom as produit,
    dt.type as type_evenement,
    dt.title as titre,
    dt.description as description,
    dt.actor_type as type_acteur,
    dt.actor_name as acteur,
    dt.icon as icone,
    dt.color as couleur,
    dt.date as date_evenement,
    dt.created_at as date_creation
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN dossier_timeline dt ON dt.dossier_id = cpe.id
WHERE c.email = 'alex94@profitum.fr'
ORDER BY cpe.id, dt.date DESC
LIMIT 50;

-- ============================================================================

-- 7️⃣ RÉSUMÉ GLOBAL
-- ============================================================================
SELECT 
    '📋 RÉSUMÉ GLOBAL' as section,
    COUNT(DISTINCT cpe.id) as total_dossiers,
    COUNT(DISTINCT CASE WHEN cpe.current_step = 1 THEN cpe.id END) as dossiers_etape_1,
    COUNT(DISTINCT CASE WHEN cpe.current_step = 2 THEN cpe.id END) as dossiers_etape_2,
    COUNT(DISTINCT CASE WHEN cpe.current_step = 3 THEN cpe.id END) as dossiers_etape_3,
    COUNT(DISTINCT CASE WHEN cpe.current_step >= 4 THEN cpe.id END) as dossiers_etape_4_plus,
    COUNT(DISTINCT CASE WHEN cpe.statut = 'eligibility_rejected' THEN cpe.id END) as rejetes_admin,
    COUNT(DISTINCT CASE WHEN cpe.statut = 'documents_manquants' THEN cpe.id END) as docs_manquants_expert,
    COUNT(DISTINCT CASE WHEN cpe.statut = 'audit_en_cours' THEN cpe.id END) as en_audit,
    COUNT(DISTINCT cpd.id) as total_documents,
    COUNT(DISTINCT CASE WHEN cpd.status = 'validated' THEN cpd.id END) as docs_valides,
    COUNT(DISTINCT CASE WHEN cpd.status = 'rejected' THEN cpd.id END) as docs_rejetes
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
WHERE c.email = 'alex94@profitum.fr';

-- ============================================================================
-- FIN DU DIAGNOSTIC
-- ============================================================================

