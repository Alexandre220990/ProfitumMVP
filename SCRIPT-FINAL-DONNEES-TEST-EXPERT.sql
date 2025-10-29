-- ============================================================================
-- SCRIPT FINAL : Création données test pour dashboard expert
-- Expert ID: 2678526c-488f-45a1-818a-f9ce48882d26
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Assigner des CPE aux clients existants
-- ============================================================================

-- Client 1: RH Transport (alainbonin@gmail.fr) - PROSPECT CHAUD
INSERT INTO "ClientProduitEligible" (
    id, "clientId", "produitId", expert_id, statut, 
    "montantFinal", "tauxFinal", "dureeFinale", 
    current_step, progress, priorite, 
    notes, metadata, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '22e300cb-b920-4ebd-91ea-ad15de189037', -- RH Transport
    '32dd9cf8-15e2-4375-86ab-a95158d3ada1', -- TICPE
    '2678526c-488f-45a1-818a-f9ce48882d26', -- Expert
    'eligible', -- Prospect en attente validation
    50000,
    0.15,
    24,
    1, -- Étape 1: Validation éligibilité
    20,
    3, -- Priorité haute
    'Prospect chaud identifié par Beranger - Entreprise transport avec fort potentiel TICPE',
    jsonb_build_object(
        'workflow_stage', 'eligibility_check',
        'closing_probability', 70,
        'documents_uploaded', false,
        'expert_validation_needed', true,
        'validation_state', 'pending_expert_validation',
        'last_contact', NOW() - INTERVAL '5 days'
    ),
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '5 days'
);

-- Client 2: Alino SAS (alainbonin@profitum.fr) - EN COURS
INSERT INTO "ClientProduitEligible" (
    id, "clientId", "produitId", expert_id, statut, 
    "montantFinal", "tauxFinal", "dureeFinale", 
    current_step, progress, priorite, 
    notes, metadata, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '9963487e-3f77-44b1-86fa-b390e5d5f493', -- Alino SAS
    'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2', -- URSSAF
    '2678526c-488f-45a1-818a-f9ce48882d26', -- Expert
    'en_cours',
    35000,
    0.12,
    36,
    2, -- Étape 2: Documents en attente
    40,
    2, -- Priorité moyenne
    'Éligibilité validée - Attente documents manquants',
    jsonb_build_object(
        'workflow_stage', 'document_collection',
        'closing_probability', 60,
        'documents_uploaded', false,
        'expert_validation_needed', false,
        'eligible_validated_at', NOW() - INTERVAL '8 days',
        'missing_documents', jsonb_build_array('URSSAF 2023', 'URSSAF 2024')
    ),
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '2 days'
);

-- Client 3: Profitum SAS (profitum@gmail.com) - ÉTUDE APPROFONDIE
INSERT INTO "ClientProduitEligible" (
    id, "clientId", "produitId", expert_id, statut, 
    "montantFinal", "tauxFinal", "dureeFinale", 
    current_step, progress, priorite, 
    notes, metadata, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'da7b7e99-6463-4df6-8787-b01b345d3b3e', -- Profitum SAS (profitum@gmail.com)
    'e17fa8b5-dbd8-4c9b-8e31-31310813a71f', -- Logiciel Solid
    '2678526c-488f-45a1-818a-f9ce48882d26', -- Expert
    'en_cours',
    45000,
    0.25,
    12,
    3, -- Étape 3: Étude approfondie
    70,
    1, -- Priorité haute
    'Documents complets - Étude en cours - Signature prévue',
    jsonb_build_object(
        'workflow_stage', 'in_depth_study',
        'closing_probability', 85,
        'documents_uploaded', true,
        'expert_validation_needed', false,
        'eligible_validated_at', NOW() - INTERVAL '20 days',
        'documents_received_at', NOW() - INTERVAL '10 days',
        'study_progress', 70
    ),
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '1 day'
);

-- Client 4: Profitum SAS (grandjean.laporte@gmail.com) - PROSPECT BLOQUÉ
INSERT INTO "ClientProduitEligible" (
    id, "clientId", "produitId", expert_id, statut, 
    "montantFinal", "tauxFinal", "dureeFinale", 
    current_step, progress, priorite, 
    notes, metadata, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '25274ba6-67e6-4151-901c-74851fe2d82a', -- Profitum SAS (grandjean.laporte@gmail.com)
    'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7', -- FONCIER
    '2678526c-488f-45a1-818a-f9ce48882d26', -- Expert
    'eligible', -- Prospect bloqué
    25000,
    0.10,
    12,
    1, -- Étape 1: Validation éligibilité
    10,
    2, -- Priorité moyenne
    'Dossier bloqué - Aucune réponse depuis 20 jours',
    jsonb_build_object(
        'workflow_stage', 'eligibility_check',
        'closing_probability', 30,
        'documents_uploaded', false,
        'expert_validation_needed', true,
        'validation_state', 'pending_expert_validation',
        'last_contact', NOW() - INTERVAL '20 days',
        'blocked', true,
        'blocking_reason', 'no_response'
    ),
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '20 days'
);

