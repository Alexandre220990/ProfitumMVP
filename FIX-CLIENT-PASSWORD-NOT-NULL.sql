-- =====================================================
-- FIX: Supprimer contrainte NOT NULL sur Client.password
-- =====================================================
-- PROBLÈME:
-- - Supabase Auth gère l'authentification (pas la table Client)
-- - Le backend n'insère PAS de password dans Client
-- - Erreur: "null value in column password violates not-null constraint"
--
-- SOLUTION:
-- - Rendre Client.password NULLABLE
-- - L'authentification est gérée par Supabase Auth
-- =====================================================

BEGIN;

-- Vérifier la contrainte actuelle
SELECT 
    '═══ ÉTAT ACTUEL COLONNE password ═══' as titre;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Client'
  AND column_name = 'password';

-- ============================================================================
-- SUPPRIMER LA CONTRAINTE NOT NULL
-- ============================================================================

ALTER TABLE "Client" 
ALTER COLUMN password DROP NOT NULL;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

SELECT 
    '═══ COLONNE password APRÈS MODIFICATION ═══' as titre;

SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ Nullable (OK)'
        ELSE '❌ Still NOT NULL'
    END as statut
FROM information_schema.columns
WHERE table_name = 'Client'
  AND column_name = 'password';

COMMIT;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================
/*
✅ CORRECTION APPLIQUÉE:
- Client.password est maintenant NULLABLE
- L'authentification est gérée par Supabase Auth
- Le champ password dans Client n'est plus utilisé

COMPORTEMENT:
- Nouveaux clients: password = NULL (auth via Supabase Auth)
- Anciens clients: password peut rester (pour compatibilité)

PROCHAINES ÉTAPES:
1. Tester l'inscription après simulation
2. Vérifier que le compte est créé sans erreur
3. Se connecter avec le compte créé
*/

