# 🧪 GUIDE DE TESTS - Système Notifications avec Archivage

**Date:** 27 Octobre 2025  
**Phase:** PHASE 1 & 2 - Archivage + Realtime Admin  
**Status:** ✅ Prêt pour tests

---

## 🎯 OBJECTIFS DES TESTS

Valider le bon fonctionnement du système de notifications avec :
1. ✅ Statuts uniformisés (unread/read/archived)
2. ✅ Archivage/Restauration des notifications
3. ✅ Realtime pour tous les utilisateurs (dont admins)
4. ✅ UI avec onglets et boutons corrects

---

## 📋 CHECKLIST COMPLÈTE

### Backend ✅

- [x] Migration SQL statuts appliquée
- [x] Routes archive/unarchive créées
- [x] Route mark-all-read créée  
- [x] Route delete-all-read créée
- [x] Filtre `?status=archived` fonctionnel
- [x] Logs serveur activés

### Frontend ✅

- [x] Hook useSupabaseNotifications mis à jour
- [x] Service subscribeAdmin créé
- [x] UnifiedNotificationCenter avec onglet Archivées
- [x] Boutons Archiver/Restaurer ajoutés
- [x] Filtres Toutes/Non lues/Archivées
- [x] Realtime INSERT/UPDATE/DELETE

---

## 🔬 TESTS À EFFECTUER

### TEST 1: Archivage Simple (5 min)

#### En tant que CLIENT

1. **Connexion**
   ```
   Email: grandjean.laporte@gmail.com
   Mot de passe: [votre mot de passe]
   ```

2. **Ouvrir notifications**
   - Cliquer sur l'icône 🔔 Bell
   - Vérifier que le centre de notifications s'affiche

3. **Tester archivage**
   - Trouver une notification non lue
   - Cliquer sur le bouton `📦 Archive` (orange)
   - ✅ **Attendu:** Notification disparaît de l'onglet "Toutes"

4. **Voir les archivées**
   - Cliquer sur onglet "📦 Archivées"
   - ✅ **Attendu:** Notification archivée apparaît
   - Badge affiche le nombre correct

5. **Restaurer**
   - Cliquer sur bouton `↺ Restaurer` (vert)
   - Retourner sur onglet "Toutes"
   - ✅ **Attendu:** Notification réapparaît

### TEST 2: Filtres et Statuts (5 min)

#### Vérifier les compteurs

1. **Onglet "Toutes"**
   - Badge affiche: `notifications totales - archivées`
   - ✅ Exclut bien les archivées

2. **Onglet "Non lues"**
   - Badge bleu affiche: nombre de notifications unread
   - Liste affiche UNIQUEMENT les non lues

3. **Onglet "Archivées"**
   - Badge affiche: nombre archivées
   - Liste affiche UNIQUEMENT les archivées

#### Marquer comme lu

1. **Notification non lue** (point bleu visible)
   - Cliquer sur bouton `✓` Check
   - ✅ **Attendu:** Point bleu disparaît
   - Badge "Non lues" décrémente de 1

2. **Vérifier BDD** (optionnel)
   ```sql
   SELECT id, title, status, is_read, archived_at 
   FROM notification 
   WHERE user_id = '[votre_user_id]' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
   - Status devrait être 'read'
   - is_read devrait être true

### TEST 3: Realtime (10 min)

#### Setup

1. **Ouvrir 2 onglets** du même navigateur
   - Onglet A: Connexion client
   - Onglet B: Connexion client (même compte)
   - Les deux ont le centre notifications ouvert

#### Test INSERT (nouvelle notification)

**Option 1: Via backend manuellement**
```bash
# Dans Supabase SQL Editor ou pgAdmin
INSERT INTO notification (user_id, user_type, title, message, notification_type, priority, status)
VALUES 
  ('[user_id_client]', 'client', 'Test Realtime', 'Cette notification devrait apparaître instantanément', 'system', 'normal', 'unread');
