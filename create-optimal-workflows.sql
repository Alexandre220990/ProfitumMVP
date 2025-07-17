-- ===== WORKFLOWS OPTIMAUX POUR FINANCIALTRACKER =====
-- Script de création des workflows documentaires cohérents avec le processus métier

-- ===== 1. WORKFLOW CHARTE D'ENGAGEMENT =====
-- Client upload → Admin valide prééligibilité → Client signe → Admin finalise

INSERT INTO "WorkflowTemplate" (
    id, name, description, document_category, document_type, version, 
    is_active, estimated_total_duration, sla_hours, auto_start, 
    requires_expert, requires_signature, compliance_requirements, created_at
) VALUES (
    gen_random_uuid(), 
    'Charte d''engagement Profitum',
    'Workflow complet pour la signature d''une charte d''engagement client',
    'charte',
    'pdf',
    '1.0',
    true,
    48, -- 48h estimées
    72, -- SLA 72h
    true,
    true,
    ARRAY['rgpd', 'conformite_fiscale', 'engagement_client']
);

-- Récupérer l'ID du template créé
DO $$
DECLARE
    charte_template_id UUID;
BEGIN
    SELECT id INTO charte_template_id FROM "WorkflowTemplate" WHERE name = 'Charte d''engagement Profitum';

    -- Étape 1: Upload de la charte par le client
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        charte_template_id,
        'upload',
        'Upload charte d''engagement',
        'Le client upload sa charte d''engagement signée',
        1,
        'client',
        true,
        24,
        '{"email": true, "push": true, "admin_notification": true}'::jsonb,
        '{"document_type": "charte", "requires_signature": true}'::jsonb
    );

    -- Étape 2: Validation prééligibilité par l'admin
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        charte_template_id,
        'validation',
        'Validation prééligibilité',
        'L''admin valide la prééligibilité du client',
        2,
        'admin',
        true,
        12,
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"validation_type": "pre_eligibility", "requires_admin": true}'::jsonb
    );

    -- Étape 3: Signature électronique par le client
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        charte_template_id,
        'signature',
        'Signature électronique',
        'Le client signe électroniquement la charte',
        3,
        'client',
        true,
        24,
        '{"email": true, "push": true, "admin_notification": true}'::jsonb,
        '{"signature_type": "electronic", "requires_client": true}'::jsonb
    );

    -- Étape 4: Finalisation par l'admin
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        charte_template_id,
        'approval',
        'Finalisation dossier',
        'L''admin finalise le dossier et active les gains',
        4,
        'admin',
        true,
        6,
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"finalization": true, "activate_gains": true}'::jsonb
    );
END $$;

-- ===== 2. WORKFLOW RAPPORT D'ÉLIGIBILITÉ EXPERT =====
-- Expert analyse → Admin valide → Client notifié

INSERT INTO "WorkflowTemplate" (
    id, name, description, document_category, document_type, version, 
    is_active, estimated_total_duration, sla_hours, auto_start, 
    requires_expert, requires_signature, compliance_requirements, created_at
) VALUES (
    gen_random_uuid(), 
    'Rapport d''éligibilité expert',
    'Workflow pour la validation d''un rapport d''éligibilité par un expert',
    'rapport',
    'pdf',
    '1.0',
    true,
    72, -- 72h estimées
    96, -- SLA 96h
    true,
    true,
    ARRAY['expertise_validation', 'conformite_metier', 'validation_finale']
);

DO $$
DECLARE
    expert_template_id UUID;
BEGIN
    SELECT id INTO expert_template_id FROM "WorkflowTemplate" WHERE name = 'Rapport d''éligibilité expert';

    -- Étape 1: Analyse et rapport par l'expert
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        expert_template_id,
        'validation',
        'Analyse et rapport expert',
        'L''expert analyse le dossier et produit son rapport d''éligibilité',
        1,
        'expert',
        true,
        48,
        '{"email": true, "push": true, "admin_notification": true}'::jsonb,
        '{"expert_analysis": true, "requires_detailed_report": true}'::jsonb
    );

    -- Étape 2: Validation finale par l'admin
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        expert_template_id,
        'approval',
        'Validation finale éligibilité',
        'L''admin valide l''éligibilité finale du client',
        2,
        'admin',
        true,
        24,
        '{"email": true, "push": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"final_eligibility": true, "requires_admin_approval": true}'::jsonb
    );

    -- Étape 3: Notification au client
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        expert_template_id,
        'notification',
        'Notification résultat client',
        'Notification automatique du résultat d''éligibilité au client',
        3,
        'admin',
        true,
        1,
        '{"email": true, "push": true, "sms": true}'::jsonb,
        '{"client_notification": true, "automatic": true}'::jsonb
    );
