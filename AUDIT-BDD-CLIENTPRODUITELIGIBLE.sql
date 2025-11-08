-- ============================================================================
-- AUDIT COMPLET DE LA BASE DE DONNÉES - ClientProduitEligible
-- Date: 2025-01-10
-- Objectif: Vérifier la structure avant refonte des validations
-- ============================================================================

-- ============================================================================
-- 1. STRUCTURE DE LA TABLE ClientProduitEligible
-- ============================================================================
SELECT 
    column_name AS "Colonne",
    data_type AS "Type",
    is_nullable AS "Nullable",
    column_default AS "Défaut"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

| Colonne                        | Type                     | Nullable | Défaut                           |
| ------------------------------ | ------------------------ | -------- | -------------------------------- |
| id                             | uuid                     | NO       | uuid_generate_v4()               |
| clientId                       | uuid                     | NO       | null                             |
| produitId                      | uuid                     | NO       | null                             |
| statut                         | text                     | NO       | 'opportunité'::text              |
| tauxFinal                      | double precision         | YES      | null                             |
| montantFinal                   | double precision         | YES      | null                             |
| dureeFinale                    | integer                  | YES      | null                             |
| created_at                     | timestamp with time zone | NO       | (now() AT TIME ZONE 'utc'::text) |
| updated_at                     | timestamp with time zone | NO       | (now() AT TIME ZONE 'utc'::text) |
| simulationId                   | uuid                     | YES      | null                             |
| metadata                       | jsonb                    | YES      | '{}'::jsonb                      |
| notes                          | text                     | YES      | null                             |
| priorite                       | integer                  | YES      | 1                                |
| dateEligibilite                | timestamp with time zone | YES      | now()                            |
| current_step                   | integer                  | YES      | 0                                |
| progress                       | integer                  | YES      | 0                                |
| expert_id                      | uuid                     | YES      | null                             |
| charte_signed                  | boolean                  | YES      | false                            |
| charte_signed_at               | timestamp with time zone | YES      | null                             |
| sessionId                      | uuid                     | YES      | null                             |
| simulation_id                  | uuid                     | YES      | null                             |
| calcul_details                 | jsonb                    | YES      | null                             |
| expert_pending_id              | uuid                     | YES      | null                             |
| date_expert_accepted           | timestamp with time zone | YES      | null                             |
| date_audit_validated_by_client | timestamp with time zone | YES      | null                             |
| date_demande_envoyee           | timestamp with time zone | YES      | null                             |
| date_remboursement             | timestamp with time zone | YES      | null                             |
| eligibility_validated_at       | timestamp with time zone | YES      | null                             |
| pre_eligibility_validated_at   | timestamp with time zone | YES      | null                             |
| expert_report_status           | character varying        | YES      | null                             |
| validation_admin_notes         | text                     | YES      | null                             |
| documents_sent                 | jsonb                    | YES      | '[]'::jsonb                      |
| admin_eligibility_status       | character varying        | YES      | 'pending'::character varying     |
| admin_validated_by             | uuid                     | YES      | null                             |
| expert_validation_status       | character varying        | YES      | 'pending'::character varying     |
| expert_validated_at            | timestamp with time zone | YES      | null                             | 


-- ============================================================================
-- 2. INDEX ET CONTRAINTES
-- ============================================================================
SELECT 
    indexname AS "Nom Index",
    indexdef AS "Définition"
FROM pg_indexes
WHERE tablename = 'ClientProduitEligible'
ORDER BY indexname;

-- Contraintes
SELECT
    tc.constraint_name AS "Contrainte",
    tc.constraint_type AS "Type",
    kcu.column_name AS "Colonne",
    ccu.table_name AS "Table Liée",
    ccu.column_name AS "Colonne Liée"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'ClientProduitEligible'
ORDER BY tc.constraint_type, tc.constraint_name;

| Contrainte                                    | Type        | Colonne            | Table Liée            | Colonne Liée |
| --------------------------------------------- | ----------- | ------------------ | --------------------- | ------------ |
| ClientProduitEligible_admin_validated_by_fkey | FOREIGN KEY | admin_validated_by | Admin                 | id           |
| ClientProduitEligible_simulationId_fkey       | FOREIGN KEY | simulationId       | simulations           | id           |
| fk_clientproduiteligible_client               | FOREIGN KEY | clientId           | Client                | id           |
| fk_clientproduiteligible_expert               | FOREIGN KEY | expert_id          | Expert                | id           |
| fk_clientproduiteligible_expert_pending       | FOREIGN KEY | expert_pending_id  | Expert                | id           |
| fk_clientproduiteligible_produit              | FOREIGN KEY | produitId          | ProduitEligible       | id           |
| ClientProduitEligible_pkey                    | PRIMARY KEY | id                 | ClientProduitEligible | id           | 


-- ============================================================================
-- 3. VALEURS ACTUELLES DU CHAMP statut
-- ============================================================================
SELECT 
    statut AS "Statut",
    COUNT(*) AS "Nombre",
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS "Pourcentage %"
FROM "ClientProduitEligible"
WHERE statut IS NOT NULL
GROUP BY statut
ORDER BY COUNT(*) DESC;

