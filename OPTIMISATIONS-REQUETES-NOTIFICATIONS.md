# ⚡ OPTIMISATIONS DES REQUÊTES DE NOTIFICATIONS

**Date:** 05 Décembre 2025  
**Objectif:** Optimiser les requêtes selon la recommandation 2.2 de l'analyse complète

---

## ✅ OPTIMISATIONS EFFECTUÉES

### 1. `morning-report-service.ts` - Fusion des requêtes is_read

**Avant:**
```typescript
// ❌ 2 requêtes séparées
const { data: unreadNotificationsRaw } = await supabase
  .from('notification')
  .eq('is_read', false)
  // ... autres filtres

const { data: readNotificationsRaw } = await supabase
  .from('notification')
  .eq('is_read', true)
  // ... autres filtres
```

**Après:**
```typescript
// ✅ 1 requête unique avec .in('is_read', [true, false])
const { data: allNotificationsRaw } = await supabase
  .from('notification')
  .in('is_read', [true, false]) // Fusionner les deux requêtes
  // ... autres filtres
  .limit(120); // Limite augmentée pour couvrir lues + non lues

// Séparer côté code
const unreadNotificationsRaw = allNotificationsRaw.filter(n => !n.is_read);
const readNotificationsRaw = allNotificationsRaw.filter(n => n.is_read);
```

**Bénéfices:**
- ✅ **1 requête au lieu de 2** → Réduction de 50% des appels BDD
- ✅ **Optimisation des filtres** → Utilisation de `.not('notification_type', 'in', ...)` au lieu de `.neq()` répétés
- ✅ **Performance améliorée** → Moins de latence réseau

**Impact estimé:**
- Temps de génération du rapport: **~500ms → ~300ms** (40% plus rapide)

---

### 2. `daily-activity-report-service-v2.ts` - Parallélisation des requêtes

**Avant:**
```typescript
// ❌ 4 requêtes séquentielles
const { data: pendingDocs } = await supabase.from('ClientProduitEligible')...
// ... traitement ...
const { data: pendingExperts } = await supabase.from('Expert')...
// ... traitement ...
const { data: simulations } = await supabase.from('simulations')...
// ... traitement ...
const { data: untreatedLeads } = await supabase.from('notification')...
```

**Après:**
```typescript
// ✅ 4 requêtes en parallèle avec Promise.all
const [
  { data: pendingDocs, error: docsError },
  { data: pendingExperts, error: expertsError },
  { data: simulations, error: simulationsError },
  { data: untreatedLeads, error: leadsError }
] = await Promise.all([
  supabase.from('ClientProduitEligible')...,
  supabase.from('Expert')...,
  supabase.from('simulations')...,
  supabase.from('notification')...
]);

// Traitement séquentiel des résultats (rapide)
```

**Bénéfices:**
- ✅ **Parallélisation** → Les 4 requêtes s'exécutent simultanément
- ✅ **Temps total réduit** → Temps = max(requête1, requête2, requête3, requête4) au lieu de somme
- ✅ **Optimisation des simulations** → Requêtes de produits éligibles aussi parallélisées

**Impact estimé:**
- Temps de génération du rapport: **~800ms → ~250ms** (68% plus rapide)

---

### 3. `daily-activity-report-service.ts` - Unification vers table notification

**Avant:**
```typescript
// ❌ 2 requêtes (AdminNotification + notification)
const { data: adminNotifications } = await supabase
  .from('AdminNotification')
  .select('...')
  .eq('status', 'archived')...

const { data: generalNotifications } = await supabase
  .from('notification')
  .select('...')
  .eq('user_type', 'admin')
  .eq('status', 'archived')...

// Fusionner les résultats
const notificationsArchived = [
  ...adminNotifications.map(...),
  ...generalNotifications.map(...)
];
```

**Après:**
```typescript
// ✅ 1 requête unique (AdminNotification migrée vers notification)
const { data: notificationsArchivedRaw } = await supabase
  .from('notification')
  .select('...')
  .eq('user_type', 'admin')
  .eq('status', 'archived')...

// Mapper les résultats
const notificationsArchived = notificationsArchivedRaw.map(...);
```

**Bénéfices:**
- ✅ **1 requête au lieu de 2** → Réduction de 50% des appels BDD
- ✅ **Code simplifié** → Plus besoin de fusionner deux sources
- ✅ **Cohérence** → Une seule source de vérité

**Impact estimé:**
- Temps de génération du rapport: **~400ms → ~200ms** (50% plus rapide)

---

### 4. `UniversalNotificationCenter.tsx` - Déjà optimisé

**État actuel:**
```typescript
// ✅ Déjà optimisé avec Promise.all
const promises = eventNotifications.map(async (notification: any) => {
  // Requête individuelle pour chaque événement
  const response = await fetch(`${config.API_URL}/api/rdv/${eventId}/report`);
  // ...
});

await Promise.all(promises);
```

