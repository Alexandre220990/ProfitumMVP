-- =====================================================
-- CONVERSION SIMPLE : revenuAnnuel TEXT → NUMERIC
-- =====================================================
-- Toutes les données sont NULL donc conversion sans risque
-- =====================================================

-- 1️⃣ Voir la structure actuelle
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Client'
AND column_name = 'revenuAnnuel';

-- 2️⃣ Conversion directe (toutes les valeurs sont NULL)
ALTER TABLE "Client" 
ALTER COLUMN "revenuAnnuel" TYPE NUMERIC 
USING "revenuAnnuel"::NUMERIC;

-- 3️⃣ Ajouter un commentaire
COMMENT ON COLUMN "Client"."revenuAnnuel" IS 'Chiffre d''affaires annuel exact en euros (ex: 250000)';

-- 4️⃣ Vérification finale
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Client'
AND column_name IN ('nombreEmployes', 'revenuAnnuel', 'secteurActivite')
ORDER BY column_name;

-- =====================================================
-- RÉSULTAT ATTENDU :
-- =====================================================
-- nombreEmployes  | integer | YES (ex: 25)
-- revenuAnnuel    | numeric | YES (ex: 250000)
-- secteurActivite | text    | YES (ex: "Transport et Logistique")
-- =====================================================