END $$;

-- ===== 3. WORKFLOW BON DE COMMANDE =====
-- Client commande → Admin valide → Génération facture

INSERT INTO "WorkflowTemplate" (
    id, name, description, document_category, document_type, version, 
    is_active, estimated_total_duration, sla_hours, auto_start, 
    requires_expert, requires_signature, compliance_requirements, created_at
) VALUES (
    gen_random_uuid(), 
    'Bon de commande',
    'Workflow pour la validation d''un bon de commande client',
    'contrat',
    'pdf',
    '1.0',
    true,
    24, -- 24h estimées
    48, -- SLA 48h
    false,
    false,
    ARRAY['validation_commerciale', 'conformite_facturation']
);

DO $$
DECLARE
    commande_template_id UUID;
BEGIN
    SELECT id INTO commande_template_id FROM "WorkflowTemplate" WHERE name = 'Bon de commande';

    -- Étape 1: Soumission bon de commande par le client
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        commande_template_id,
        'upload',
        'Soumission bon de commande',
        'Le client soumet son bon de commande',
        1,
        'client',
        true,
        12,
        '{"email": true, "push": true, "admin_notification": true}'::jsonb,
        '{"document_type": "bon_commande", "requires_validation": true}'::jsonb
    );

    -- Étape 2: Validation commerciale par l'admin
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        commande_template_id,
        'validation',
        'Validation commerciale',
        'L''admin valide le bon de commande et génère la facture',
        2,
        'admin',
        true,
        12,
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"commercial_validation": true, "generate_invoice": true}'::jsonb
    );
END $$;

-- ===== 4. WORKFLOW FACTURE =====
-- Admin génère → Client notifié → Paiement

INSERT INTO "WorkflowTemplate" (
    id, name, description, document_category, document_type, version, 
    is_active, estimated_total_duration, sla_hours, auto_start, 
    requires_expert, requires_signature, compliance_requirements, created_at
) VALUES (
    gen_random_uuid(), 
    'Facturation',
    'Workflow pour la génération et envoi de factures',
    'facture',
    'pdf',
    '1.0',
    true,
    12, -- 12h estimées
    24, -- SLA 24h
    false,
    false,
    ARRAY['conformite_fiscale', 'facturation_legale']
);

DO $$
DECLARE
    facture_template_id UUID;
BEGIN
    SELECT id INTO facture_template_id FROM "WorkflowTemplate" WHERE name = 'Facturation';

    -- Étape 1: Génération facture par l'admin
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        facture_template_id,
        'upload',
        'Génération facture',
        'L''admin génère la facture automatiquement',
        1,
        'admin',
        true,
        2,
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"auto_generate": true, "invoice_type": "standard"}'::jsonb
    );

    -- Étape 2: Envoi et notification client
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        facture_template_id,
        'notification',
        'Envoi facture client',
        'Envoi automatique de la facture au client',
        2,
        'admin',
        true,
        1,
        '{"email": true, "push": true, "sms": true}'::jsonb,
        '{"auto_send": true, "payment_reminder": true}'::jsonb
    );
END $$;

-- ===== 5. WORKFLOW SUIVI ADMINISTRATIF =====
-- Admin suit → Notifications automatiques → Mise à jour statut

INSERT INTO "WorkflowTemplate" (
    id, name, description, document_category, document_type, version, 
    is_active, estimated_total_duration, sla_hours, auto_start, 
    requires_expert, requires_signature, compliance_requirements, created_at
) VALUES (
    gen_random_uuid(), 
    'Suivi administratif',
    'Workflow pour le suivi des dossiers auprès de l''administration française',
    'rapport',
    'pdf',
    '1.0',
    true,
    168, -- 168h estimées (1 semaine)
    240, -- SLA 240h (10 jours)
    false,
    false,
    ARRAY['suivi_administratif', 'notification_etapes', 'mise_a_jour_statut']
);

DO $$
DECLARE
    suivi_template_id UUID;
