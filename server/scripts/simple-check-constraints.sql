-- ============================================================================
-- CRÉATION SIMPLE DES CONTRAINTES CHECK - BASE DE DONNÉES FINANCIALTRACKER
-- ============================================================================
-- Date : 15 janvier 2025
-- Objectif : Créer les contraintes CHECK avec une approche simple

-- ============================================================================
-- 1. CRÉATION SIMPLE DES CONTRAINTES CHECK
-- ============================================================================

-- Contrainte pour DossierStep.step_type
ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_step_type_check" 
CHECK (step_type IN ('validation', 'documentation', 'expertise', 'approval', 'payment'));

-- Contrainte pour DossierStep.status
ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_status_check" 
CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue'));

-- Contrainte pour DossierStep.priority
ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_priority_check" 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Contrainte pour DossierStep.assignee_type
ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_assignee_type_check" 
CHECK (assignee_type IN ('client', 'expert', 'admin'));

-- Contrainte pour DossierStep.progress
ALTER TABLE "DossierStep" 
ADD CONSTRAINT "DossierStep_progress_check" 
CHECK (progress >= 0 AND progress <= 100);

-- Contrainte pour ClientProduitEligible.statut
ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "ClientProduitEligible_statut_check" 
CHECK (statut IN ('eligible', 'ineligible', 'en_cours', 'termine', 'annule'));

-- Contrainte pour GEDDocument.category
ALTER TABLE "GEDDocument" 
ADD CONSTRAINT "GEDDocument_category_check" 
CHECK (category IN ('facture', 'contrat', 'rapport', 'certificat', 'autre', 'eligibilite_urssaf', 'technical'));

-- Contrainte pour expertassignment.status
ALTER TABLE expertassignment 
ADD CONSTRAINT "expertassignment_status_check" 
CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));

-- ============================================================================
-- 2. VÉRIFICATION DES CONTRAINTES CHECK CRÉÉES
-- ============================================================================

-- Vérifier toutes les contraintes CHECK créées
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%'
    AND conname LIKE '%_check'
ORDER BY table_name, constraint_name;

-- Vérifier le nombre total de contraintes CHECK
SELECT 
    COUNT(*) as total_check_constraints,
    'Contraintes CHECK créées' as description
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%';
