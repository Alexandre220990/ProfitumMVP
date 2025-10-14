# 📝 TODO: Corriger affichage conversations messagerie client

## 🔴 Problème actuel

**Symptôme** :
- Client clique "Contacter Admin"
- Popup se ferme
- Logs montrent conversation créée
- **MAIS** : Aucune conversation ne s'affiche dans la liste

**Endpoint fonctionnel** :
- `GET /api/unified-messaging/contacts` → 304 (cache)
- Pas d'erreur 500

## 🔍 Analyse nécessaire

### 1. Vérifier le hook useMessaging
- Fichier : `client/src/hooks/use-messaging.ts`
- Chercher : `useQuery` avec `queryKey: ['conversations', ...]`
- Vérifier : Comment les conversations sont chargées depuis l'API

### 2. Vérifier l'endpoint API
- Endpoint : `/api/unified-messaging/conversations`
- Vérifier : Est-ce qu'il retourne les conversations pour le client connecté?
- Logs Railway : Voir la requête et la réponse

### 3. Vérifier la table conversations
- Script SQL : Vérifier les colonnes utilisées pour filtrer par client
- Foreign keys : `client_id`, `expert_id`, `admin_id` ?

## 🛠️ Actions à prendre

1. **Script SQL** : Analyser la structure de la table `conversations`
```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'conversations'
ORDER BY ordinal_position;
```

2. **Vérifier endpoint backend** : `/api/unified-messaging/conversations`
   - Chercher dans `server/src/routes/`
   - Vérifier le filtre utilisé (client_id? user_id?)

3. **Vérifier le filtre frontend** : 
   - Hook `useMessaging`
   - S'assure que `user.database_id` est bien passé

## 💡 Solution probable

Le problème est probablement que :
- L'endpoint filtre les conversations par `auth_user_id` (Supabase Auth ID)
- Mais les clients utilisent JWT personnalisé avec `database_id`
- Il faut filtrer par `client_id = database_id` au lieu de `auth_user_id`

---

## ✅ Corrections déjà effectuées (à commit)

1. ✅ Navigation client avec bouton "Simulation"
2. ✅ Syntaxe JOINs Supabase : `Alias:foreign_key`
3. ✅ Noms produits s'affichent correctement
4. ✅ Messaging service client mode JWT

**À commit et push après résolution messagerie**