BEGIN
    SELECT id INTO suivi_template_id FROM "WorkflowTemplate" WHERE name = 'Suivi administratif';

    -- Étape 1: Envoi dossier à l'administration
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        suivi_template_id,
        'upload',
        'Envoi dossier administration',
        'Envoi du dossier complet à l''administration française',
        1,
        'admin',
        true,
        24,
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"admin_submission": true, "tracking_number": true}'::jsonb
    );

    -- Étape 2: Suivi acceptation dossier
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        suivi_template_id,
        'validation',
        'Suivi acceptation dossier',
        'Suivi de l''acceptation du dossier par l''administration',
        2,
        'admin',
        true,
        72,
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"admin_acceptance": true, "status_update": true}'::jsonb
    );

    -- Étape 3: Notification résultats
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        suivi_template_id,
        'notification',
        'Notification résultats',
        'Notification des résultats rendus par l''administration',
        3,
        'admin',
        true,
        24,
        '{"email": true, "push": true, "sms": true}'::jsonb,
        '{"results_notification": true, "payment_status": true}'::jsonb
    );

    -- Étape 4: Suivi versement
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        suivi_template_id,
        'notification',
        'Suivi versement',
        'Suivi du versement des fonds par l''administration',
        4,
        'admin',
        true,
        48,
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"payment_tracking": true, "fund_transfer": true}'::jsonb
    );
END $$;

-- ===== 6. WORKFLOW REMBOURSEMENT =====
-- Admin traite → Client notifié → Émission facture

INSERT INTO "WorkflowTemplate" (
    id, name, description, document_category, document_type, version, 
    is_active, estimated_total_duration, sla_hours, auto_start, 
    requires_expert, requires_signature, compliance_requirements, created_at
) VALUES (
    gen_random_uuid(), 
    'Remboursement client',
    'Workflow pour le traitement des remboursements clients',
    'facture',
    'pdf',
    '1.0',
    true,
    24, -- 24h estimées
    48, -- SLA 48h
    false,
    false,
    ARRAY['traitement_remboursement', 'emission_facture', 'notification_client']
);

DO $$
DECLARE
    remboursement_template_id UUID;
BEGIN
    SELECT id INTO remboursement_template_id FROM "WorkflowTemplate" WHERE name = 'Remboursement client';

    -- Étape 1: Traitement remboursement par l'admin
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        remboursement_template_id,
        'validation',
        'Traitement remboursement',
        'L''admin traite le remboursement et calcule le montant',
        1,
        'admin',
        true,
        12,
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"refund_processing": true, "amount_calculation": true}'::jsonb
    );

    -- Étape 2: Émission facture de remboursement
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        remboursement_template_id,
        'upload',
        'Émission facture remboursement',
        'Émission automatique de la facture de remboursement',
        2,
        'admin',
        true,
        6,
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"refund_invoice": true, "auto_generate": true}'::jsonb
    );

    -- Étape 3: Notification finale client
    INSERT INTO "WorkflowStep" (
        id, workflow_id, step_type, name, description, "order", 
        assigned_role, required, estimated_duration, notifications, metadata
    ) VALUES (
        gen_random_uuid(),
        remboursement_template_id,
        'notification',
        'Notification remboursement',
        'Notification finale du remboursement au client',
        3,
        'admin',
        true,
        1,
        '{"email": true, "push": true, "sms": true}'::jsonb,
        '{"final_notification": true, "refund_complete": true}'::jsonb
    );
END $$;

-- ===== VÉRIFICATION DES WORKFLOWS CRÉÉS =====

SELECT 
    wt.name as "Template",
    wt.document_category as "Catégorie",
    wt.estimated_total_duration as "Durée estimée (h)",
    wt.sla_hours as "SLA (h)",
    COUNT(ws.id) as "Nombre d'étapes"
FROM "WorkflowTemplate" wt
LEFT JOIN "WorkflowStep" ws ON wt.id = ws.workflow_id
GROUP BY wt.id, wt.name, wt.document_category, wt.estimated_total_duration, wt.sla_hours
ORDER BY wt.name;

-- ===== STATISTIQUES DES ÉTAPES PAR RÔLE =====

SELECT 
    ws.assigned_role as "Rôle",
    COUNT(*) as "Nombre d'étapes",
    STRING_AGG(DISTINCT wt.name, ', ') as "Templates concernés"
FROM "WorkflowStep" ws
JOIN "WorkflowTemplate" wt ON ws.workflow_id = wt.id
GROUP BY ws.assigned_role
ORDER BY ws.assigned_role; 