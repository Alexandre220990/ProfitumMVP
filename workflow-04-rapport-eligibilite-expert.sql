-- ===== WORKFLOW 4 : RAPPORT D'ÉLIGIBILITÉ EXPERT =====
-- PDF rapport expert (pas de validation admin, juste consultation)
-- SLA : 168h (1 semaine)

-- Création du template Rapport d'Éligibilité Expert
WITH inserted_expert_eligibilite AS (
    INSERT INTO "WorkflowTemplate" (
        id, name, description, document_category, document_type, version, 
        is_active, estimated_total_duration, sla_hours, auto_start, 
        requires_expert, requires_signature, compliance_requirements, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 
        'Rapport d''Éligibilité Expert',
        'Rapport d''éligibilité final produit par l''expert (pas de validation admin, juste consultation)',
        'rapport',
        'pdf',
        '1.0',
        true,
        168, -- 168h estimées (1 semaine)
        168, -- SLA 168h (1 semaine)
        true, -- Auto-start
        true, -- Expert requis
        false, -- Pas de signature requise
        ARRAY['expertise_validation', 'consultation_admin', 'notification_client'],
        now(),
        now()
    ) RETURNING id
)
-- Insertion des étapes du workflow Éligibilité Expert
INSERT INTO "WorkflowStep" (
    id, workflow_id, step_type, name, description, "order", 
    assigned_role, required, estimated_duration, notifications, metadata, created_at
) VALUES
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_expert_eligibilite), 
        'validation', 
        'Analyse et rapport expert', 
        'L''expert analyse le dossier et produit son rapport d''éligibilité final', 
        1, 
        'expert', 
        true, 
        120, -- 120h pour l'analyse (5 jours)
        '{"email": true, "push": true, "admin_notification": true}'::jsonb,
        '{"expert_analysis": true, "requires_detailed_report": true, "final_eligibility": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_expert_eligibilite), 
        'notification', 
        'Notification client et admin', 
        'Notification automatique du rapport au client et consultation admin', 
        2, 
        'expert', 
        true, 
        0, -- Immédiat
        '{"email": true, "push": true, "client_notification": true, "admin_notification": true}'::jsonb,
        '{"notify_client": true, "admin_consultation": true, "no_admin_validation": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_expert_eligibilite), 
        'share', 
        'Partage rapport final', 
        'Le rapport final est partagé dans l''espace documentaire du client', 
        3, 
        'expert', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": true, "client_notification": false}'::jsonb,
        '{"document_sharing": true, "client_space": true, "final_report": true}'::jsonb,
        now()
    );

-- Vérification de l'insertion
SELECT 
    'Rapport d''Éligibilité Expert créé avec succès' as status,
    wt.name as template_name,
    wt.document_category,
    wt.sla_hours as sla_heures,
    COUNT(ws.id) as nombre_etapes
FROM "WorkflowTemplate" wt
LEFT JOIN "WorkflowStep" ws ON wt.id = ws.workflow_id
WHERE wt.name = 'Rapport d''Éligibilité Expert'
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
WHERE wt.name = 'Rapport d''Éligibilité Expert'
ORDER BY ws."order"; 