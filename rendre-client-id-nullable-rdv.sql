-- ============================================================================
-- SCRIPT SQL : RENDRE client_id NULLABLE DANS LA TABLE RDV
-- ============================================================================
-- Objectif : Permettre la création d'événements sans client spécifique
--            (événements personnels pour admins)
-- Date : 25 Novembre 2025
-- ============================================================================

BEGIN;

-- 1️⃣ VÉRIFIER LA STRUCTURE ACTUELLE
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'RDV'
  AND column_name = 'client_id';

-- 2️⃣ RENDRE client_id NULLABLE
-- ============================================================================
-- Rendre client_id nullable pour permettre des événements personnels
ALTER TABLE public."RDV" 
  ALTER COLUMN client_id DROP NOT NULL;

-- 3️⃣ VÉRIFIER LA MODIFICATION
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'RDV'
  AND column_name = 'client_id';

SELECT '✅ client_id est maintenant nullable dans la table RDV' as statut;

COMMIT;

