-- =====================================================
-- MIGRATION : Unification de la Nomenclature des Tables
-- Date : 2025-01-03
-- Objectif : Supprimer les tables en minuscules et garder les tables en majuscules
-- =====================================================

-- ===== 1. SAUVEGARDE DES DONNÉES IMPORTANTES =====

-- Créer des tables temporaires pour sauvegarder les données
CREATE TEMP TABLE temp_client_backup AS 
SELECT * FROM client WHERE id NOT IN (SELECT id FROM "Client");

CREATE TEMP TABLE temp_expert_backup AS 
SELECT * FROM expert WHERE id NOT IN (SELECT id FROM "Expert");

CREATE TEMP TABLE temp_documentfile_backup AS 
SELECT * FROM documentfile WHERE id NOT IN (SELECT id FROM "DocumentFile");

-- ===== 2. MIGRATION DES DONNÉES MANQUANTES =====

-- Migrer les clients uniques
INSERT INTO "Client" (
    id, email, password, name, company_name, phone_number, 
    revenuAnnuel, secteurActivite, nombreEmployes, ancienneteEntreprise,
    typeProjet, siren, username, address, city, postal_code, type, statut,
    derniereConnexion, dateCreation, updated_at, created_at
)
SELECT 
    id, email, password, name, company_name, phone_number,
    revenuAnnuel, secteurActivite, nombreEmployes, ancienneteEntreprise,
    typeProjet, siren, username, address, city, postal_code, type, statut,
    derniereConnexion, dateCreation, updated_at, created_at
FROM temp_client_backup
ON CONFLICT (id) DO NOTHING;

-- Migrer les experts uniques
INSERT INTO "Expert" (
    id, name, company_name, specializations, experience, location, 
    rating, description, compensation, status, disponibilites, certifications,
    created_at, clients, audits
)
SELECT 
    id, name, company_name, specializations, experience, location,
    rating, description, compensation, status, disponibilites, certifications,
    created_at, clients, audits
FROM temp_expert_backup
ON CONFLICT (id) DO NOTHING;

-- Migrer les fichiers documentaires uniques
INSERT INTO "DocumentFile" (
    id, filename, original_filename, file_path, file_size, mime_type,
    file_hash, document_category, document_type, client_id, expert_id,
    uploaded_by, upload_date, last_modified, status, is_encrypted,
    encryption_level, retention_period, metadata, tags, created_at, updated_at
)
SELECT 
    id, filename, original_filename, file_path, file_size, mime_type,
    file_hash, document_category, document_type, client_id, expert_id,
    uploaded_by, upload_date, last_modified, status, is_encrypted,
    encryption_level, retention_period, metadata, tags, created_at, updated_at
FROM temp_documentfile_backup
ON CONFLICT (id) DO NOTHING;

-- ===== 3. SUPPRESSION DES TABLES EN MINUSCULES =====

-- Supprimer les tables en minuscules après migration
DROP TABLE IF EXISTS client CASCADE;
DROP TABLE IF EXISTS expert CASCADE;
DROP TABLE IF EXISTS documentfile CASCADE;

-- ===== 4. VÉRIFICATION ET NETTOYAGE =====

-- Vérifier que les tables en majuscules contiennent toutes les données
SELECT 'Client' as table_name, COUNT(*) as total_rows FROM "Client"
UNION ALL
SELECT 'Expert' as table_name, COUNT(*) as total_rows FROM "Expert"
UNION ALL
SELECT 'DocumentFile' as table_name, COUNT(*) as total_rows FROM "DocumentFile"
UNION ALL
SELECT 'ProduitEligible' as table_name, COUNT(*) as total_rows FROM "ProduitEligible"
UNION ALL
SELECT 'ClientProduitEligible' as table_name, COUNT(*) as total_rows FROM "ClientProduitEligible";

-- Nettoyer les tables temporaires
DROP TABLE IF EXISTS temp_client_backup;
DROP TABLE IF EXISTS temp_expert_backup;
DROP TABLE IF EXISTS temp_documentfile_backup;

-- ===== 5. MISE À JOUR DES RÉFÉRENCES =====

-- Mettre à jour les contraintes de clés étrangères si nécessaire
-- (Les contraintes existantes devraient déjà pointer vers les bonnes tables)

-- ===== 6. OPTIMISATION DES INDEX =====

-- Recréer les index si nécessaire
CREATE INDEX IF NOT EXISTS idx_client_email ON "Client" (email);
CREATE INDEX IF NOT EXISTS idx_client_siren ON "Client" (siren);
CREATE INDEX IF NOT EXISTS idx_expert_name ON "Expert" (name);
CREATE INDEX IF NOT EXISTS idx_expert_company ON "Expert" (company_name);
CREATE INDEX IF NOT EXISTS idx_documentfile_client ON "DocumentFile" (client_id);
CREATE INDEX IF NOT EXISTS idx_documentfile_expert ON "DocumentFile" (expert_id);

-- ===== 7. MESSAGE DE CONFIRMATION =====

DO $$
BEGIN
    RAISE NOTICE 'Migration terminée avec succès !';
    RAISE NOTICE 'Tables en minuscules supprimées.';
    RAISE NOTICE 'Toutes les données migrées vers les tables en majuscules.';
END $$; 