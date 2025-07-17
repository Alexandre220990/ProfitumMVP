# 📋 Référence Table Client - Profitum

## 🎯 Objectif
Ce document définit la structure exacte de la table `Client` pour éviter les erreurs de colonnes manquantes lors des insertions.

## 🏗️ Structure de la Table Client

### Colonnes Obligatoires (NOT NULL)
```sql
- id (UUID, PRIMARY KEY)
- email (VARCHAR)
- password (VARCHAR)
- name (VARCHAR)
- company_name (VARCHAR)
- phone_number (VARCHAR)
- address (VARCHAR)
- city (VARCHAR)
- postal_code (VARCHAR)
- siren (VARCHAR)
- type (VARCHAR)
- statut (VARCHAR)
- derniereConnexion (TIMESTAMP)
- dateCreation (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

### Colonnes Optionnelles (NULL)
```sql
- revenuAnnuel (DECIMAL)
- secteurActivite (VARCHAR)
- nombreEmployes (INTEGER)
- ancienneteEntreprise (INTEGER)
- typeProjet (VARCHAR)
- dateSimulation (TIMESTAMP)
- simulationId (BIGINT)
- chiffreAffaires (DECIMAL)
- metadata (JSONB)
- notes (TEXT)
- admin_notes (TEXT)
- last_admin_contact (TIMESTAMP)
- created_by_admin (BOOLEAN)
```

## ✅ Template d'Insertion Correct

```typescript
const clientInsertData = {
  // Colonnes obligatoires
  auth_id: authUserId,
  email: clientData.email,
  password: hashedPassword,
  name: clientData.username,
  company_name: clientData.company_name,
  phone_number: clientData.phone_number,
  address: clientData.address,
  city: clientData.city,
  postal_code: clientData.postal_code,
  siren: clientData.siren,
  type: 'client',
  statut: 'actif',
  derniereConnexion: new Date().toISOString(),
  dateCreation: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  
  // Colonnes optionnelles (peuvent être null)
  revenuAnnuel: clientData.revenuAnnuel || null,
  secteurActivite: clientData.secteurActivite || null,
  nombreEmployes: clientData.nombreEmployes || null,
  ancienneteEntreprise: clientData.ancienneteEntreprise || null,
  typeProjet: clientData.typeProjet || null,
  dateSimulation: clientData.dateSimulation || null,
  simulationId: clientData.simulationId || null,
  chiffreAffaires: clientData.chiffreAffaires || null,
  metadata: {
    source: 'migration',
    migration_date: new Date().toISOString()
  }
};
```

## ❌ Colonnes à NE PAS Insérer

Ces colonnes n'existent PAS dans la table Client :
- `besoinFinancement`
- `preferences`
- `last_login`
- `description`
- `status` (utiliser `statut` à la place)
- `company` (utiliser `company_name` à la place)

## 🔧 Utilisation dans le Code

### Service de Migration
```typescript
// ✅ CORRECT - Utiliser seulement les colonnes existantes
const { data: clientDataResult, error: clientError } = await supabase
  .from('Client')
  .insert(clientInsertData) // Seulement les colonnes définies ci-dessus
  .select('id')
  .single();
```

### Validation des Données
```typescript
// ✅ CORRECT - Valider les données avant insertion
const validateClientData = (data: any) => {
  const requiredFields = [
    'email', 'password', 'username', 'company_name', 
    'phone_number', 'address', 'city', 'postal_code', 'siren'
  ];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Champ requis manquant: ${field}`);
    }
  }
  
  return true;
};
```

## 🚨 Erreurs Courantes

### Erreur PGRST204
```
"Could not find the 'column_name' column of 'Client' in the schema cache"
```
**Solution :** Vérifier que la colonne existe dans la liste ci-dessus.

### Erreur 23502
```
"null value in column 'column_name' of relation 'Client' violates not-null constraint"
```
**Solution :** S'assurer que toutes les colonnes obligatoires sont fournies.

## 📝 Notes Importantes

1. **Toujours utiliser `auth_id`** pour lier le client à l'utilisateur Supabase Auth
2. **Toujours hasher le mot de passe** avec bcrypt avant insertion
3. **Toujours fournir `updated_at`** lors de l'insertion
4. **Utiliser `statut` et non `status`** pour le statut du client
5. **Utiliser `company_name` et non `company`** pour le nom de l'entreprise

## 🔄 Mise à Jour

Si la structure de la table change, mettre à jour ce document et tous les services qui utilisent la table Client. 