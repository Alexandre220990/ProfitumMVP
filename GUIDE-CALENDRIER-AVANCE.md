# 📅 Guide du Système de Calendrier Avancé

## 🎯 Vue d'ensemble

Le nouveau système de calendrier avancé permet de gérer efficacement :
- **Rendez-vous collaboratifs** avec participants multiples
- **Échéances d'étapes** pour chaque dossier
- **Réunions en ligne** avec intégration d'URLs
- **Système de rappels** automatiques
- **Templates d'événements** prédéfinis

## 🚀 Installation et Configuration

### 1. Application de la migration

```bash
# Exécuter le script de migration
cd server
chmod +x scripts/apply-calendar-migration.sh
./scripts/apply-calendar-migration.sh
```

### 2. Vérification de l'installation

Le script vérifie automatiquement :
- ✅ Création des 7 tables principales
- ✅ Création des 3 vues utilitaires
- ✅ Activation du RLS (Row Level Security)
- ✅ Insertion des templates par défaut

## 📊 Structure de la Base de Données

### Tables Principales

#### 1. **CalendarEvent** - Événements du calendrier
```sql
- id: UUID (clé primaire)
- title: Titre de l'événement
- description: Description détaillée
- start_date/end_date: Dates de début et fin
- type: appointment|deadline|meeting|task|reminder
- priority: low|medium|high|critical
- status: pending|confirmed|completed|cancelled
- category: client|expert|admin|system|collaborative
- dossier_id: Référence au dossier (optionnel)
- is_online: Réunion en ligne
- meeting_url: URL de réunion
- color: Couleur personnalisée
- is_recurring: Événement récurrent
```

#### 2. **CalendarEventParticipant** - Participants
```sql
- event_id: Référence à l'événement
- user_id: ID de l'utilisateur
- user_type: client|expert|admin
- status: pending|accepted|declined|tentative
```

#### 3. **DossierStep** - Étapes de workflow
```sql
- dossier_id: Référence au dossier
- step_name: Nom de l'étape
- step_type: validation|documentation|expertise|approval|payment
- due_date: Date d'échéance
- status: pending|in_progress|completed|overdue
- progress: Progression (0-100%)
- assignee_id: Personne assignée
```

## 🎨 Utilisation dans l'Interface

### Composant AdvancedCalendar

```tsx
import { AdvancedCalendar } from "@/components/ui/calendar";

// Utilisation simple
<AdvancedCalendar className="w-full" />
```

### Fonctionnalités Disponibles

#### 1. **Vues Multiples**
- **Mois** : Vue calendrier classique
- **Agenda** : Liste chronologique des événements
- **Semaine** : Vue hebdomadaire (à implémenter)
- **Jour** : Vue journalière (à implémenter)

#### 2. **Gestion des Événements**
- ✅ Création d'événements avec formulaire complet
- ✅ Modification et suppression
- ✅ Ajout de participants
- ✅ Configuration de réunions en ligne
- ✅ Définition de rappels

#### 3. **Gestion des Étapes**
- ✅ Création d'étapes de dossier
- ✅ Suivi de progression
- ✅ Assignation de responsables
- ✅ Gestion des échéances

## 🔧 API et Intégration

### Hooks Personnalisés

#### useCalendarEvents
```tsx
const {
  events,
  dossierSteps,
  addEvent,
  updateEvent,
  deleteEvent,
  addDossierStep,
  updateDossierStep,
  deleteDossierStep
} = useCalendarEvents();
```

#### useCalendarView
```tsx
const {
  view,
  setView,
  navigateToDate,
  navigateToToday,
  navigateToPrevious,
  navigateToNext
} = useCalendarView();
```

### Types TypeScript

```tsx
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  category: 'client' | 'expert' | 'admin' | 'system' | 'collaborative';
  dossierId?: string;
  participants: string[];
  location?: string;
  isOnline?: boolean;
  meetingUrl?: string;
  color: string;
  reminders: Reminder[];
}

interface DossierStep {
  id: string;
  dossierId: string;
  dossierName: string;
  stepName: string;
  stepType: 'validation' | 'documentation' | 'expertise' | 'approval' | 'payment';
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  estimatedDuration: number;
  progress: number;
}
```

## 📱 Fonctionnalités Avancées

### 1. **Événements Collaboratifs**

#### Création d'un rendez-vous avec participants
```tsx
const newEvent = {
  title: "Réunion de suivi dossier TICPE",
  description: "Point sur l'avancement du dossier",
  startDate: new Date("2025-01-30T14:00:00"),
  endDate: new Date("2025-01-30T15:00:00"),
  type: "meeting",
  priority: "medium",
  category: "collaborative",
  dossierId: "dossier-123",
  participants: ["client@example.com", "expert@example.com"],
  isOnline: true,
  meetingUrl: "https://meet.google.com/abc-defg-hij",
  color: "#3B82F6"
};

addEvent(newEvent);
```

### 2. **Étapes de Dossier**

#### Création d'une étape avec échéance
```tsx
const newStep = {
  dossierId: "dossier-123",
  dossierName: "Dossier TICPE - Société ABC",
  stepName: "Validation des documents",
  stepType: "validation",
  dueDate: new Date("2025-02-05T17:00:00"),
  priority: "high",
  assignee: "expert@example.com",
  estimatedDuration: 120, // 2 heures
  progress: 0
};

addDossierStep(newStep);
```

### 3. **Système de Rappels**

#### Configuration des rappels
```tsx
const eventWithReminders = {
  // ... autres propriétés
  reminders: [
    { type: "email", time: 15 }, // 15 minutes avant
    { type: "push", time: 5 },   // 5 minutes avant
    { type: "sms", time: 60 }    // 1 heure avant
  ]
};
```

