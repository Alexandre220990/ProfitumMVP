-- ===== WORKFLOW 7 : SUIVI ADMINISTRATIF (RÉVISÉ) =====
-- PDF rapport + justificatifs
-- Suivi complet du processus administratif pour client ET expert
-- SLA : 240h (10 jours)

-- Création du template Suivi Administratif
WITH inserted_suivi AS (
    INSERT INTO "WorkflowTemplate" (
        id, name, description, document_category, document_type, version, 
        is_active, estimated_total_duration, sla_hours, auto_start, 
        requires_expert, requires_signature, compliance_requirements, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 
        'Suivi Administratif (Client + Expert)',
        'Suivi complet du processus administratif auprès de l''administration française pour client et expert',
        'rapport',
        'pdf',
        '1.0',
        true,
        240, -- 240h estimées (10 jours)
        240, -- SLA 240h (10 jours)
        true, -- Auto-start
        true, -- Expert impliqué
        false, -- Pas de signature requise
        ARRAY['suivi_administratif', 'notification_etapes', 'suivi_client_expert'],
        now(),
        now()
    ) RETURNING id
)
-- Insertion des étapes du workflow Suivi Administratif
INSERT INTO "WorkflowStep" (
    id, workflow_id, step_type, name, description, "order", 
    assigned_role, required, estimated_duration, notifications, metadata, created_at
) VALUES
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_suivi), 
        'upload', 
        'Envoi dossier administration', 
        'L''admin envoie le dossier complet à l''administration française', 
        1, 
        'admin', 
        true, 
        24, -- 24h pour l'envoi
        '{"email": true, "push": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"admin_submission": true, "tracking_number": true, "complete_dossier": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_suivi), 
        'validation', 
        'Suivi acceptation dossier', 
        'L''admin suit l''acceptation du dossier par l''administration', 
        2, 
        'admin', 
        true, 
        72, -- 72h pour le suivi
        '{"email": true, "push": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"admin_acceptance": true, "status_update": true, "tracking_required": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_suivi), 
        'notification', 
        'Notification résultats', 
        'L''admin notifie les résultats rendus par l''administration', 
        3, 
        'admin', 
        true, 
        24, -- 24h pour notification
        '{"email": true, "push": true, "sms": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"results_notification": true, "payment_status": true, "admin_results": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_suivi), 
        'notification', 
        'Suivi versement', 
        'L''admin suit le versement des fonds par l''administration', 
        4, 
        'admin', 
        true, 
        48, -- 48h pour suivi versement
        '{"email": true, "push": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"payment_tracking": true, "fund_transfer": true, "final_status": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_suivi), 
        'share', 
        'Partage rapport final', 
        'Le rapport de suivi administratif est partagé avec client et expert', 
        5, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": true, "client_notification": false}'::jsonb,
        '{"document_sharing": true, "client_space": true, "expert_space": true, "final_report": true}'::jsonb,
        now()
    );

-- Vérification de l'insertion
SELECT 
    'Suivi Administratif créé avec succès' as status,
    wt.name as template_name,
    wt.document_category,
    wt.sla_hours as sla_heures,
    COUNT(ws.id) as nombre_etapes
FROM "WorkflowTemplate" wt
LEFT JOIN "WorkflowStep" ws ON wt.id = ws.workflow_id
WHERE wt.name = 'Suivi Administratif (Client + Expert)'
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
WHERE wt.name = 'Suivi Administratif (Client + Expert)'
ORDER BY ws."order"; 