-- Vérifier la structure complète de la table RDV
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'RDV'
ORDER BY ordinal_position;

