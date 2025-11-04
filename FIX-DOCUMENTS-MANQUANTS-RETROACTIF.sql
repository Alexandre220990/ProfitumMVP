-- ============================================================================
-- FIX RÉTROACTIF : Mise à jour des dossiers avec documents rejetés
-- ============================================================================
-- Ce script met à jour les dossiers qui ont des documents rejetés AVANT 
-- la mise en place du workflow automatique.
--
-- Date : 4 novembre 2025
-- Problème : Les rejets de documents passés n'ont pas déclenché la mise à jour
--            du statut du dossier vers 'documents_manquants'
-- ============================================================================

-- 1️⃣ DIAGNOSTIC : Afficher tous les dossiers avec documents rejetés
SELECT 
    cpe.id as dossier_id,
    cpe."clientId",
    cpe.statut as statut_actuel,
    cpe.current_step as step_actuel,
    cpe.expert_id,
    pe.nom as produit_nom,
    COUNT(DISTINCT cpd.id) as nb_documents_total,
    COUNT(DISTINCT CASE WHEN cpd.status = 'rejected' THEN cpd.id END) as nb_documents_rejetes,
    COUNT(DISTINCT CASE WHEN cpd.status = 'validated' THEN cpd.id END) as nb_documents_valides,
    MAX(CASE WHEN cpd.status = 'rejected' THEN cpd.validated_at END) as date_dernier_rejet,
    MAX(CASE WHEN cpd.status = 'rejected' THEN cpd.filename END) as dernier_doc_rejete,
    MAX(CASE WHEN cpd.status = 'rejected' THEN cpd.rejection_reason END) as derniere_raison_rejet
FROM "ClientProduitEligible" cpe
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
WHERE cpe.expert_id IS NOT NULL -- Seulement les dossiers avec expert assigné
GROUP BY cpe.id, cpe."clientId", cpe.statut, cpe.current_step, cpe.expert_id, pe.nom
HAVING COUNT(DISTINCT CASE WHEN cpd.status = 'rejected' THEN cpd.id END) > 0 -- Au moins 1 document rejeté
ORDER BY MAX(CASE WHEN cpd.status = 'rejected' THEN cpd.validated_at END) DESC;

-- ============================================================================

-- 2️⃣ MISE À JOUR : Corriger les dossiers avec documents rejetés
-- Attention : Cette requête modifie la base de données !

-- Sauvegarde avant modification (optionnel, décommenter si besoin)
-- CREATE TABLE IF NOT EXISTS backup_cpe_before_fix AS 
-- SELECT * FROM "ClientProduitEligible" 
-- WHERE id IN (
--     SELECT DISTINCT cpe.id
--     FROM "ClientProduitEligible" cpe
--     LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
--     WHERE cpe.expert_id IS NOT NULL
--     GROUP BY cpe.id
--     HAVING COUNT(DISTINCT CASE WHEN cpd.status = 'rejected' THEN cpd.id END) > 0
-- );

-- Mise à jour des dossiers
WITH dossiers_a_corriger AS (
    SELECT DISTINCT
        cpe.id as dossier_id,
        cpe.metadata::jsonb as old_metadata,
        (
            SELECT jsonb_build_object(
                'document_id', cpd.id,
                'document_name', cpd.filename,
                'rejected_at', cpd.validated_at::text,
                'rejection_reason', cpd.rejection_reason
            )
            FROM "ClientProcessDocument" cpd
            WHERE cpd.client_produit_id = cpe.id 
            AND cpd.status = 'rejected'
            ORDER BY cpd.validated_at DESC
            LIMIT 1
        ) as last_rejection
    FROM "ClientProduitEligible" cpe
    LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_produit_id = cpe.id
    WHERE cpe.expert_id IS NOT NULL
      AND cpe.statut != 'documents_manquants' -- Ne pas mettre à jour si déjà fait
      AND (cpe.current_step = 2 OR cpe.current_step = 3) -- Seulement étapes 2-3
    GROUP BY cpe.id, cpe.metadata
    HAVING COUNT(DISTINCT CASE WHEN cpd.status = 'rejected' THEN cpd.id END) > 0
)
UPDATE "ClientProduitEligible" cpe
SET 
    statut = 'documents_manquants',
    current_step = 3,
    metadata = (
        COALESCE(cpe.metadata::text, '{}')::jsonb || 
        jsonb_build_object(
            'documents_missing', true,
            'last_document_rejection', dac.last_rejection,
            'fixed_retroactively', true,
            'fix_date', NOW()::text
        )
    )::json,
    updated_at = NOW()
FROM dossiers_a_corriger dac
WHERE cpe.id = dac.dossier_id;

-- ============================================================================

-- 3️⃣ VÉRIFICATION : Afficher les dossiers corrigés
SELECT 
    cpe.id as dossier_id,
    cpe.statut as nouveau_statut,
    cpe.current_step as nouvelle_step,
    cpe.metadata->>'documents_missing' as documents_missing,
    cpe.metadata->'last_document_rejection'->>'document_name' as doc_rejete,
    cpe.metadata->'last_document_rejection'->>'rejection_reason' as raison_rejet,
    cpe.metadata->>'fixed_retroactively' as corrige_retroactivement,
    cpe.updated_at as date_mise_a_jour,
    c.company_name as client_nom,
    pe.nom as produit_nom,
    e.name as expert_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE cpe.statut = 'documents_manquants'
  AND cpe.metadata->>'fixed_retroactively' = 'true'
ORDER BY cpe.updated_at DESC;

-- ============================================================================

-- 4️⃣ STATISTIQUES APRÈS FIX
SELECT 
    COUNT(*) as total_dossiers_corriges,
    COUNT(DISTINCT cpe."clientId") as clients_impactes,
    COUNT(DISTINCT cpe.expert_id) as experts_impactes
FROM "ClientProduitEligible" cpe
WHERE cpe.statut = 'documents_manquants'
  AND cpe.metadata->>'fixed_retroactively' = 'true';

-- ============================================================================
-- NOTES IMPORTANTES :
-- ============================================================================
-- 1. Ce script NE touche que les dossiers avec :
--    - Un expert assigné (expert_id IS NOT NULL)
--    - Au moins 1 document rejeté (status = 'rejected')
--    - Actuellement à l'étape 2 ou 3
--    - Pas déjà au statut 'documents_manquants'
--
-- 2. Les nouveaux rejets de documents utiliseront le code automatique
--    implémenté dans expert-documents.ts
--
-- 3. Les clients verront maintenant l'étape 3 "Documents manquants"
--    au lieu de rester bloqués à "En attente d'acceptation"
-- ============================================================================

