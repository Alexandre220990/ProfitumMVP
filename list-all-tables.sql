-- Lister toutes les tables de la base de données
SELECT 
  table_name,
  (xpath('/row/c/text()', query_to_xml(format('SELECT COUNT(*) as c FROM %I', table_name), false, true, '')))[1]::text::int AS row_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Rechercher spécifiquement les tables avec "regle" ou "eligib" dans le nom
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (LOWER(table_name) LIKE '%regle%' OR LOWER(table_name) LIKE '%eligib%' OR LOWER(table_name) LIKE '%rule%')
ORDER BY table_name;

