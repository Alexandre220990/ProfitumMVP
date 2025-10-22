# 🚨 ALERTE : Migration Code Calendrier URGENTE

Date : 22 octobre 2025

## ❌ SITUATION ACTUELLE

**La table CalendarEvent a été supprimée mais le code l'utilise encore !**

### Impact

- **47 requêtes SQL** pointent vers une table supprimée
- **L'application va crasher** dès qu'on utilise :
  - Calendrier
  - Événements collaboratifs
  - Rappels automatiques
  - Sync Google Calendar
  - Messagerie (qui affiche le calendrier)

---

## 📊 Fichiers à migrer (20 fichiers)

### 🔴 BACKEND CRITIQUE (6 fichiers, 43 requêtes)

| Fichier | Occurrences | Impact |
|---------|-------------|--------|
| `routes/calendar.ts` | 15 | 🔴 CRITIQUE - Routes principales calendrier |
| `services/collaborative-events-service.ts` | 13 | 🔴 CRITIQUE - Événements collaboratifs |
| `services/calendar-reminder-service.ts` | 7 | 🟡 IMPORTANT - Rappels automatiques |
| `services/intelligent-sync-service.ts` | 4 | 🟡 IMPORTANT - Sync intelligente |
| `routes/google-calendar.ts` | 3 | 🟢 MOYEN - Sync Google |
| `routes/collaborative-events.ts` | 1 | 🟢 MOYEN - Routes collaboratif |

### 🟡 FRONTEND (1 fichier, 4 requêtes)

| Fichier | Occurrences | Impact |
|---------|-------------|--------|
| `services/messaging-service.ts` | 4 | 🟡 Messagerie affiche calendrier |

### ℹ️ TYPES SEULEMENT (13 fichiers)

Ces fichiers contiennent juste des interfaces TypeScript, pas de requêtes SQL :
- `types/calendar.ts`
- `types/messaging.ts`
- `hooks/*` (7 fichiers)
- `services/*` (4 fichiers)

→ Pas urgent, juste renommer les interfaces plus tard

---

## 🎯 OPTIONS

### Option A : MIGRER LE CODE MAINTENANT (RECOMMANDÉ)

**Avantages** :
- ✅ Application fonctionnelle immédiatement
- ✅ Système unifié complet
- ✅ Pas de régression

**Durée estimée** : 2-3 heures
- Fichier par fichier
- Tests après chaque migration
- Commit progressif

---

### Option B : ROLLBACK SQL (Solution temporaire)

Si tu n'as pas le temps maintenant, on peut **annuler la migration SQL** et la refaire plus tard quand le code sera prêt.

**Script de rollback** :
```sql
BEGIN;

-- Recréer CalendarEvent depuis RDV
CREATE TABLE "CalendarEvent" AS 
SELECT 
    id,
    title,
    description,
    (scheduled_date || ' ' || scheduled_time)::timestamp as start_date,
    ((scheduled_date || ' ' || scheduled_time)::timestamp + (duration_minutes || ' minutes')::interval) as end_date,
    -- ... autres colonnes
FROM "RDV";

-- Recréer CalendarEventParticipant depuis RDV_Participants
-- ...

COMMIT;
```

Mais c'est **déconseillé** car on perd le bénéfice de la simplification.

---

## 💡 MA RECOMMANDATION

**Migrer le code maintenant, fichier par fichier**

### Plan d'action (2-3h)

#### Phase 1 : Routes calendar.ts (1h)
- Remplacer CalendarEvent → RDV
- Adapter start_date/end_date → scheduled_date/scheduled_time
- Tester GET/POST/PUT/DELETE événements

#### Phase 2 : Services (1h)
- collaborative-events-service.ts
- calendar-reminder-service.ts  
- intelligent-sync-service.ts

#### Phase 3 : Sync Google (30min)
- google-calendar.ts
- Adapter le mapping

#### Phase 4 : Frontend (30min)
- messaging-service.ts
- Vérifier affichage calendrier

#### Phase 5 : Tests (30min)
- Créer un événement
- Lister le calendrier
- Modifier/Supprimer
- Vérifier dashboards

---

## 🚀 DÉCISION REQUISE

**Tu préfères :**

**A)** Continuer la migration maintenant (je corrige les 6 fichiers critiques)
**B)** Rollback SQL et refaire plus tard (solution temporaire)

**Dis-moi "A" ou "B"** et je procède immédiatement ! 🎯

---

## 📝 Note

Le wizard formulaire prospects est **terminé et fonctionnel**.
Le seul problème est le calendrier général qui doit être adapté.

