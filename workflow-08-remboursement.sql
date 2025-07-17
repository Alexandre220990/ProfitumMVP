-- ===== WORKFLOW 8 : REMBOURSEMENT =====
-- PDF facture remboursement (Profitum → Client + Profitum → Expert)
-- SLA : 48h

-- Création du template Remboursement
WITH inserted_remboursement AS (
    INSERT INTO "WorkflowTemplate" (
        id, name, description, document_category, document_type, version, 
        is_active, estimated_total_duration, sla_hours, auto_start, 
        requires_expert, requires_signature, compliance_requirements, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 
        'Remboursement (Client + Expert)',
        'Facture de remboursement émise par Profitum vers le client et l''expert',
        'facture',
        'pdf',
        '1.0',
        true,
        48, -- 48h estimées
        48, -- SLA 48h
        true, -- Auto-start
        true, -- Expert impliqué
        false, -- Pas de signature requise
        ARRAY['remboursement_client', 'remboursement_expert', 'profitum_center'],
        now(),
        now()
    ) RETURNING id
)
-- Insertion des étapes du workflow Remboursement
INSERT INTO "WorkflowStep" (
    id, workflow_id, step_type, name, description, "order", 
    assigned_role, required, estimated_duration, notifications, metadata, created_at
) VALUES
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_remboursement), 
        'validation', 
        'Traitement remboursement client', 
        'L''admin traite le remboursement client et calcule le montant', 
        1, 
        'admin', 
        true, 
        24, -- 24h pour traitement
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"refund_processing": true, "amount_calculation": true, "client_refund": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_remboursement), 
        'validation', 
        'Traitement remboursement expert', 
        'L''admin traite le remboursement expert et calcule le montant', 
        2, 
        'admin', 
        true, 
        24, -- 24h pour traitement
        '{"email": true, "push": true, "expert_notification": true}'::jsonb,
        '{"refund_processing": true, "amount_calculation": true, "expert_refund": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_remboursement), 
        'upload', 
        'Émission facture remboursement client', 
        'Émission automatique de la facture de remboursement client', 
        3, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": true, "push": true, "client_notification": true}'::jsonb,
        '{"refund_invoice": true, "auto_generate": true, "client_invoice": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_remboursement), 
        'upload', 
        'Émission facture remboursement expert', 
        'Émission automatique de la facture de remboursement expert', 
        4, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": true, "push": true, "expert_notification": true}'::jsonb,
        '{"refund_invoice": true, "auto_generate": true, "expert_invoice": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_remboursement), 
        'notification', 
        'Notification finale remboursements', 
        'Notification finale des remboursements au client et à l''expert', 
        5, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": true, "push": true, "sms": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"final_notification": true, "refund_complete": true, "both_parties": true}'::jsonb,
        now()
    );

-- Vérification de l'insertion
SELECT 
    'Remboursement créé avec succès' as status,
    wt.name as template_name,
    wt.document_category,
    wt.sla_hours as sla_heures,
    COUNT(ws.id) as nombre_etapes
FROM "WorkflowTemplate" wt
LEFT JOIN "WorkflowStep" ws ON wt.id = ws.workflow_id
WHERE wt.name = 'Remboursement (Client + Expert)'
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
WHERE wt.name = 'Remboursement (Client + Expert)'
ORDER BY ws."order"; 