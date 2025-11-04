-- ============================================================================
-- FIX URGENT : Dossier DFS avec documents rejetés mais statut incorrect
-- ============================================================================
-- Dossier : ffddb8df-4182-4447-8a43-3944bb85d976 (DFS)
-- Problème : 2 documents rejetés mais statut = "documents_uploaded"
-- Solution : Mettre statut = "documents_manquants" et maintenir étape 3
-- Date : 4 novembre 2025
-- ============================================================================

-- 1️⃣ AVANT : État actuel du dossier
-- ============================================================================
SELECT 
    '📋 ÉTAT ACTUEL DFS' as section,
    cpe.id as dossier_id,
    pe.nom as produit,
    cpe.statut as statut_actuel,
    cpe.current_step as etape_actuelle,
    cpe.progress as progression,
    cpe.metadata,
    COUNT(cpd.id) as nb_documents,
    COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) as nb_valides,
    COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) as nb_rejetes,
    STRING_AGG(
        CASE WHEN cpd.status = 'rejected' 
        THEN cpd.filename || ' (' || cpd.rejection_reason || ')' 
        END, ', '
    ) as docs_rejetes
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
WHERE cpe.id = 'ffddb8df-4182-4447-8a43-3944bb85d976'
GROUP BY cpe.id, pe.nom, cpe.statut, cpe.current_step, cpe.progress, cpe.metadata;

-- ============================================================================

-- 2️⃣ CORRECTION : Passer à statut "documents_manquants"
-- ============================================================================
UPDATE "ClientProduitEligible"
SET 
    statut = 'documents_manquants',
    current_step = 3,  -- Maintenir étape 3
    progress = 50,     -- Progression 50% (étape 3)
    metadata = COALESCE(metadata, '{}'::jsonb)::jsonb || 
               jsonb_build_object(
                   'documents_missing', true,
                   'last_document_rejection', jsonb_build_object(
                       'document_name', 'La DFS.pdf',
                       'rejection_reason', 'mauvais document',
                       'rejected_at', NOW()::text
                   ),
                   'corrected_by_script', true,
                   'corrected_at', NOW()::text
               ),
    updated_at = NOW()
WHERE id = 'ffddb8df-4182-4447-8a43-3944bb85d976';

-- ============================================================================

-- 3️⃣ APRÈS : Vérification de la correction
-- ============================================================================
SELECT 
    '✅ ÉTAT APRÈS CORRECTION' as section,
    cpe.id as dossier_id,
    pe.nom as produit,
    cpe.statut as nouveau_statut,
    cpe.current_step as nouvelle_etape,
    cpe.progress as nouvelle_progression,
    cpe.metadata->>'documents_missing' as flag_docs_manquants,
    cpe.metadata->>'corrected_by_script' as corrige_par_script,
    COUNT(cpd.id) as nb_documents,
    COUNT(CASE WHEN cpd.status = 'validated' THEN 1 END) as nb_valides,
    COUNT(CASE WHEN cpd.status = 'rejected' THEN 1 END) as nb_rejetes
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
WHERE cpe.id = 'ffddb8df-4182-4447-8a43-3944bb85d976'
GROUP BY cpe.id, pe.nom, cpe.statut, cpe.current_step, cpe.progress, cpe.metadata;

-- ============================================================================

-- 4️⃣ VÉRIFICATION FINALE : Le dossier est-il cohérent ?
-- ============================================================================
SELECT 
    '🎯 DIAGNOSTIC FINAL' as section,
    CASE 
        WHEN cpe.statut = 'documents_manquants' 
         AND cpe.current_step = 3 
         AND EXISTS (
            SELECT 1 FROM "ClientProcessDocument" cpd 
            WHERE cpd.client_produit_id = cpe.id 
              AND cpd.status = 'rejected'
         )
        THEN '✅ DOSSIER COHÉRENT - Statut et étape corrects'
        ELSE '❌ PROBLÈME PERSISTANT'
    END as resultat
FROM "ClientProduitEligible" cpe
WHERE cpe.id = 'ffddb8df-4182-4447-8a43-3944bb85d976';

-- ============================================================================
-- RÉSULTAT ATTENDU :
-- ============================================================================
-- ✅ statut : documents_manquants
-- ✅ current_step : 3
-- ✅ progress : 50
-- ✅ metadata.documents_missing : true
-- ✅ Le client verra la card orange "📄 Documents manquants" à l'étape 3
-- ✅ Les étapes 1 et 2 seront marquées "Terminé"
-- ============================================================================