```

**✅ Attendu dans les 2 onglets:**
- Nouvelle notification apparaît en haut de liste
- Badge "Toutes" s'incrémente
- Badge "Non lues" s'incrémente
- Point bleu visible

#### Test UPDATE (marquer comme lu)

1. **Dans Onglet A:**
   - Marquer une notification comme lue

2. **✅ Attendu dans Onglet B:**
   - Point bleu disparaît automatiquement
   - Badge "Non lues" décrémente
   - Notification reste dans liste

#### Test ARCHIVE

1. **Dans Onglet A:**
   - Archiver une notification

2. **✅ Attendu dans Onglet B:**
   - Notification disparaît de "Toutes"
   - Badge "Archivées" s'incrémente
   - Si on va sur onglet "Archivées", elle y apparaît

#### Test DELETE

1. **Dans Onglet A:**
   - Supprimer une notification (poubelle rouge)

2. **✅ Attendu dans Onglet B:**
   - Notification disparaît complètement
   - Badges mis à jour

### TEST 4: Realtime Admin (10 min)

#### En tant qu'ADMIN

1. **Connexion admin**
   ```
   Email: [votre_email_admin]
   Password: [votre_mot_de_passe]
   ```

2. **Ouvrir console navigateur**
   - F12 → Console
   - Chercher: `"🔔 Activation realtime admin sur AdminNotification"`
   - Chercher: `"✅ Souscription realtime ADMIN activée"`
   - ✅ **Attendu:** Ces logs apparaissent

3. **Créer notification admin**
   ```sql
   INSERT INTO "AdminNotification" (type, title, message, status, priority)
   VALUES ('test', 'Test Realtime Admin', 'Notification de test en temps réel', 'pending', 'high');
   ```

4. **✅ Attendu:**
   - Notification apparaît immédiatement dans centre admin
   - Log console: `"🔔 Admin realtime event: INSERT"`
   - Badge notifications s'incrémente

5. **Modifier la notification**
   ```sql
   UPDATE "AdminNotification" 
   SET status = 'read' 
   WHERE title = 'Test Realtime Admin';
   ```

6. **✅ Attendu:**
   - Notification passe automatiquement à "read"
   - Log console: `"🔔 Admin realtime event: UPDATE"`
   - Badge "Non lues" décrémente

### TEST 5: Actions en masse (5 min)

#### Marquer toutes comme lues

1. **Avoir plusieurs notifications non lues**

2. **Cliquer "Tout marquer comme lu"**

3. **Vérifier endpoint**
   - Ouvrir Network tab (F12)
   - Chercher: `PUT /api/notifications/mark-all-read`
   - ✅ Status: 200
   - ✅ Response: `{ count: X }`

4. **✅ Attendu UI:**
   - Tous les points bleus disparaissent
   - Badge "Non lues" = 0
   - Toutes les notifications sont en "read"

#### Supprimer toutes lues

1. **Avoir plusieurs notifications lues**

2. **Cliquer "Supprimer tout lu"**

3. **Vérifier endpoint**
   - Network tab: `DELETE /api/notifications/delete-all-read`
   - ✅ Status: 200

4. **✅ Attendu:**
   - Notifications lues disparaissent
   - Notifications non lues restent
   - Notifications archivées ne sont PAS supprimées

### TEST 6: Persistance (3 min)

1. **Archiver 2-3 notifications**

2. **Fermer complètement le navigateur**

3. **Rouvrir et se reconnecter**

4. **Aller sur onglet "Archivées"**

5. **✅ Attendu:**
   - Les notifications archivées sont toujours là
   - Badge affiche le bon nombre
   - Possibilité de restaurer

---

## 📊 CRITÈRES DE SUCCÈS

### Fonctionnel ✅

| Critère | Objectif |
|---------|----------|
| Archivage instantané | < 500ms |
| Realtime latency | < 1s |
| UI réactive | Aucun freeze |
| Badges corrects | 100% précis |
| Restauration fonctionne | 100% |

### Technique ✅

| Critère | Status |
|---------|--------|
| Aucune erreur console | ✅ |
| Aucune erreur 500 | ✅ |
| SQL transactions OK | ✅ |
| Realtime subscribe OK | ✅ |
| Cleanup mémoire OK | ✅ |

---

## 🐛 BUGS POTENTIELS À SURVEILLER

### Frontend

- [ ] Notification apparaît en double après realtime INSERT
- [ ] Badge ne se met pas à jour après action
- [ ] Filtre "Toutes" affiche les archivées
- [ ] Point bleu reste après "marquer lu"
- [ ] Bouton Archiver/Restaurer inversés

### Backend

- [ ] Route archive retourne 500
- [ ] Filtre `?status=archived` ne fonctionne pas
- [ ] COUNT notifications incorrect
- [ ] Transaction SQL timeout
- [ ] Realtime ne trigger pas

### Realtime

- [ ] Subscription admin ne s'active pas
- [ ] Events INSERT ne sont pas reçus
- [ ] Déconnexion Supabase après 10 min
- [ ] Plusieurs channels en conflit
- [ ] Memory leak (channel non unsubscribe)

---

## 🔍 LOGS À VÉRIFIER

### Console Frontend

```
✅ Souscription realtime activée pour user [id]
✅ Souscription realtime ADMIN activée sur AdminNotification
✅ Nouvelle notification admin reçue: [object]
✅ Notification admin mise à jour: [object]
✅ Notification archivée
✅ Notification restaurée
```

### Console Backend

```
🔍 Récupération notifications pour utilisateur: [id] (client/admin/expert)
📊 Requête notifications: page=1, limit=20, offset=0
✅ X notifications récupérées
✅ Notification [id] archivée pour user [userId]
✅ Notification [id] restaurée pour user [userId]
✅ X notifications marquées comme lues pour user [userId]
```

### Base de données

```sql
-- Vérifier statuts uniformes
SELECT status, COUNT(*) 
FROM notification 
GROUP BY status;