-- Client 5: Alino SAS - DEUXIÈME PRODUIT (Multi-produit)
INSERT INTO "ClientProduitEligible" (
    id, "clientId", "produitId", expert_id, statut, 
    "montantFinal", "tauxFinal", "dureeFinale", 
    current_step, progress, priorite, 
    notes, metadata, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '9963487e-3f77-44b1-86fa-b390e5d5f493', -- Alino SAS (même client)
    'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5', -- DFS
    '2678526c-488f-45a1-818a-f9ce48882d26', -- Expert
    'eligible', -- Prospect multi-produit
    15000,
    0.08,
    24,
    1,
    15,
    3,
    'Opportunité additionnelle DFS sur même client URSSAF',
    jsonb_build_object(
        'workflow_stage', 'eligibility_check',
        'closing_probability', 75,
        'documents_uploaded', false,
        'expert_validation_needed', true,
        'validation_state', 'pending_expert_validation',
        'multi_product', true,
        'related_cpe', 'URSSAF en cours'
    ),
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
);

-- Client 6: RH Transport - PRODUIT CEE (Terminé pour stats)
INSERT INTO "ClientProduitEligible" (
    id, "clientId", "produitId", expert_id, statut, 
    "montantFinal", "tauxFinal", "dureeFinale", 
    current_step, progress, priorite, 
    notes, metadata, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '22e300cb-b920-4ebd-91ea-ad15de189037', -- RH Transport
    'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0', -- CEE
    '2678526c-488f-45a1-818a-f9ce48882d26', -- Expert
    'termine',
    20000,
    0.15,
    24,
    4, -- Étape 4: Finalisé
    100,
    1,
    'Dossier CEE finalisé et signé - Client satisfait',
    jsonb_build_object(
        'workflow_stage', 'finalized',
        'closing_probability', 100,
        'documents_uploaded', true,
        'expert_validation_needed', false,
        'eligible_validated_at', NOW() - INTERVAL '60 days',
        'documents_received_at', NOW() - INTERVAL '50 days',
        'finalized_at', NOW() - INTERVAL '10 days',
        'signed', true,
        'revenue_potential', 3000
    ),
    NOW() - INTERVAL '65 days',
    NOW() - INTERVAL '10 days'
);

-- ============================================================================
-- ÉTAPE 2 : Créer des RDVs pour les alertes
-- ============================================================================

-- RDV 1: RH Transport - RDV planifié confirmé (pas d'alerte)
INSERT INTO "RDV" (
    id, expert_id, client_id, scheduled_date, scheduled_time, duration_minutes, status,
    meeting_type, title, notes, confirmation_sent, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '2678526c-488f-45a1-818a-f9ce48882d26',
    '22e300cb-b920-4ebd-91ea-ad15de189037', -- RH Transport
    CURRENT_DATE + INTERVAL '2 days',
    '14:00:00',
    60,
    'scheduled',
    'video',
    'Présentation TICPE',
    'RDV de présentation produit TICPE - Prospect chaud',
    true,
    NOW(),
    NOW()
);

-- RDV 2: Profitum SAS - RDV NON confirmé (alerte!)
INSERT INTO "RDV" (
    id, expert_id, client_id, scheduled_date, scheduled_time, duration_minutes, status,
    meeting_type, title, notes, confirmation_sent, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '2678526c-488f-45a1-818a-f9ce48882d26',
    'da7b7e99-6463-4df6-8787-b01b345d3b3e', -- Profitum SAS (profitum@gmail.com)
    CURRENT_DATE + INTERVAL '1 day',
    '10:30:00',
    90,
    'scheduled',
    'physical',
    'Signature contrat Logiciel Solid',
    'RDV de signature - URGENT À CONFIRMER',
    false,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
);

-- ============================================================================
-- ÉTAPE 3 : Vérifications
-- ============================================================================

-- Compter les CPE créés pour l'expert
SELECT 
    COUNT(*) as total_cpe_expert,
    COUNT(CASE WHEN statut = 'opportunité' THEN 1 END) as prospects,
    COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as en_cours,
    COUNT(CASE WHEN statut = 'termine' THEN 1 END) as termines,
    SUM("montantFinal") as montant_total_pipeline
FROM "ClientProduitEligible"
WHERE expert_id = '2678526c-488f-45a1-818a-f9ce48882d26';

-- Compter les RDV
SELECT 
    COUNT(*) as total_rdv,
    COUNT(CASE WHEN statut = 'confirmé' THEN 1 END) as confirmes,
    COUNT(CASE WHEN statut = 'proposé' THEN 1 END) as non_confirmes
FROM "RDV"
WHERE expert_id = '2678526c-488f-45a1-818a-f9ce48882d26';

-- Lister tous les CPE avec clients et produits
SELECT 
    cpe.id,
    c.company_name as client,
    p.nom as produit,
    cpe.statut,
    cpe."montantFinal" as montant,
    cpe.priorite,
    cpe.current_step,
    cpe.progress,
    cpe.metadata->>'workflow_stage' as workflow,
    cpe.metadata->>'closing_probability' as probability
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26'
ORDER BY cpe.priorite DESC, cpe."montantFinal" DESC;

-- Vérifier la section Apporteurs
SELECT 
    aa.id,
    aa.company_name as apporteur,
    COUNT(DISTINCT c.id) as nombre_clients,
    COUNT(DISTINCT cpe.id) as nombre_cpe
FROM "ApporteurAffaires" aa
JOIN "Client" c ON c.apporteur_id = aa.id
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id 
    AND cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26'
GROUP BY aa.id, aa.company_name;