| Statut                   | Nombre | Pourcentage % |
| ------------------------ | ------ | ------------- |
| pending_upload           | 55     | 63.95         |
| eligible                 | 19     | 22.09         |
| expert_assigned          | 6      | 6.98          |
| pending_admin_validation | 3      | 3.49          |
| admin_validated          | 2      | 2.33          |
| documents_requested      | 1      | 1.16          | 


-- ============================================================================
-- 4. ANALYSE DU CHAMP metadata
-- ============================================================================
-- Structure du metadata (échantillon)
SELECT 
    id,
    statut,
    metadata,
    created_at,
    updated_at
FROM "ClientProduitEligible"
WHERE metadata IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- Clés présentes dans metadata
SELECT DISTINCT
    jsonb_object_keys(metadata) AS "Clé metadata",
    COUNT(*) AS "Occurrences"
FROM "ClientProduitEligible"
WHERE metadata IS NOT NULL
GROUP BY "Clé metadata"
ORDER BY "Occurrences" DESC; 

| Clé metadata             | Occurrences |
| ------------------------ | ----------- |
| source                   | 82          |
| calculated_at            | 74          |
| type_produit             | 74          |
| old_statut               | 66          |
| reason                   | 5           |
| restored_at              | 5           |
| closing_probability      | 4           |
| documents_uploaded       | 4           |
| eligibility_validation   | 4           |
| eligible_validated_at    | 4           |
| expert_validation_needed | 4           |
| workflow_stage           | 4           |
| confidence_level         | 2           |
| original_percentage      | 2           |
| validation_state         | 2           |
| all_documents_validated  | 1           |
| audit_ready              | 1           |
| auto_progressed_to_audit | 1           |
| blocked                  | 1           |
| blocking_reason          | 1           |
| corrected_at             | 1           |
| corrected_by_script      | 1           |
| created_by_apporteur     | 1           |
| documents_missing        | 1           |
| documents_received_at    | 1           |
| fix_date                 | 1           |
| fixed_retroactively      | 1           |
| last_contact             | 1           |
| last_document_rejection  | 1           |
| missing_documents        | 1           |
| multi_product            | 1           |
| priority_label           | 1           |
| progressed_at            | 1           |
| related_cpe              | 1           |
| study_progress           | 1           |
| success_probability      | 1           | 



-- ============================================================================
-- 5. COLONNES LIÉES AUX VALIDATIONS EXISTANTES
-- ============================================================================
SELECT 
    column_name AS "Colonne",
    data_type AS "Type"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible'
AND (
    column_name ILIKE '%validation%' 
    OR column_name ILIKE '%validated%'
    OR column_name ILIKE '%eligib%'
    OR column_name ILIKE '%admin%'
    OR column_name ILIKE '%expert%'
)
ORDER BY column_name;

| Colonne                        | Type                     |
| ------------------------------ | ------------------------ |
| admin_eligibility_status       | character varying        |
| admin_validated_by             | uuid                     |
| dateEligibilite                | timestamp with time zone |
| date_audit_validated_by_client | timestamp with time zone |
| date_expert_accepted           | timestamp with time zone |
| eligibility_validated_at       | timestamp with time zone |
| expert_id                      | uuid                     |
| expert_pending_id              | uuid                     |
| expert_report_status           | character varying        |
| expert_validated_at            | timestamp with time zone |
| expert_validation_status       | character varying        |
| pre_eligibility_validated_at   | timestamp with time zone |
| validation_admin_notes         | text                     | 


-- ============================================================================
-- 6. STATISTIQUES GLOBALES
-- ============================================================================
SELECT 
    COUNT(*) AS "Total dossiers",
    COUNT(DISTINCT statut) AS "Nombre statuts différents",
    COUNT(CASE WHEN expert_id IS NOT NULL THEN 1 END) AS "Avec expert assigné",
    COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) AS "Avec metadata",
    COUNT(CASE WHEN statut ILIKE '%eligib%' THEN 1 END) AS "Statut éligibilité",
    COUNT(CASE WHEN statut ILIKE '%admin%' OR statut ILIKE '%validated%' THEN 1 END) AS "Validés admin/expert"
FROM "ClientProduitEligible"; 

| Total dossiers | Nombre statuts différents | Avec expert assigné | Avec metadata | Statut éligibilité | Validés admin/expert |
| -------------- | ------------------------- | ------------------- | ------------- | ------------------ | -------------------- |
| 86             | 6                         | 10                  | 86            | 19                 | 5                    | 



