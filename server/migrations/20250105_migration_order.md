# Ordre d'exécution des migrations

## 1. Vérifier les tables existantes
```sql
-- Exécuter d'abord ce script pour voir ce qui existe
\i server/migrations/20250105_check_existing_tables.sql
```

## 2. Créer les tables de base
```sql
-- Créer les tables fondamentales (Client, Expert, Admin, etc.)
\i server/migrations/20250105_create_base_tables.sql
```

## 3. Créer les tables manquantes
```sql
-- Créer les tables utilitaires (sessions, transactions, etc.)
\i server/migrations/20250105_create_missing_tables.sql
```

## 4. Ajouter les contraintes de clés étrangères
```sql
-- Une fois toutes les tables créées, ajouter les références
\i server/migrations/20250105_add_foreign_keys.sql
```

## Ordre d'exécution dans Supabase :

1. **Copier et exécuter** `20250105_check_existing_tables.sql`
2. **Copier et exécuter** `20250105_create_base_tables.sql`
3. **Copier et exécuter** `20250105_create_missing_tables.sql`
4. **Vérifier** que toutes les tables sont créées
5. **Tester** la création d'événements

## Tables créées :

### Tables de base :
- `Client` - Clients de l'application
- `Expert` - Experts consultants
- `Admin` - Administrateurs
- `ProduitEligible` - Produits financiers
- `ClientProduitEligible` - Liaison client-produit

### Tables utilitaires :
- `user_sessions` - Sessions utilisateurs
- `transactions` - Transactions financières
- `simulations` - Simulations d'éligibilité
- `SimulationProcessed` - Simulations traitées
- `CalendarEvent` - Événements du calendrier (déjà existante)

## Vérification :

Après exécution, vérifier que toutes les tables existent :
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
``` 