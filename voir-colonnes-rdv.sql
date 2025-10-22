-- Voir toutes les colonnes de RDV
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'RDV'
ORDER BY ordinal_position;

