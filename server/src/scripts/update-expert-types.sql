-- ============================================================================
-- SCRIPT : MISE À JOUR DES TYPES TYPESCRIPT APRÈS AJOUT DES CHAMPS CALCULÉS
-- ============================================================================
-- Ce script génère les types TypeScript mis à jour pour l'interface Expert
-- ============================================================================

-- Générer le type TypeScript pour l'interface Expert
SELECT 
'export interface Expert {' || E'\n' ||
'  id: string;' || E'\n' ||
'  email: string;' || E'\n' ||
'  name: string;' || E'\n' ||
'  company_name: string;' || E'\n' ||
'  siren: string;' || E'\n' ||
'  specializations: string[];' || E'\n' ||
'  experience: string;' || E'\n' ||
'  location: string;' || E'\n' ||
'  rating: number;' || E'\n' ||
'  compensation: number | null;' || E'\n' ||
'  description: string | null;' || E'\n' ||
'  status: string;' || E'\n' ||
'  disponibilites: any | null;' || E'\n' ||
'  certifications: any | null;' || E'\n' ||
'  card_number: string | null;' || E'\n' ||
'  card_expiry: string | null;' || E'\n' ||
'  card_cvc: string | null;' || E'\n' ||
'  abonnement: string | null;' || E'\n' ||
'  website: string | null;' || E'\n' ||
'  linkedin: string | null;' || E'\n' ||
'  languages: string[] | null;' || E'\n' ||
'  availability: string | null;' || E'\n' ||
'  max_clients: number | null;' || E'\n' ||
'  hourly_rate: number | null;' || E'\n' ||
'  phone: string | null;' || E'\n' ||
'  auth_id: string | null;' || E'\n' ||
'  approved_by: string | null;' || E'\n' ||
'  approved_at: string | null;' || E'\n' ||
'  approval_status: string | null;' || E'\n' ||
'  total_assignments: number;' || E'\n' ||
'  completed_assignments: number;' || E'\n' ||
'  total_earnings: number;' || E'\n' ||
'  monthly_earnings: number;' || E'\n' ||
'  created_at: string;' || E'\n' ||
'  updated_at: string;' || E'\n' ||
'}' as typescript_interface;

-- Générer le type TypeScript pour l'interface PublicExpert
SELECT 
'export interface PublicExpert {' || E'\n' ||
'  id: string;' || E'\n' ||
'  name: string;' || E'\n' ||
'  company_name: string;' || E'\n' ||
'  specializations: string[];' || E'\n' ||
'  experience: string;' || E'\n' ||
'  location: string;' || E'\n' ||
'  rating: number;' || E'\n' ||
'  status: string;' || E'\n' ||
'  description: string | null;' || E'\n' ||
'  website: string | null;' || E'\n' ||
'  linkedin: string | null;' || E'\n' ||
'  languages: string[] | null;' || E'\n' ||
'  availability: string | null;' || E'\n' ||
'  max_clients: number | null;' || E'\n' ||
'  hourly_rate: number | null;' || E'\n' ||
'  phone: string | null;' || E'\n' ||
'  approval_status: string | null;' || E'\n' ||
'  total_assignments: number;' || E'\n' ||
'  completed_assignments: number;' || E'\n' ||
'  total_earnings: number;' || E'\n' ||
'  monthly_earnings: number;' || E'\n' ||
'}' as public_expert_interface;

-- ============================================================================
-- INSTRUCTIONS POUR MISE À JOUR MANUELLE DES TYPES TYPESCRIPT
-- ============================================================================

-- 1. Copier le résultat de la première requête dans client/src/types/expert.ts
-- 2. Copier le résultat de la deuxième requête pour PublicExpert
-- 3. Ajouter les nouveaux champs calculés aux interfaces existantes

-- ============================================================================
-- VÉRIFICATION DES NOUVEAUX CHAMPS
-- ============================================================================

-- Vérifier que les nouveaux champs sont présents
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Expert' 
AND column_name IN (
    'total_assignments', 
    'completed_assignments', 
    'total_earnings', 
    'monthly_earnings'
)
ORDER BY column_name;

-- Afficher un exemple avec les nouveaux champs
SELECT 
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings,
    CASE 
        WHEN total_assignments > 0 
        THEN ROUND((completed_assignments::DECIMAL / total_assignments) * 100, 2)
        ELSE 0 
    END as success_rate
FROM "Expert" 
LIMIT 3; 