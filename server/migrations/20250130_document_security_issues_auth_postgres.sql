-- ============================================================================
-- DOCUMENTATION : Problèmes de sécurité identifiés par le linter Supabase
-- ============================================================================
-- Date : 2025-01-30
-- Description : Documente et vérifie les problèmes de sécurité suivants :
--               1. Protection contre les mots de passe compromis désactivée
--               2. Version de Postgres avec correctifs de sécurité disponibles
-- ============================================================================
-- NOTE : Ces problèmes nécessitent des actions manuelles via le Dashboard Supabase
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTIE 1 : VÉRIFICATION DE LA VERSION DE POSTGRES
-- ============================================================================

DO $$
DECLARE
    current_version TEXT;
    recommended_version TEXT := 'supabase-postgres-15.8.1.100+'; -- Version minimale recommandée
BEGIN
    -- Récupérer la version actuelle de PostgreSQL
    SELECT version() INTO current_version;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'VÉRIFICATION DE LA VERSION POSTGRES';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Version actuelle : %', current_version;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  PROBLÈME DÉTECTÉ :';
    RAISE NOTICE '    La version actuelle de Postgres a des correctifs de sécurité disponibles.';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACTION REQUISE :';
    RAISE NOTICE '    1. Connectez-vous au Dashboard Supabase : https://app.supabase.com';
    RAISE NOTICE '    2. Sélectionnez votre projet';
    RAISE NOTICE '    3. Allez dans Settings → Database';
    RAISE NOTICE '    4. Vérifiez la section "Database version"';
    RAISE NOTICE '    5. Si une mise à jour est disponible, cliquez sur "Upgrade" ou "Update"';
    RAISE NOTICE '    6. Suivez les instructions à l''écran';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT :';
    RAISE NOTICE '    - Les mises à jour peuvent nécessiter un redémarrage';
    RAISE NOTICE '    - Planifiez pendant une période de faible trafic';
    RAISE NOTICE '    - Faites une sauvegarde avant la mise à jour si possible';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Documentation :';
    RAISE NOTICE '    https://supabase.com/docs/guides/platform/upgrading';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- PARTIE 2 : DOCUMENTATION - PROTECTION CONTRE LES MOTS DE PASSE COMPROMIS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'PROTECTION CONTRE LES MOTS DE PASSE COMPROMIS';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '⚠️  PROBLÈME DÉTECTÉ :';
    RAISE NOTICE '    La protection contre les mots de passe compromis (HaveIBeenPwned)';
    RAISE NOTICE '    est actuellement désactivée.';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACTION REQUISE :';
    RAISE NOTICE '    1. Connectez-vous au Dashboard Supabase : https://app.supabase.com';
    RAISE NOTICE '    2. Sélectionnez votre projet';
    RAISE NOTICE '    3. Allez dans Authentication → Settings → Password';
    RAISE NOTICE '    4. Activez "Leaked Password Protection"';
    RAISE NOTICE '       (Protection contre les mots de passe compromis)';
    RAISE NOTICE '    5. Cliquez sur Save';
    RAISE NOTICE '';
    RAISE NOTICE 'ℹ️  QU''EST-CE QUE C''EST ?';
    RAISE NOTICE '    Supabase Auth peut vérifier si un mot de passe a été compromis';
    RAISE NOTICE '    en le comparant avec la base de données HaveIBeenPwned.org.';
    RAISE NOTICE '    Cette fonctionnalité empêche l''utilisation de mots de passe';
    RAISE NOTICE '    qui ont été exposés lors de fuites de données.';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Documentation :';
    RAISE NOTICE '    https://supabase.com/docs/guides/auth/password-security';
    RAISE NOTICE '    #password-strength-and-leaked-password-protection';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- PARTIE 3 : CRÉATION D'UNE TABLE DE SUIVI DES PROBLÈMES DE SÉCURITÉ
-- ============================================================================

-- Créer une table pour suivre les problèmes de sécurité identifiés
CREATE TABLE IF NOT EXISTS security_issues_tracking (
    id SERIAL PRIMARY KEY,
    issue_name TEXT NOT NULL UNIQUE,
    issue_type TEXT NOT NULL, -- 'AUTH', 'DATABASE', 'CONFIG', etc.
    severity TEXT NOT NULL, -- 'WARN', 'ERROR', 'CRITICAL'
    description TEXT NOT NULL,
    remediation_steps TEXT NOT NULL,
    documentation_url TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    notes TEXT
);

-- Insérer les problèmes identifiés
INSERT INTO security_issues_tracking (
    issue_name,
    issue_type,
    severity,
    description,
    remediation_steps,
    documentation_url
) VALUES (
    'auth_leaked_password_protection',
    'AUTH',
    'WARN',
    'Leaked password protection is currently disabled. Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org. Enable this feature to enhance security.',
    '1. Go to Dashboard Supabase → Authentication → Settings → Password
2. Enable "Leaked Password Protection"
3. Click Save',
    'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection'
) ON CONFLICT (issue_name) DO UPDATE SET
    detected_at = NOW(),
    resolved_at = NULL,
    resolved_by = NULL;

