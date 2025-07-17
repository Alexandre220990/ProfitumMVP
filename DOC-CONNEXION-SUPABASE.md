# Documentation : Connexion Supabase & Variables d'environnement

## 1. Emplacement du fichier `.env`

- Le fichier `.env` doit être placé **à la racine du projet** :
  
  `/Users/alex/Desktop/FinancialTracker/.env`

## 2. Variables d'environnement requises

Dans ce fichier `.env`, tu dois avoir :

```
SUPABASE_URL="https://<ton-projet>.supabase.co"
SUPABASE_KEY="<clé_anon_publique>"
SUPABASE_SERVICE_ROLE_KEY="<clé_service_role>"
```

- **SUPABASE_URL** : l’URL de ton projet Supabase
- **SUPABASE_KEY** : la clé `anon` (publique, pour lecture simple côté client)
- **SUPABASE_SERVICE_ROLE_KEY** : la clé de service (permissions élevées, pour scripts admin, migration, création d’utilisateurs)

> ⚠️ **Ne jamais exposer la clé de service côté client/front !**

## 3. Chargement des variables dans les scripts Node

Pour garantir que tous tes scripts Node (tests, migration, etc.) utilisent les bonnes variables :

- Ajoute en haut de chaque script :
  ```js
  import 'dotenv/config';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import dotenv from 'dotenv';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '.env') });
  ```
- Utilise ensuite les variables avec `process.env.SUPABASE_URL`, `process.env.SUPABASE_SERVICE_ROLE_KEY`, etc.

## 4. Bonnes pratiques d’utilisation des clés

- **Pour les scripts d’administration, migration, création d’utilisateurs** :
  - Utilise toujours `SUPABASE_SERVICE_ROLE_KEY`.
- **Pour le backend (Node/Express)** :
  - Utilise la clé de service pour toutes les opérations sensibles.
- **Pour le front-end** :
  - Utilise uniquement la clé `SUPABASE_KEY` (jamais la clé de service !)

## 5. Diagnostic rapide en cas d’erreur

- Si tu obtiens `Invalid API key` :
  - Vérifie que le script charge bien le `.env` de la racine.
  - Vérifie que la variable utilisée est bien la clé de service pour les scripts admin.
  - Vérifie que la clé n’est pas expirée ou tronquée.
- Pour diagnostiquer, tu peux utiliser ce mini-script :
  ```js
  import 'dotenv/config';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import dotenv from 'dotenv';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '.env') });
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);
  ```

## 6. Sécurité

- **Ne jamais** commiter le fichier `.env` dans le dépôt git.
- **Ne jamais** exposer la clé de service dans le code front ou dans des assets publics.

---

**En suivant ces règles, tu n’auras plus jamais d’erreur de connexion Supabase liée aux variables d’environnement.** 