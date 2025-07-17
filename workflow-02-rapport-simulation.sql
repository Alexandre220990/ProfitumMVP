-- ===== WORKFLOW 2 : RAPPORT DE SIMULATION =====
-- PDF personnalisé généré automatiquement après simulation
-- SLA : Immédiat

-- Création du template Rapport de Simulation
WITH inserted_simulation AS (
    INSERT INTO "WorkflowTemplate" (
        id, name, description, document_category, document_type, version, 
        is_active, estimated_total_duration, sla_hours, auto_start, 
        requires_expert, requires_signature, compliance_requirements, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 
        'Rapport de Simulation Profitum',
        'Rapport personnalisé généré automatiquement après utilisation du simulateur',
        'simulation',
        'pdf',
        '1.0',
        true,
        0, -- Immédiat
        0, -- SLA immédiat
        true, -- Auto-start
        false, -- Pas d'expert requis
        false, -- Pas de signature requise
        ARRAY['simulation_resultats', 'personnalisation_client', 'accessibilite_documentaire'],
        now(),
        now()
    ) RETURNING id
)
-- Insertion des étapes du workflow Simulation
INSERT INTO "WorkflowStep" (
    id, workflow_id, step_type, name, description, "order", 
    assigned_role, required, estimated_duration, notifications, metadata, created_at
) VALUES
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_simulation), 
        'upload', 
        'Génération rapport simulation', 
        'Le système génère automatiquement un PDF personnalisé avec les résultats du simulateur', 
        1, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": false, "admin_notification": false}'::jsonb,
        '{"auto_generate": true, "document_type": "simulation_report", "personalized": true, "based_on_simulator": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_simulation), 
        'notification', 
        'Accessibilité documentaire', 
        'Le rapport est automatiquement accessible dans l''espace documentaire du client', 
        2, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": true, "client_notification": false}'::jsonb,
        '{"auto_accessibility": true, "document_space": true, "no_email_required": true}'::jsonb,
        now()
    );

-- Vérification de l'insertion
SELECT 
    'Rapport de Simulation créé avec succès' as status,
    wt.name as template_name,
    wt.document_category,
    wt.sla_hours as sla_heures,
    COUNT(ws.id) as nombre_etapes
FROM "WorkflowTemplate" wt
LEFT JOIN "WorkflowStep" ws ON wt.id = ws.workflow_id
WHERE wt.name = 'Rapport de Simulation Profitum'
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
WHERE wt.name = 'Rapport de Simulation Profitum'
ORDER BY ws."order"; 