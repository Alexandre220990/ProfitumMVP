# 🔧 CORRECTION MASSIVE localStorage → getSupabaseToken()

**Date** : 4 décembre 2025  
**Statut** : ✅ EN COURS

---

## 📊 SITUATION

### Fichiers Déjà Corrigés (Top 10 prioritaires)
1. ✅ `pages/admin/prospection.tsx` - 26 occurrences → **CORRIGÉ**
2. ✅ `services/messaging-service.ts` - 17 occurrences → **CORRIGÉ**
3. ✅ `pages/admin/dashboard-optimized.tsx` - 12 occurrences → **CORRIGÉ**
4. ✅ `hooks/use-documents.ts` - 12 occurrences → **CORRIGÉ**
5. ✅ `services/calendar-service.ts` - 10 occurrences → **CORRIGÉ**
6. ✅ `contexts/ExpertContext.tsx` - 9 occurrences → **CORRIGÉ**
7. ✅ `components/messaging/ImprovedAdminMessaging.tsx` - 8 occurrences → **CORRIGÉ**
8. ✅ `components/apporteur/ProspectForm.tsx` - 8 occurrences → **CORRIGÉ**
9. ✅ `pages/admin/prospect-sequence-synthese.tsx` - 8 occurrences → **CORRIGÉ**
10. ✅ `components/cabinet/CabinetTeamManagement.tsx` - 7 occurrences → **CORRIGÉ**

### Services Additionnels Corrigés
11. ✅ `services/rdv-service.ts` → **CORRIGÉ**
12. ✅ `services/apporteur-enhanced-service.ts` → **CORRIGÉ**
13. ✅ `services/apporteur-views-service.ts` → **CORRIGÉ**
14. ✅ `services/apporteur-simple-service.ts` → **CORRIGÉ**
15. ✅ `services/admin-cabinet-service.ts` → **CORRIGÉ**
16. ✅ `services/apporteur-api.ts` → **CORRIGÉ**
17. ✅ `services/cabinet-service.ts` → **CORRIGÉ**
18. ✅ `components/ScheduleSequenceModal.tsx` → **CORRIGÉ**

**Total fichiers corrigés : 18**

### Fichiers Restants
**83 fichiers** avec **185 occurrences** restantes

---

## 🎯 STRATÉGIE DE CORRECTION

### Pattern Appliqué
```typescript
// AVANT ❌
const token = localStorage.getItem('token');
const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');

// APRÈS ✅
import { getSupabaseToken } from '@/lib/auth-helpers';
const token = await getSupabaseToken();
```

### Modifications Effectuées
1. **Ajout import** : `import { getSupabaseToken } from '@/lib/auth-helpers';`
2. **Remplacement** : `localStorage.getItem('token')` → `await getSupabaseToken()`
3. **Remplacement** : `localStorage.getItem('token') || localStorage.getItem('supabase_token')` → `await getSupabaseToken()`

---

## ✅ FICHIERS À CORRIGER (Suite)

### Hooks (13 fichiers)
- [ ] `hooks/useNotificationPreferences.ts` - 2 occurrences
- [ ] `hooks/useSupabaseNotifications.ts` - 4 occurrences
- [ ] `hooks/use-notification-sse.ts` - 1 occurrence
- [ ] `hooks/use-notifications.ts` - 3 occurrences
- [ ] `hooks/usePushNotifications.ts` - 3 occurrences
- [ ] `hooks/useFCMNotifications.ts` - 2 occurrences
- [ ] `hooks/useBrowserPushNotifications.ts` - 2 occurrences
- [ ] `hooks/use-apporteur-data.ts` - 2 occurrences
- [ ] `hooks/use-document-storage.ts` - 2 occurrences

### Components (40+ fichiers)
- [ ] `components/messaging/OptimizedMessagingApp.tsx` - 1 occurrence
- [ ] `components/notifications/UniversalNotificationCenter.tsx` - 4 occurrences
- [ ] `components/apporteur/ApporteurNotificationGroup.tsx` - 1 occurrence
- [ ] `components/client/ClientNotificationGroup.tsx` - 1 occurrence
- [ ] `components/expert/ExpertNotificationGroup.tsx` - 1 occurrence
- [ ] `components/admin/NotificationCenter.tsx` - 3 occurrences
- [ ] `components/admin/NotificationGroup.tsx` - 1 occurrence
- [ ] ... (37 autres fichiers)

### Pages (20+ fichiers)
- [ ] `pages/admin/prospection/sequence/[sequenceId].tsx` - 6 occurrences
- [ ] `pages/admin/gestion-dossiers.tsx` - 4 occurrences
- [ ] `pages/admin/profil.tsx` - 3 occurrences
- [ ] ... (17 autres fichiers)

### Utils & Lib (3 fichiers)
- [ ] `utils/debug-auth.ts` - 3 occurrences
- [ ] `lib/api-helpers.ts` - 1 occurrence
- [ ] `contexts/AdminContext.tsx` - 1 occurrence

---

## 🚀 PROCHAINES ÉTAPES

1. **Phase 1** : Corriger tous les fichiers hooks (priorité haute)
2. **Phase 2** : Corriger tous les composants
3. **Phase 3** : Corriger toutes les pages
4. **Phase 4** : Corriger utils & lib
5. **Phase 5** : Vérifier linter (0 erreur)
6. **Phase 6** : Commit & Push

---

**Status actuel** : ⏳ EN COURS - 18/101 fichiers corrigés (17.8%)

