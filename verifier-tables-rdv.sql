-- Vérifier quelles tables RDV existent
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = t.table_name) as nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name LIKE '%RDV%'
ORDER BY table_name;

