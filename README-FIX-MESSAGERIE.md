# 🚨 FIX URGENT - MESSAGERIE

## ❌ **PROBLÈME**
Les apporteurs **NE PEUVENT PAS** envoyer de messages !

```sql
ERROR: new row violates check constraint "messages_sender_type_check"
DETAIL: Failing row contains (..., apporteur, ...)
```

---

## ✅ **SOLUTION EN 3 ÉTAPES**

### 1️⃣ **CORRIGER LA BASE DE DONNÉES (PRIORITÉ ABSOLUE)**

```bash
psql <VOTRE_URL_SUPABASE>
\i fix-contrainte-sender-type.sql
```

**Ce qu'il fait** : Ajoute "apporteur" aux types autorisés pour `sender_type`

**Résultat** :
```sql
-- AVANT
CHECK (sender_type IN ('client', 'expert', 'admin'))

-- APRÈS
CHECK (sender_type IN ('client', 'expert', 'admin', 'apporteur', 'system'))
```

---

### 2️⃣ **DÉPLOYER LE CODE** (déjà fait ✅)

Les fichiers suivants ont été corrigés :
- ✅ `client/src/services/messaging-service.ts`
- ✅ `server/src/routes/unified-messaging.ts`

👉 **Commit + Push** sur Railway

---

### 3️⃣ **TESTER**

```bash
# Test SQL
\i test-envoi-message-simple.sql

# Test interface
# Aller sur https://www.profitum.app/apporteur/messaging
# Envoyer un message
```

---

## 📋 **FICHIERS IMPORTANTS**

| Fichier | Description |
|---------|-------------|
| `fix-contrainte-sender-type.sql` | 🚨 **FIX CRITIQUE** - Exécuter EN PREMIER |
| `diagnostic-contrainte-messages.sql` | Diagnostiquer la contrainte actuelle |
| `test-envoi-message-simple.sql` | Tester l'envoi de message |
| `nettoyage-conversations-doublons.sql` | Supprimer les conversations en double |
| `SOLUTION-FINALE-MESSAGERIE.md` | Documentation complète |

---

## 🎯 **ORDRE D'EXÉCUTION**

```bash
# 1. FIX CRITIQUE (base de données)
\i fix-contrainte-sender-type.sql

# 2. Test d'envoi
\i test-envoi-message-simple.sql

# 3. Nettoyage optionnel (si doublons)
\i nettoyage-conversations-doublons.sql
```

---

## ✅ **RÉSULTAT ATTENDU**

- ✅ Messages des apporteurs s'enregistrent en DB
- ✅ Messages s'affichent dans l'interface
- ✅ Realtime fonctionne (messages apparaissent instantanément)

---

## 🔍 **VÉRIFICATION**

```sql
-- Vérifier que la contrainte permet "apporteur"
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'messages'::regclass
  AND conname = 'messages_sender_type_check';

-- Doit afficher :
-- CHECK ((sender_type IN ('client', 'expert', 'admin', 'apporteur', 'system')))
```

---

**STATUT** : Prêt à corriger ! Exécutez `fix-contrainte-sender-type.sql` immédiatement. 🚀

