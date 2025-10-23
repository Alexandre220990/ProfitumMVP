-- Vérifier la structure de la table ApporteurAffaires
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ApporteurAffaires'
ORDER BY ordinal_position;

