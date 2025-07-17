-- ===== WORKFLOW 6 : FACTURE (ATTESTATION DE VERSEMENT) =====
-- PDF facture (double système : client + expert)
-- Attestation du futur versement par Profitum
-- SLA : Immédiat (après réception fonds sur comptes Profitum)

-- Création du template Facture
WITH inserted_facture AS (
    INSERT INTO "WorkflowTemplate" (
        id, name, description, document_category, document_type, version, 
        is_active, estimated_total_duration, sla_hours, auto_start, 
        requires_expert, requires_signature, compliance_requirements, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 
        'Facture (Attestation de Versement)',
        'Facture émise après réception des fonds sur les comptes Profitum - Attestation du futur versement',
        'facture',
        'pdf',
        '1.0',
        true,
        0, -- Immédiat
        0, -- SLA immédiat
        true, -- Auto-start
        true, -- Expert impliqué
        false, -- Pas de signature requise
        ARRAY['attestation_versement', 'double_systeme', 'profitum_center'],
        now(),
        now()
    ) RETURNING id
)
-- Insertion des étapes du workflow Facture
INSERT INTO "WorkflowStep" (
    id, workflow_id, step_type, name, description, "order", 
    assigned_role, required, estimated_duration, notifications, metadata, created_at
) VALUES
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_facture), 
        'upload', 
        'Génération facture client', 
        'L''admin génère la facture pour le client après réception des fonds', 
        1, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": false, "admin_notification": false}'::jsonb,
        '{"invoice_type": "client", "after_funds_reception": true, "attestation_versement": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_facture), 
        'upload', 
        'Génération facture expert', 
        'L''admin génère la facture pour l''expert après réception des fonds', 
        2, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": false, "admin_notification": false}'::jsonb,
        '{"invoice_type": "expert", "after_funds_reception": true, "attestation_versement": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_facture), 
        'notification', 
        'Notification client et expert', 
        'Notification automatique des factures au client et à l''expert', 
        3, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": true, "push": true, "client_notification": true, "expert_notification": true}'::jsonb,
        '{"notify_client": true, "notify_expert": true, "double_system": true, "profitum_center": true}'::jsonb,
        now()
    ),
    (
        gen_random_uuid(), 
        (SELECT id FROM inserted_facture), 
        'share', 
        'Partage factures', 
        'Les factures sont partagées dans les espaces documentaires respectifs', 
        4, 
        'admin', 
        true, 
        0, -- Immédiat
        '{"email": false, "push": true, "client_notification": false}'::jsonb,
        '{"document_sharing": true, "client_space": true, "expert_space": true, "separate_invoices": true}'::jsonb,
        now()
    );

-- Vérification de l'insertion
SELECT 
    'Facture créée avec succès' as status,
    wt.name as template_name,
    wt.document_category,
    wt.sla_hours as sla_heures,
    COUNT(ws.id) as nombre_etapes
FROM "WorkflowTemplate" wt
LEFT JOIN "WorkflowStep" ws ON wt.id = ws.workflow_id
WHERE wt.name = 'Facture (Attestation de Versement)'
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
WHERE wt.name = 'Facture (Attestation de Versement)'
ORDER BY ws."order"; 