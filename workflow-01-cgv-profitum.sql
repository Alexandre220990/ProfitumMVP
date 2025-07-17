-- ===== WORKFLOW 1 : CGV PROFITUM =====
-- Page publique avec case à cocher lors de l'inscription
-- SLA : Immédiat

-- Création du template CGV
WITH inserted_cgv AS (
    INSERT INTO "WorkflowTemplate" (
        id, name, description, document_category, document_type, version, 
        is_active, estimated_total_duration, sla_hours, auto_start, 
        requires_expert, requires_signature, compliance_requirements, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 
        'CGV Profitum',
        'Conditions Générales de Vente - Page publique avec validation lors de l''inscription',
        'contrat',
        'web', -- Type spécial pour page web
        '1.0',
        true,
        0, -- Immédiat
        0, -- SLA immédiat
        true, -- Auto-start
        false, -- Pas d'expert requis
        true, -- Signature électronique (case à cocher)
        ARRAY['rgpd', 'conformite_legale', 'cgv_obligatoire'],
        now(),
        now()
    ) RETURNING id
)
-- Insertion des étapes du workflow CGV
INSERT INTO "WorkflowStep" (
    id, workflow_id, step_type, name, description, "order", 
    assigned_role, required, estimated_duration, notifications, metadata, created_at
) VALUES
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_cgv), 
        'upload', 
        'Validation CGV', 
        'Le client valide les CGV en cochant la case lors de l''inscription', 
        1, 
        'client', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": false, "admin_notification": true}'::jsonb,
        '{"validation_type": "checkbox", "page_type": "public", "required_for_registration": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_cgv), 
        'notification', 
        'Confirmation inscription', 
        'Confirmation automatique de l''acceptation des CGV', 
        2, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": true, "push": false, "client_notification": true}'::jsonb,
        '{"auto_confirmation": true, "registration_complete": true}'::jsonb,
        now()
    );

-- Vérification de l'insertion
SELECT 
    'CGV Profitum créé avec succès' as status,
    wt.name as template_name,
    wt.document_category,
    wt.sla_hours as sla_heures,
    COUNT(ws.id) as nombre_etapes
FROM "WorkflowTemplate" wt
LEFT JOIN "WorkflowStep" ws ON wt.id = ws.workflow_id
WHERE wt.name = 'CGV Profitum'
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
WHERE wt.name = 'CGV Profitum'
ORDER BY ws."order"; 