-- Résultat attendu:
-- unread | 15
-- read   | 45
-- archived | 8

-- Vérifier AdminNotification
SELECT status, COUNT(*) 
FROM "AdminNotification" 
GROUP BY status;
```

---

## ⚡ TESTS DE PERFORMANCE

### Load Test (optionnel)

```bash
# Créer 100 notifications d'un coup
for i in {1..100}; do
  curl -X POST https://profitummvp-production.up.railway.app/api/notifications \
    -H "Authorization: Bearer [TOKEN]" \
    -H "Content-Type: application/json" \
    -d "{
      \"user_id\": \"[USER_ID]\",
      \"user_type\": \"client\",
      \"type\": \"test\",
      \"message\": \"Notification $i\"
    }"
done
```

**✅ Attendu:**
- Toutes les 100 notifications créées
- UI reste fluide
- Realtime fonctionne pour toutes
- Pagination correcte

### Stress Test Realtime

1. **Ouvrir 5 onglets** (même user)
2. **Archiver 20 notifications rapidement**
3. **✅ Attendu:**
   - Les 5 onglets se synchronisent
   - Aucun décalage > 2s
   - Pas de doublons

---

## 📝 RAPPORT DE BUGS

Si vous trouvez un bug, notez :

```markdown
### Bug #X: [Titre court]

**Environnement:**
- Navigateur: Chrome 120
- Rôle: Client
- URL: /notifications

**Étapes pour reproduire:**
1. Ouvrir centre notifications
2. Cliquer sur "Archiver"
3. [...]

**Résultat actuel:**
[Ce qui se passe]

**Résultat attendu:**
[Ce qui devrait se passer]

**Logs console:**
```
[Copier les logs]
```

**Screenshots:**
[Ajouter si pertinent]
```

---

## ✅ VALIDATION FINALE

Une fois tous les tests passés :

- [ ] Tous les filtres fonctionnent
- [ ] Archivage instantané
- [ ] Restauration instantanée  
- [ ] Realtime CLIENT fonctionne
- [ ] Realtime EXPERT fonctionne
- [ ] Realtime ADMIN fonctionne
- [ ] Badges toujours corrects
- [ ] Aucune erreur console
- [ ] Aucune erreur backend
- [ ] Performance < 500ms
- [ ] Persistance après refresh

**Si tous validés → ✅ PHASE 1 & 2 TERMINÉES !**

**Prochaine étape:** PHASE 3 - Notifications métier manquantes

---

## 🚀 COMMANDES UTILES

### Vérifier Supabase Realtime

```javascript
// Dans console navigateur
supabase.getChannels()
// Devrait montrer: realtime-notifications ou realtime-admin-notifications
```

### Forcer reload notifications

```javascript
// Dans console
window.location.reload()
```

### Clear localStorage (si problème auth)

```javascript
localStorage.clear()
```

---

**Bonne chance pour les tests ! 🎯**

*Document généré le 27 Octobre 2025*

