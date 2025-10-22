# 🔄 Migration Code : CalendarEvent → RDV

Date : 22 octobre 2025

## 📋 Fichiers à modifier (6 backend)

### 1. `server/src/routes/calendar.ts` (11 occurrences)
**Actions** :
- Remplacer tous les `.from('CalendarEvent')` par `.from('RDV')`
- Adapter les champs : `start_date/end_date` → `scheduled_date/scheduled_time`
- Remplacer `CalendarEventParticipant` par `RDV_Participants`

### 2. `server/src/routes/collaborative-events.ts` (1 occurrence)
**Actions** :
- Remplacer `.from('CalendarEvent')` par `.from('RDV')`
- Adapter les requêtes de sélection

### 3. `server/src/services/calendar-reminder-service.ts` (2 occurrences)
**Actions** :
- Remplacer `.from('CalendarEvent')` par `.from('RDV')`
- Remplacer `CalendarEventReminder` par `RDV_Reminders`

### 4. `server/src/services/collaborative-events-service.ts` (9 occurrences)
**Actions** :
- Remplacer tous les `.from('CalendarEvent')` par `.from('RDV')`
- Adapter les champs date/heure
- Remplacer participants

### 5. `server/src/routes/google-calendar.ts` (2 occurrences)
**Actions** :
- Remplacer `.from('CalendarEvent')` par `.from('RDV')`
- Adapter le mapping Google Calendar
- Créer nouvelle table `Google_RDV_Mapping` si nécessaire

### 6. `server/src/services/intelligent-sync-service.ts` (4 occurrences)
**Actions** :
- Remplacer `.from('CalendarEvent')` par `.from('RDV')`
- Adapter la synchronisation intelligente

---

## 🔄 Remplacements à faire

### Noms de tables
```typescript
// AVANT
.from('CalendarEvent')
.from('CalendarEventParticipant')
.from('CalendarEventReminder')
.from('EventInvitation')

// APRÈS
.from('RDV')
.from('RDV_Participants')
.from('RDV_Reminders')
.from('RDV_Invitations')
```

### Champs date/heure
```typescript
// AVANT
start_date: timestamp with time zone
end_date: timestamp with time zone

// APRÈS
scheduled_date: date
scheduled_time: time
duration_minutes: integer
```

### Champs priorité
```typescript
// AVANT
priority: 'low' | 'medium' | 'high' | 'critical' (string)

// APRÈS
priority: 1 | 2 | 3 | 4 (integer)
```

### Champs statut
```typescript
// Les deux systèmes utilisent les mêmes statuts ✅
status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
```

---

## 🚀 Script de recherche/remplacement

```bash
# Dans /server/src
find . -name "*.ts" -exec sed -i '' "s/.from('CalendarEvent')/.from('RDV')/g" {} \;
find . -name "*.ts" -exec sed -i '' "s/.from(\"CalendarEvent\")/.from(\"RDV\")/g" {} \;
find . -name "*.ts" -exec sed -i '' "s/CalendarEventParticipant/RDV_Participants/g" {} \;
find . -name "*.ts" -exec sed -i '' "s/CalendarEventReminder/RDV_Reminders/g" {} \;
find . -name "*.ts" -exec sed -i '' "s/EventInvitation/RDV_Invitations/g" {} \;
```

⚠️ **Après le remplacement automatique, VÉRIFIER manuellement les 6 fichiers** !

---

## 📊 Checklist de migration

### Backend
- [ ] `server/src/routes/calendar.ts` modifié et testé
- [ ] `server/src/routes/collaborative-events.ts` modifié et testé
- [ ] `server/src/services/calendar-reminder-service.ts` modifié et testé
- [ ] `server/src/services/collaborative-events-service.ts` modifié et testé
- [ ] `server/src/routes/google-calendar.ts` modifié et testé
- [ ] `server/src/services/intelligent-sync-service.ts` modifié et testé

### Frontend (11 fichiers)
- [ ] `client/src/services/messaging-service.ts`
- [ ] `client/src/hooks/use-messaging.ts`
- [ ] `client/src/services/calendar-service.ts`
- [ ] `client/src/hooks/use-rdv.ts`
- [ ] `client/src/services/rdv-service.ts`
- [ ] `client/src/components/client/ClientRDVValidationCard.tsx`
- [ ] `client/src/hooks/use-calendar-events.ts`
- [ ] `client/src/hooks/use-google-calendar.ts`
- [ ] `client/src/components/UnifiedCalendar.tsx`
- [ ] `client/src/components/ui/calendar.tsx`
- [ ] `client/src/types/messaging.ts`

### Tests
- [ ] Créer un RDV
- [ ] Lister les RDV
- [ ] Modifier un RDV
- [ ] Supprimer un RDV
- [ ] Ajouter des participants
- [ ] Créer des rappels
- [ ] Sync Google Calendar

---

## 💡 Utilisation du RDVService

Au lieu de faire des requêtes directes, **utiliser le RDVService** déjà créé :

```typescript
import { RDVService } from '../services/RDVService';

// Créer un RDV
const rdv = await RDVService.createRDV({
  client_id: 'uuid',
  expert_id: 'uuid',
  meeting_type: 'video',
  scheduled_date: '2025-10-25',
  scheduled_time: '14:00',
  // ...
});

// Récupérer les RDV d'un client
const rdvs = await RDVService.getRDVByClient('client-uuid');

// Mettre à jour le statut
await RDVService.updateRDVStatus('rdv-uuid', 'confirmed');
```

---

## 🎯 Ordre recommandé

1. **SQL** : Exécuter `migrate-calendarevent-to-rdv.sql` (avec COMMIT)
2. **Backend** : Modifier les 6 fichiers listés
3. **Frontend** : Adapter les services et composants
4. **Tests** : Valider chaque fonctionnalité
5. **Commit** : Git commit avec message détaillé

---

## ⚡ Migration rapide (si pressé)

Tu peux aussi :
1. Exécuter le script SQL
2. Laisser le code tel quel temporairement
3. **Créer une VIEW** SQL pour compatibilité :

```sql
-- Vue de compatibilité temporaire
CREATE OR REPLACE VIEW "CalendarEvent" AS
SELECT 
    id,
    title,
    description,
    scheduled_date || 'T' || scheduled_time as start_date,
    (scheduled_date || 'T' || scheduled_time)::timestamp + (duration_minutes || ' minutes')::interval as end_date,
    client_id,
    expert_id,
    location,
    meeting_type = 'video' as is_online,
    meeting_url,
    phone_number,
    color,
    status,
    type,
    CASE priority
        WHEN 4 THEN 'critical'
        WHEN 3 THEN 'high'
        WHEN 2 THEN 'medium'
        ELSE 'low'
    END as priority,
    category,
    created_by,
    created_at,
    updated_at,
    metadata
FROM "RDV";
```

Ça permet au code existant de continuer à fonctionner pendant la migration progressive !

---

## ✅ Résumé

**Avant migration** :
- 1 table CalendarEvent (générique)
- 1 table RDV (métier)
- Code dupliqué

**Après migration** :
- 1 seul système RDV (unifié)
- Code simplifié
- Plus maintenable

🎉 **Système d'agenda simple et fonctionnel !**