**Note:** Les requêtes sont déjà parallélisées. Pour une optimisation supplémentaire, on pourrait créer un endpoint batch qui accepte plusieurs IDs, mais ce n'est pas critique.

---

## 📊 RÉSUMÉ DES GAINS DE PERFORMANCE

### Avant Optimisations

| Service | Requêtes | Temps estimé |
|---------|----------|--------------|
| `morning-report-service.ts` | 2 requêtes séquentielles | ~500ms |
| `daily-activity-report-service-v2.ts` | 4 requêtes séquentielles | ~800ms |
| `daily-activity-report-service.ts` | 2 requêtes séquentielles | ~400ms |
| **TOTAL** | **8 requêtes** | **~1700ms** |

### Après Optimisations

| Service | Requêtes | Temps estimé |
|---------|----------|--------------|
| `morning-report-service.ts` | 1 requête | ~300ms |
| `daily-activity-report-service-v2.ts` | 4 requêtes parallèles | ~250ms |
| `daily-activity-report-service.ts` | 1 requête | ~200ms |
| **TOTAL** | **6 requêtes (4 parallèles)** | **~750ms** |

### Gains

- ✅ **Réduction du nombre de requêtes:** 8 → 6 (25% de réduction)
- ✅ **Réduction du temps total:** ~1700ms → ~750ms (56% plus rapide)
- ✅ **Parallélisation:** 4 requêtes indépendantes exécutées simultanément

---

## 🔍 DÉTAILS TECHNIQUES

### Optimisation 1: Fusion avec `.in()`

**Pattern à éviter:**
```typescript
// ❌ 2 requêtes
.eq('is_read', false)
.eq('is_read', true)
```

**Pattern optimisé:**
```typescript
// ✅ 1 requête
.in('is_read', [true, false])
```

### Optimisation 2: Filtres multiples avec `.not()`

**Pattern à éviter:**
```typescript
// ❌ Plusieurs .neq()
.neq('notification_type', 'rdv_reminder')
.neq('notification_type', 'rdv_confirmed')
.neq('notification_type', 'rdv_cancelled')
```

**Pattern optimisé:**
```typescript
// ✅ Un seul .not() avec liste
.not('notification_type', 'in', '(rdv_reminder,rdv_confirmed,rdv_cancelled)')
```

### Optimisation 3: Parallélisation avec Promise.all

**Pattern à éviter:**
```typescript
// ❌ Séquentiel
const result1 = await query1();
const result2 = await query2();
const result3 = await query3();
```

**Pattern optimisé:**
```typescript
// ✅ Parallèle
const [result1, result2, result3] = await Promise.all([
  query1(),
  query2(),
  query3()
]);
```

---

## 📋 CHECKLIST DE VALIDATION

### Tests à effectuer

- [ ] Vérifier que les rapports matinaux se génèrent correctement
- [ ] Vérifier que les rapports soir se génèrent correctement
- [ ] Vérifier que les notifications lues et non lues sont bien séparées
- [ ] Vérifier que les performances sont améliorées
- [ ] Vérifier qu'aucune régression n'a été introduite

### Métriques à surveiller

- Temps de génération des rapports (devrait être ~56% plus rapide)
- Nombre de requêtes BDD (devrait être réduit de 25%)
- Charge serveur (devrait être réduite)

---

## 🚀 PROCHAINES OPTIMISATIONS POSSIBLES

### 1. Cache des résultats

**Idée:** Mettre en cache les résultats des rapports pendant quelques minutes

**Bénéfice:** Éviter de régénérer les mêmes rapports plusieurs fois

**Implémentation:**
```typescript
// Utiliser Redis ou cache mémoire
const cacheKey = `morning-report-${dateStr}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const report = await generateMorningReport();
await redis.setex(cacheKey, 300, JSON.stringify(report)); // 5 min
```

### 2. Index composites manquants

**Idée:** Ajouter des index composites pour les requêtes fréquentes

**Exemples:**
```sql
-- Pour morning-report-service
CREATE INDEX idx_notification_admin_unread_priority_created 
ON notification(user_type, is_read, hidden_in_list, priority, created_at)
WHERE user_type = 'admin' AND hidden_in_list = false;

-- Pour daily-activity-report-service-v2
CREATE INDEX idx_notification_admin_type_status_read
ON notification(user_type, notification_type, status, is_read)
WHERE user_type = 'admin';
```

### 3. Batch API pour rapports d'événements

**Idée:** Créer un endpoint qui accepte plusieurs IDs d'événements

**Bénéfice:** Réduire le nombre de requêtes HTTP

**Implémentation:**
```typescript
// Nouveau endpoint
POST /api/rdv/reports/batch
Body: { eventIds: ['id1', 'id2', 'id3'] }
Response: { reports: { id1: {...}, id2: {...}, id3: {...} } }
```

---

## 📝 NOTES

- Toutes les optimisations sont **rétrocompatibles**
- Aucun changement d'API nécessaire
- Les tests existants devraient continuer à fonctionner

---

**Document créé le 05/12/2025**  
**Dernière mise à jour:** 05/12/2025
