-- ===== WORKFLOW 5 : BON DE COMMANDE (ÉTAT DE REMBOURSEMENT) =====
-- PDF généré automatiquement après rapport définitif expert
-- Engagement Profitum à verser les montants dus
-- SLA : Immédiat

-- Création du template Bon de Commande
WITH inserted_bdc AS (
    INSERT INTO "WorkflowTemplate" (
        id, name, description, document_category, document_type, version, 
        is_active, estimated_total_duration, sla_hours, auto_start, 
        requires_expert, requires_signature, compliance_requirements, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 
        'Bon de Commande (État de Remboursement)',
        'Bon de commande généré automatiquement après rapport définitif expert - Engagement Profitum à verser',
        'contrat',
        'pdf',
        '1.0',
        true,
        0, -- Immédiat
        0, -- SLA immédiat
        true, -- Auto-start
        true, -- Expert impliqué
        false, -- Pas de signature requise
        ARRAY['engagement_versement', 'validation_admin', 'generation_facture'],
        now(),
        now()
    ) RETURNING id
)
-- Insertion des étapes du workflow Bon de Commande
INSERT INTO "WorkflowStep" (
    id, workflow_id, step_type, name, description, "order", 
    assigned_role, required, estimated_duration, notifications, metadata, created_at
) VALUES
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_bdc), 
        'upload', 
        'Génération automatique BDC', 
        'Le système génère automatiquement le bon de commande après rapport définitif expert', 
        1, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": false, "admin_notification": true}'::jsonb,
        '{"auto_generate": true, "document_type": "bon_commande", "after_expert_report": true, "engagement_profitum": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_bdc), 
        'validation', 
        'Validation commerciale admin', 
        'L''admin valide le bon de commande pour éviter toute erreur sur les montants', 
        2, 
        'admin', 
        true, 
        12, -- 12h pour validation
        '{"email": true, "push": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"commercial_validation": true, "error_prevention": true, "amount_verification": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_bdc), 
        'upload', 
        'Génération facture', 
        'Génération automatique de la facture après validation du BDC', 
        3, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": true, "push": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"invoice_generation": true, "after_bdc_validation": true, "profitum_center": true}'::jsonb,
        now()
    );

-- Vérification de l'insertion
SELECT 
    'Bon de Commande créé avec succès' as status,
    wt.name as template_name,
    wt.document_category,
    wt.sla_hours as sla_heures,
    COUNT(ws.id) as nombre_etapes
FROM "WorkflowTemplate" wt
LEFT JOIN "WorkflowStep" ws ON wt.id = ws.workflow_id
WHERE wt.name = 'Bon de Commande (État de Remboursement)'
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
WHERE wt.name = 'Bon de Commande (État de Remboursement)'
ORDER BY ws."order"; 