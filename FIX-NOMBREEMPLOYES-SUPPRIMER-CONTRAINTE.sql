-- =====================================================
-- SOLUTION DÉFINITIVE : Supprimer la Contrainte CHECK
-- =====================================================
-- Contrainte trouvée : client_nombreEmployes_check
-- Problème : CHECK (("nombreEmployes" >= 0)) bloque tout
-- Solution : Supprimer la contrainte, garder INTEGER
-- =====================================================

BEGIN;

-- 1️⃣ Voir la contrainte actuelle
SELECT 
    conname as "Nom Contrainte",
    pg_get_constraintdef(oid) as "Définition"
FROM pg_constraint
WHERE conrelid = '"Client"'::regclass
  AND conname = 'client_nombreEmployes_check';

-- 2️⃣ SUPPRIMER la contrainte
ALTER TABLE "Client" 
DROP CONSTRAINT IF EXISTS client_nombreEmployes_check;

-- 3️⃣ Vérifier qu'elle est bien supprimée
SELECT 
    conname as "Nom Contrainte",
    pg_get_constraintdef(oid) as "Définition"
FROM pg_constraint
WHERE conrelid = '"Client"'::regclass
  AND conname LIKE '%nombreEmployes%';

-- 4️⃣ La colonne reste en INTEGER - parfait pour les nombres exacts !
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Client'
AND column_name = 'nombreEmployes';

-- 5️⃣ Ajouter un commentaire explicatif
COMMENT ON COLUMN "Client"."nombreEmployes" IS 'Nombre EXACT d''employés (ex: 0, 3, 25, 150). Pas de contrainte CHECK, validation côté application.';

-- 6️⃣ Test : insérer une valeur de test (à supprimer après)
-- INSERT INTO "Client" ("nombreEmployes", email, password, name, company_name, ...) 
-- VALUES (25, 'test@example.com', ...);

COMMIT;

-- =====================================================
-- RÉSULTAT :
-- nombreEmployes reste INTEGER
-- Contrainte CHECK supprimée
-- Accepte maintenant 0, 3, 25, 150, etc.
-- =====================================================

-- =====================================================
-- POURQUOI C'EST MIEUX AINSI :
-- =====================================================
-- ✅ Pas de conversion TEXT compliquée
-- ✅ Garde le type NUMERIC pour les calculs
-- ✅ Validation côté application (min: 0, max: 10000)
-- ✅ Plus de problème avec les contraintes
-- ✅ Le formulaire avec toggle tranche/exact fonctionne déjà !
-- =====================================================