INSERT INTO security_issues_tracking (
    issue_name,
    issue_type,
    severity,
    description,
    remediation_steps,
    documentation_url
) VALUES (
    'vulnerable_postgres_version',
    'DATABASE',
    'WARN',
    'Current Postgres version has security patches available. Upgrade your database to apply important security patches.',
    '1. Go to Dashboard Supabase → Settings → Database
2. Check "Database version" section
3. Click "Upgrade" or "Update" if available
4. Follow on-screen instructions
5. Plan during low-traffic period
6. Backup before upgrade if possible',
    'https://supabase.com/docs/guides/platform/upgrading'
) ON CONFLICT (issue_name) DO UPDATE SET
    detected_at = NOW(),
    resolved_at = NULL,
    resolved_by = NULL;

-- ============================================================================
-- PARTIE 4 : FONCTION DE VÉRIFICATION
-- ============================================================================

-- Fonction pour vérifier l'état des problèmes de sécurité
CREATE OR REPLACE FUNCTION check_security_issues_status()
RETURNS TABLE (
    issue_name TEXT,
    issue_type TEXT,
    severity TEXT,
    status TEXT,
    detected_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sit.issue_name,
        sit.issue_type,
        sit.severity,
        CASE 
            WHEN sit.resolved_at IS NOT NULL THEN 'RESOLVED'
            ELSE 'PENDING'
        END AS status,
        sit.detected_at,
        sit.resolved_at
    FROM security_issues_tracking sit
    WHERE sit.resolved_at IS NULL
    ORDER BY 
        CASE sit.severity 
            WHEN 'CRITICAL' THEN 1
            WHEN 'ERROR' THEN 2
            WHEN 'WARN' THEN 3
            ELSE 4
        END,
        sit.detected_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer un problème comme résolu
CREATE OR REPLACE FUNCTION mark_security_issue_resolved(
    p_issue_name TEXT,
    p_resolved_by TEXT DEFAULT 'admin'
)
RETURNS void AS $$
BEGIN
    UPDATE security_issues_tracking
    SET 
        resolved_at = NOW(),
        resolved_by = p_resolved_by
    WHERE issue_name = p_issue_name
    AND resolved_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Issue % not found or already resolved', p_issue_name;
    END IF;
    
    RAISE NOTICE '✅ Problème de sécurité "%" marqué comme résolu par %', p_issue_name, p_resolved_by;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 5 : AFFICHAGE DU RÉSUMÉ
-- ============================================================================

DO $$
DECLARE
    pending_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pending_count
    FROM security_issues_tracking
    WHERE resolved_at IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'RÉSUMÉ DES PROBLÈMES DE SÉCURITÉ';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Nombre de problèmes en attente : %', pending_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Pour vérifier l''état des problèmes :';
    RAISE NOTICE '    SELECT * FROM check_security_issues_status();';
    RAISE NOTICE '';
    RAISE NOTICE 'Pour marquer un problème comme résolu :';
    RAISE NOTICE '    SELECT mark_security_issue_resolved(''issue_name'', ''votre_nom'');';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
/*
1. PROTECTION CONTRE LES MOTS DE PASSE COMPROMIS
   - Cette fonctionnalité doit être activée via le Dashboard Supabase
   - Elle vérifie les mots de passe contre la base de données HaveIBeenPwned
   - Aucune action SQL n'est possible pour activer cette fonctionnalité
   - Voir INSTRUCTIONS-SECURITE.md pour les instructions détaillées

2. MISE À JOUR DE POSTGRES
   - La mise à jour doit être effectuée via le Dashboard Supabase
   - Les mises à jour peuvent nécessiter un redémarrage de la base de données
   - Planifiez la mise à jour pendant une période de faible trafic
   - Faites une sauvegarde avant la mise à jour si possible
   - Voir INSTRUCTIONS-SECURITE.md pour les instructions détaillées

3. TABLE DE SUIVI
   - La table security_issues_tracking permet de suivre les problèmes
   - Utilisez check_security_issues_status() pour voir les problèmes en attente
   - Utilisez mark_security_issue_resolved() pour marquer un problème comme résolu
   - Cette table est utile pour l'audit et le suivi de conformité

4. VÉRIFICATION RÉGULIÈRE
   - Exécutez cette migration régulièrement pour mettre à jour le suivi
   - Vérifiez l'état des problèmes avec : SELECT * FROM check_security_issues_status();
   - Marquez les problèmes comme résolus après avoir appliqué les correctifs
*/
