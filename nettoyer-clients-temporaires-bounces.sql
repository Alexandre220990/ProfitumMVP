-- =====================================================
-- NETTOYAGE CLIENTS TEMPORAIRES CAUSANT BOUNCES
-- =====================================================

-- 1. IDENTIFIER les clients temporaires avec emails invalides
SELECT 
    id,
    email,
    name,
    type,
    created_at
FROM "Client"
WHERE 
    type = 'temporaire'
    OR email LIKE 'temp_%@profitum.temp'
    OR email LIKE '%@profitum.temp'
ORDER BY created_at DESC
LIMIT 20;

-- 2. COMPTER les clients temporaires
SELECT 
    type,
    COUNT(*) as count
FROM "Client"
WHERE 
    type = 'temporaire'
    OR email LIKE '%@profitum.temp'
GROUP BY type;

-- 3. SUPPRIMER les clients temporaires expirés (avec cascade)
-- ATTENTION: Cela supprimera aussi les simulations et ClientProduitEligible liés
DELETE FROM "Client"
WHERE 
    type = 'temporaire'
    AND expires_at < NOW();

-- 4. SUPPRIMER les clients temporaires de plus de 7 jours
DELETE FROM "Client"
WHERE 
    type = 'temporaire'
    AND created_at < NOW() - INTERVAL '7 days';

-- 5. VÉRIFICATION : Compter ce qui reste
SELECT 
    COUNT(*) as clients_temporaires_restants
FROM "Client"
WHERE type = 'temporaire';

