# Correction Formulaire Événement → Table RDV

## ✅ Corrections Appliquées

### 1. **Fonction de Transformation** (`transformCalendarEventToRDV`)

#### ✅ Problème: Priority STRING → INTEGER
- **Avant**: `priority: "low"` (string)
- **Après**: `priority: 1` (integer)
- **Mapping**: low=1, medium=2, high=3, critical=4

#### ✅ Problème: Colonnes inexistantes (type, color)
- **Solution**: Stockées dans `metadata.event_type` et `metadata.color`
- **Format metadata**: 
  ```json
  {
    "event_type": "appointment",
    "color": "#3B82F6"
  }
  ```

#### ✅ Problème: meeting_type non rempli
- **Solution**: Toujours calculé (video/phone/physical)
- **Logique**: 
  - `is_online=true` → `"video"`
  - `phone_number` présent → `"phone"`
  - Sinon → `"physical"`

#### ✅ Problème: Colonnes non filtrées
- **Solution**: Ne garder QUE les colonnes existantes dans RDV
- **Colonnes conservées**:
  ```typescript
  {
    title, description, scheduled_date, scheduled_time,
    duration_minutes, meeting_type, location, meeting_url,
    status, category, priority, metadata, notes
  }
  ```

### 2. **Logique d'Insertion**

#### ✅ Problème: client_id NOT NULL
La table RDV exige `client_id` NOT NULL, mais un apporteur/expert/admin peut créer un événement sans client spécifique.

**Solution**:
- **Client**: `client_id = authUser.database_id` ✅
- **Expert**: `client_id = eventData.client_id || authUser.database_id` ✅
- **Apporteur**: `client_id = eventData.client_id || authUser.database_id` ✅
- **Admin**: `client_id = eventData.client_id || authUser.database_id` ✅

#### ✅ Ajout Logs de Debugging
```typescript
console.log('📝 Création événement - Données reçues:', eventData);
console.log('📝 Données RDV transformées:', rdvData);
console.log('📝 Événement à insérer:', newEvent);
console.error('❌ Détails erreur:', { message, details, hint, code });
```

### 3. **Structure Table RDV (Référence)**

| Colonne           | Type      | Nullable | Default            | Notes                          |
|-------------------|-----------|----------|--------------------|--------------------------------|
| id                | uuid      | NO       | gen_random_uuid()  | PK                             |
| client_id         | uuid      | NO       | -                  | ⚠️ OBLIGATOIRE                 |
| expert_id         | uuid      | YES      | null               |                                |
| apporteur_id      | uuid      | YES      | null               |                                |
| meeting_type      | varchar   | NO       | -                  | ⚠️ OBLIGATOIRE (video/phone/physical) |
| scheduled_date    | date      | NO       | -                  | ⚠️ OBLIGATOIRE                 |
| scheduled_time    | time      | NO       | -                  | ⚠️ OBLIGATOIRE                 |
| duration_minutes  | integer   | YES      | 60                 |                                |
| location          | text      | YES      | null               |                                |
| meeting_url       | text      | YES      | null               |                                |
| status            | varchar   | YES      | 'scheduled'        |                                |
| title             | varchar   | YES      | null               |                                |
| description       | text      | YES      | null               |                                |
| category          | varchar   | YES      | 'client_rdv'       |                                |
| priority          | integer   | YES      | 1                  | ⚠️ INTEGER pas STRING          |
| metadata          | jsonb     | YES      | '{}'               | Contient event_type et color   |
| created_by        | uuid      | YES      | null               |                                |
| created_at        | timestamp | YES      | now()              |                                |
| updated_at        | timestamp | YES      | now()              |                                |
| notes             | text      | YES      | null               |                                |

## 🎯 Résultat

### Flux Complet
1. **Frontend** → Formulaire envoie données CalendarEvent
2. **API** → `transformCalendarEventToRDV()` convertit vers format RDV
3. **Transformation**:
   - ✅ `start_date` → `scheduled_date` + `scheduled_time`
   - ✅ `end_date - start_date` → `duration_minutes`
   - ✅ `priority` STRING → INTEGER
   - ✅ `type` → `metadata.event_type`
   - ✅ `color` → `metadata.color`
   - ✅ `is_online` → `meeting_type`
4. **Insertion**:
   - ✅ `client_id` toujours rempli (requis)
   - ✅ Tous les champs obligatoires présents
   - ✅ Logs complets pour debugging

### Test de Création
```bash
POST /api/calendar/events
{
  "title": "Réunion Client",
  "description": "Présentation produits",
  "start_date": "2024-01-15T10:00:00.000Z",
  "end_date": "2024-01-15T11:00:00.000Z",
  "type": "meeting",
  "priority": "medium",
  "category": "apporteur",
  "location": "Paris",
  "is_online": false
}

→ Transformé en RDV:
{
  "title": "Réunion Client",
  "description": "Présentation produits",
  "scheduled_date": "2024-01-15",
  "scheduled_time": "10:00:00",
  "duration_minutes": 60,
  "meeting_type": "physical",
  "location": "Paris",
  "meeting_url": null,
  "status": "scheduled",
  "category": "apporteur",
  "priority": 2,
  "metadata": {
    "event_type": "meeting",
    "color": "#3B82F6"
  },
  "notes": "Présentation produits",
  "client_id": "apporteur-uuid",
  "apporteur_id": "apporteur-uuid",
  "created_by": "apporteur-uuid"
}
```

## 📋 Actions Effectuées

- ✅ Correction fonction `transformCalendarEventToRDV()`
- ✅ Conversion priority STRING → INTEGER
- ✅ Stockage type/color dans metadata
- ✅ Gestion client_id obligatoire pour tous les types d'utilisateurs
- ✅ Ajout logs détaillés pour debugging
- ✅ Filtrage colonnes pour ne garder que celles existantes
- ✅ Valeurs par défaut pour champs obligatoires

## 🚀 Déploiement

Les corrections sont prêtes à être commitées et déployées.
La création d'événements devrait maintenant fonctionner parfaitement ! 🎉

