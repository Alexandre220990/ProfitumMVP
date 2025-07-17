-- ===== WORKFLOW 3 : RAPPORT DE PRÉÉLIGIBILITÉ =====
-- PDF d'éligibilité Profitum après analyse des premiers documents
-- SLA : 48h

-- Création du template Rapport de Prééligibilité
WITH inserted_preeligibilite AS (
    INSERT INTO "WorkflowTemplate" (
        id, name, description, document_category, document_type, version, 
        is_active, estimated_total_duration, sla_hours, auto_start, 
        requires_expert, requires_signature, compliance_requirements, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 
        'Rapport de Prééligibilité Profitum',
        'Rapport d''éligibilité généré après analyse des premiers documents du dossier ClientProduitEligible',
        'rapport',
        'pdf',
        '1.0',
        true,
        48, -- 48h estimées
        48, -- SLA 48h
        true, -- Auto-start
        false, -- Pas d'expert requis pour la génération
        false, -- Pas de signature requise
        ARRAY['analyse_documents', 'pre_eligibilite', 'notification_expert'],
        now(),
        now()
    ) RETURNING id
)
-- Insertion des étapes du workflow Prééligibilité
INSERT INTO "WorkflowStep" (
    id, workflow_id, step_type, name, description, "order", 
    assigned_role, required, estimated_duration, notifications, metadata, created_at
) VALUES
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_preeligibilite), 
        'upload', 
        'Génération rapport prééligibilité', 
        'L''admin ou le système génère le rapport de prééligibilité après analyse des documents', 
        1, 
        'admin', 
        true, 
        24, -- 24h pour l'analyse
        '{"email": false, "push": false, "admin_notification": false}'::jsonb,
        '{"document_type": "pre_eligibility_report", "based_on_clientproduiteligible": true, "analysis_required": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_preeligibilite), 
        'notification', 
        'Notification client et expert', 
        'Notification automatique au client et à l''expert préselectionné', 
        2, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": true, "push": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"notify_client": true, "notify_expert": true, "expert_pre_selected": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_preeligibilite), 
        'share', 
        'Partage documentaire', 
        'Le rapport est partagé dans l''espace documentaire du client et accessible à l''expert', 
        3, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": true, "client_notification": false}'::jsonb,
        '{"document_sharing": true, "client_space": true, "expert_access": true}'::jsonb,
        now()
    );

-- Vérification de l'insertion
SELECT 
    'Rapport de Prééligibilité créé avec succès' as status,
    wt.name as template_name,
    wt.document_category,
    wt.sla_hours as sla_heures,
    COUNT(ws.id) as nombre_etapes
FROM "WorkflowTemplate" wt
LEFT JOIN "WorkflowStep" ws ON wt.id = ws.workflow_id
WHERE wt.name = 'Rapport de Prééligibilité Profitum'
GROUP BY wt.id, wt.name, wt.document_category, wt.sla_hours;

-- Affichage des étapes créées
SELECT 
    ws."order" as ordre,
    ws.name as etape,
    ws.assigned_role as role,
    ws.estimated_duration as duree_estimee,
    ws.metadata
FROM "WorkflowStep" ws
JOIN "WorkflowTemplate" wt ON ws.workflow_id = wt.id
WHERE wt.name = 'Rapport de Prééligibilité Profitum'
ORDER BY ws."order"; 