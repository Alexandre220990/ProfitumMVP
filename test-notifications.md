# 🧪 GUIDE DE TEST - ARCHITECTURE NOTIFICATIONS

## ✅ **VÉRIFICATIONS COMPLETES**

### 1. **Base de Données**
- [ ] Table `Notification` existe avec la bonne structure
- [ ] RLS activé avec politiques correctes
- [ ] Realtime activé sur la table
- [ ] Index créés pour les performances

### 2. **API Endpoints**
- [ ] `/api/notifications` (clients) → Table `Notification`
- [ ] `/api/expert/notifications` (experts) → Table `Notification`
- [ ] `/api/admin/notifications` (admins) → Table `Notification`

### 3. **Frontend**
- [ ] `UnifiedNotificationCenter.tsx` utilise le hook factorisé
- [ ] `useSupabaseNotifications.ts` gère les rôles dynamiquement
- [ ] `supabase-notification-service.ts` souscrit correctement
- [ ] Headers (Client/Expert/Admin) intègrent le composant

### 4. **Cohérence des Données**
- [ ] Type `Notification` cohérent avec la BDD
- [ ] `user_id` (pas `recipient_id`)
- [ ] `is_read` (pas `read`)
- [ ] `notification_type` (pas `type`)
- [ ] `user_type` pour le filtrage

### 5. **Realtime**
- [ ] Souscription automatique au login
- [ ] Désabonnement au logout
- [ ] Mise à jour en temps réel (INSERT/UPDATE/DELETE)
- [ ] Filtrage par `user_id`

## 🔧 **TESTS À EFFECTUER**

### Test 1 : Création de notification
```sql
INSERT INTO "Notification" (user_id, user_type, title, message, notification_type, priority)
VALUES ('user-uuid', 'client', 'Test', 'Message test', 'system', 'normal');
```

### Test 2 : Vérification Realtime
- Ouvrir la console navigateur
- Vérifier les logs de souscription
- Créer une notification en BDD
- Vérifier qu'elle apparaît instantanément

### Test 3 : Test par rôle
- Se connecter en tant que client → Voir notifications client
- Se connecter en tant qu'expert → Voir notifications expert  
- Se connecter en tant qu'admin → Voir toutes les notifications

### Test 4 : Actions
- Marquer comme lu → Mise à jour instantanée
- Supprimer → Disparition instantanée
- Actions en lot → Fonctionnement correct

## 🚨 **POINTS DE VIGILANCE**

1. **Sécurité** : RLS empêche les fuites entre utilisateurs
2. **Performance** : Index sur `user_id`, `created_at`
3. **UX** : Loading states, error handling
4. **Maintenance** : Architecture DRY et factorisée

## 📊 **MÉTRIQUES DE SUCCÈS**

- ✅ Aucune erreur console
- ✅ Notifications temps réel
- ✅ Filtrage par rôle fonctionnel
- ✅ Actions instantanées
- ✅ Performance < 100ms
- ✅ Sécurité garantie 