## 🎯 Cas d'Usage Typiques

### 1. **Workflow Client-Expert**

1. **Création du dossier** → Étape automatique créée
2. **Assignation d'expert** → Événement de notification
3. **Réunion de lancement** → Rendez-vous collaboratif
4. **Suivi des étapes** → Échéances avec progression
5. **Validation finale** → Étape critique avec rappels

### 2. **Gestion des Échéances**

```tsx
// Exemple : Création d'échéances automatiques
const createDossierSteps = (dossierId: string) => {
  const steps = [
    {
      dossierId,
      stepName: "Analyse initiale",
      stepType: "expertise",
      dueDate: addDays(new Date(), 3),
      priority: "high"
    },
    {
      dossierId,
      stepName: "Validation documents",
      stepType: "validation",
      dueDate: addDays(new Date(), 7),
      priority: "medium"
    },
    {
      dossierId,
      stepName: "Soumission finale",
      stepType: "approval",
      dueDate: addDays(new Date(), 14),
      priority: "critical"
    }
  ];
  
  steps.forEach(step => addDossierStep(step));
};
```

### 3. **Réunions Collaboratives**

```tsx
// Exemple : Création d'une réunion d'équipe
const createTeamMeeting = () => {
  const meeting = {
    title: "Réunion hebdomadaire équipe",
    description: "Point sur les dossiers en cours",
    startDate: nextMonday(new Date()),
    endDate: addHours(nextMonday(new Date()), 1),
    type: "meeting",
    category: "collaborative",
    isOnline: true,
    meetingUrl: "https://meet.google.com/team-weekly",
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=MO",
    participants: ["expert1@example.com", "expert2@example.com", "admin@example.com"]
  };
  
  addEvent(meeting);
};
```

## 🔒 Sécurité et Permissions

### Row Level Security (RLS)

Le système implémente un RLS complet :

- **Utilisateurs** : Voient leurs propres événements et ceux auxquels ils participent
- **Experts** : Accès aux événements de leurs dossiers assignés
- **Admins** : Accès complet à tous les événements
- **Clients** : Accès aux événements de leurs dossiers

### Politiques de Sécurité

```sql
-- Exemple de politique RLS
CREATE POLICY "Users can view their own events" ON "CalendarEvent"
    FOR SELECT USING (
        created_by = auth.uid() OR
        id IN (
            SELECT event_id FROM "CalendarEventParticipant" 
            WHERE user_id = auth.uid()
        )
    );
```

## 📊 Analytics et Reporting

### Vues Utilitaires

#### 1. **v_calendar_events_with_participants**
```sql
-- Événements avec nombre de participants
SELECT * FROM v_calendar_events_with_participants;
```

#### 2. **v_dossier_steps_with_assignee**
```sql
-- Étapes avec informations d'assignation
SELECT * FROM v_dossier_steps_with_assignee;
```

#### 3. **v_today_events**
```sql
-- Événements du jour
SELECT * FROM v_today_events;
```

### Logs d'Activité

Toutes les actions sont loggées dans `CalendarActivityLog` :
- Création/modification/suppression d'événements
- Participation aux réunions
- Changements de statut d'étapes

## 🚀 Optimisations et Performance

### Index Créés

- **Temporal** : `start_date`, `end_date`, `due_date`
- **Catégorisation** : `type`, `status`, `priority`, `category`
- **Relations** : `dossier_id`, `client_id`, `expert_id`
- **Recherche** : `title`, `description`

### Optimisations Recommandées

1. **Pagination** pour les listes d'événements
2. **Cache** des préférences utilisateur
3. **Lazy loading** des participants
4. **Index composites** pour les requêtes fréquentes

## 🔧 Maintenance et Monitoring

### Vérifications Régulières

```sql
-- Vérifier les événements en retard
SELECT * FROM "CalendarEvent" 
WHERE end_date < NOW() AND status = 'pending';

-- Vérifier les étapes en retard
SELECT * FROM "DossierStep" 
WHERE due_date < NOW() AND status != 'completed';

-- Statistiques d'utilisation
SELECT 
    type,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (end_date - start_date))/3600) as avg_duration_hours
FROM "CalendarEvent" 
GROUP BY type;
```

### Nettoyage Automatique

```sql
-- Supprimer les logs anciens (plus de 6 mois)
DELETE FROM "CalendarActivityLog" 
WHERE created_at < NOW() - INTERVAL '6 months';

-- Archiver les événements terminés (plus de 1 an)
-- (Créer une table d'archivage si nécessaire)
```

## 📞 Support et Dépannage

### Problèmes Courants

1. **Événements non visibles** → Vérifier les permissions RLS
2. **Rappels non envoyés** → Vérifier la configuration des notifications
3. **Conflits d'horaires** → Implémenter une validation côté client
4. **Performance lente** → Vérifier les index et optimiser les requêtes

### Logs de Debug

```sql
-- Vérifier les logs d'activité récents
SELECT * FROM "CalendarActivityLog" 
ORDER BY created_at DESC 
LIMIT 50;

-- Vérifier les erreurs de migration
SELECT * FROM "CalendarActivityLog" 
WHERE action LIKE '%error%' 
ORDER BY created_at DESC;
```

## 🎉 Conclusion

Le système de calendrier avancé offre une solution complète pour :
- ✅ Gérer les rendez-vous collaboratifs
- ✅ Suivre les échéances d'étapes
- ✅ Organiser des réunions en ligne
- ✅ Automatiser les rappels
- ✅ Assurer la sécurité des données
- ✅ Fournir des analytics détaillés

**Prochaine étape** : Tester le composant dans l'interface utilisateur et configurer les préférences selon vos besoins spécifiques. 