-- ============================================================================
-- 7. TABLES LIÉES (POUR COMPRENDRE L'IMPACT)
-- ============================================================================
-- Tables qui référencent ClientProduitEligible
SELECT 
    tc.table_name AS "Table référençante",
    kcu.column_name AS "Colonne FK",
    COUNT(*) AS "Nombre de références"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'ClientProduitEligible'
    AND tc.constraint_type = 'FOREIGN KEY'
GROUP BY tc.table_name, kcu.column_name
ORDER BY tc.table_name;

| Table référençante    | Colonne FK                 | Nombre de références |
| --------------------- | -------------------------- | -------------------- |
| ApporteurCommission   | client_produit_eligible_id | 1                    |
| ClientProcessDocument | client_produit_id          | 1                    |
| DossierComment        | dossier_id                 | 1                    |
| DossierCommentaire    | dossier_id                 | 1                    |
| DossierHistorique     | dossier_id                 | 1                    |
| DossierStep           | dossier_id                 | 1                    |
| ExpertAlert           | dossier_id                 | 1                    |
| RDV_Produits          | client_produit_eligible_id | 1                    |
| Reminder              | client_produit_eligible_id | 1                    |
| document_request      | dossier_id                 | 1                    |
| dossier_timeline      | dossier_id                 | 1                    |
| invoice               | client_produit_eligible_id | 1                    | GROUP BY


-- ============================================================================
-- 8. ÉCHANTILLON DE DOSSIERS PAR STATUT
-- ============================================================================
WITH statut_samples AS (
    SELECT 
        statut,
        id,
        "clientId",
        expert_id,
        current_step,
        progress,
        metadata->>'eligibility_validation' AS admin_validation,
        metadata->>'validation_state' AS expert_validation,
        created_at,
        updated_at,
        ROW_NUMBER() OVER (PARTITION BY statut ORDER BY updated_at DESC) AS rn
    FROM "ClientProduitEligible"
)
SELECT 
    statut AS "Statut",
    id AS "ID Dossier",
    CASE WHEN expert_id IS NOT NULL THEN '✓' ELSE '✗' END AS "Expert",
    current_step AS "Étape",
    progress AS "Progress %",
    admin_validation AS "Validation Admin",
    expert_validation AS "Validation Expert",
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI') AS "Dernière MAJ"
FROM statut_samples
WHERE rn <= 2
ORDER BY statut, updated_at DESC;

| Statut                   | ID Dossier                           | Expert | Étape | Progress % | Validation Admin                                                                                                                                                                                 | Validation Expert     | Dernière MAJ     |
| ------------------------ | ------------------------------------ | ------ | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ---------------- |
| admin_validated          | 57f606c7-00a6-40f0-bb72-ae1831345d99 | ✓      | 2     | 17         | {"notes": "", "status": "validated", "validated_at": "2025-11-03T17:38:25.076Z", "validated_by": "61797a61-edde-4816-b818-00015b627fe1", "validated_by_email": "grandjean.alexandre5@gmail.com"} | null                  | 2025-11-07 16:37 |
| admin_validated          | d9563628-cd44-423c-9a43-7249d68849db | ✗      | 2     | 25         | null                                                                                                                                                                                             | null                  | 2025-11-05 14:53 |
| documents_requested      | ffddb8df-4182-4447-8a43-3944bb85d976 | ✓      | 3     | 17         | {"notes": "", "status": "validated", "validated_at": "2025-11-04T13:45:47.431Z", "validated_by": "61797a61-edde-4816-b818-00015b627fe1", "validated_by_email": "grandjean.alexandre5@gmail.com"} | null                  | 2025-11-05 13:03 |
| eligible                 | 726e8ac0-1442-4c11-914b-0b5e8fb3f381 | ✗      | 1     | 0          | null                                                                                                                                                                                             | null                  | 2025-11-05 14:08 |
| eligible                 | 0dfe8479-4b1d-4545-b26f-c931b8d29ff4 | ✗      | 0     | 0          | null                                                                                                                                                                                             | null                  | 2025-11-05 14:08 |
| expert_assigned          | 4f14164f-d6ca-4d82-bf43-cd4953c88f2d | ✓      | 1     | 0          | {"notes": "", "status": "validated", "validated_at": "2025-11-04T13:03:00.942Z", "validated_by": "61797a61-edde-4816-b818-00015b627fe1", "validated_by_email": "grandjean.alexandre5@gmail.com"} | null                  | 2025-11-05 13:04 |
| expert_assigned          | 7c5ce284-7d08-472f-95d2-2612857f39f3 | ✓      | 0     | 0          | null                                                                                                                                                                                             | eligibility_validated | 2025-11-04 14:44 |
| pending_admin_validation | 08e8b023-c0de-4d76-a336-31be1f20ec76 | ✗      | 1     | 0          | null                                                                                                                                                                                             | null                  | 2025-11-04 14:44 |
| pending_admin_validation | 93374842-cca6-4873-b16e-0ada92e97004 | ✓      | 3     | 17         | null                                                                                                                                                                                             | null                  | 2025-11-04 14:44 |
| pending_upload           | db5a9e1a-8fba-4d8e-bcef-c10908cbed73 | ✗      | 0     | 0          | null                                                                                                                                                                                             | null                  | 2025-11-04 14:44 |
| pending_upload           | 46d7bc1f-7ab8-4307-b115-62ba06174dc9 | ✗      | 0     | 0          | null                                                                                                                                                                                             | null                  | 2025-11-04 14:44 | GROUP BY

 
-- ============================================================================
-- FIN DE L'AUDIT
-- ============================================================================

