# 📅 Système RDV Multi-Participants - Documentation Complète

## 🎯 Vue d'ensemble

Le système permet de créer des rendez-vous qui sont automatiquement partagés entre plusieurs participants :
- **Apporteur d'affaires** (créateur)
- **Client/Prospect**
- **Expert** (si présélectionné)
- **Admin** (accès complet en lecture)

---

## 🔄 Flow Complet Utilisateur

### 1. **Création d'un Prospect par l'Apporteur**

```
Apporteur → Prospects → Nouveau Prospect
│
├─ Étape 1: Informations Client
│  ├─ Entreprise (nom, SIREN, adresse, site web)
│  ├─ Décisionnaire (nom, email, téléphone, poste)
│  └─ Qualification (score, intérêt, budget, timeline)
│
├─ Étape 2: Sélection Produits
│  ├─ Liste des produits éligibles
│  ├─ Sélection multiple avec priorité
│  └─ Notes et montants estimés
│
├─ Étape 3: 🆕 Sélection Expert (OPTIONNEL)
│  ├─ Chargement automatique experts pertinents
│  ├─ Filtrage par spécialisations des produits
│  ├─ Affichage: Rating, spécialisations matchées, performance
│  └─ Sélection d'un expert (ou continuer sans)
│
├─ Étape 4: Configuration RDV
│  ├─ Type (physique, vidéo, téléphone)
│  ├─ Date et heure
│  └─ Lieu (si physique)
│
└─ Étape 5: Validation
   ├─ Option envoi email identifiants au prospect
   └─ Enregistrement complet
```

### 2. **Création Automatique des Participants**

Lors de la validation, le système crée automatiquement :

```javascript
CalendarEvent {
  title: "RDV Prospect - [Nom Entreprise]",
  start_date: "2025-01-15T14:00:00Z",
  end_date: "2025-01-15T15:00:00Z", // +1h automatique
  type: "meeting",
  priority: "high",
  status: "scheduled",
  created_by: apporteur_id,
  client_id: prospect_id,
  expert_id: expert_id || null
}

CalendarEventParticipant[] {
  // 1. Apporteur (créateur)
  {
    event_id: calendar_event_id,
    user_id: apporteur_id,
    user_type: "apporteur_affaires",
    status: "accepted" // ✅ Accepté automatiquement
  },
  
  // 2. Client/Prospect
  {
    event_id: calendar_event_id,
    user_id: prospect_id,
    user_type: "client",
    status: "pending" // ⏳ En attente de confirmation
  },
  
  // 3. Expert (si présélectionné)
  {
    event_id: calendar_event_id,
    user_id: expert_id,
    user_type: "expert",
    status: "pending" // ⏳ En attente de confirmation
  }
}
```

---

## 🛠️ Modifications Techniques

### **Backend**

#### `server/src/services/ProspectService.ts`
- ✅ Création automatique `CalendarEvent`
- ✅ Création automatique `CalendarEventParticipant` (3 participants)
- ✅ Correction colonnes : `start_date`/`end_date` (pas `start_time`/`end_time`)
- ✅ Calcul automatique heure de fin (+1h)
- ✅ Liaison expert présélectionné si disponible

#### `server/src/services/ApporteurService.ts`
- ✅ Nouvelle méthode `getExpertsByProducts(productIds)`
- ✅ Filtre experts par spécialisations des produits
- ✅ Score de pertinence (`relevance_score`)
- ✅ Spécialisations matchées (`matched_specializations`)
- ✅ Tri intelligent (pertinence puis rating)

#### `server/src/routes/apporteur.ts`
- ✅ Nouvel endpoint `POST /api/apporteur/experts/by-products`
- ✅ Validation liste produits requise
- ✅ Retour experts triés par pertinence

### **Frontend**

#### `client/src/components/apporteur/ProspectForm.tsx`
- ✅ Nouvelle interface `Expert` avec types complets
- ✅ État `availableExperts` et `selectedExpert`
- ✅ Fonction `fetchExpertsByProducts()` - chargement auto
- ✅ Fonction `fetchExpertDetails()` - mode édition
- ✅ Hook `useEffect` pour charger experts sur changement produits
- ✅ Section UI "Sélection Expert" :
  - Cartes experts cliquables
  - Design gradient purple/pink
  - Affichage rating, spécialisations, performance
  - Feedback visuel sélection (ring purple)
  - Message confirmation expert sélectionné
- ✅ Envoi `preselected_expert_id` au backend

#### `client/src/components/apporteur/ProspectManagement.tsx`
- ✅ Bouton "Voir détails" ouvre `ProspectForm` en mode édition
- ✅ Suppression bouton "Modifier" redondant
- ✅ Support modification expert depuis le modal

---

## 📊 Structure Base de Données

### **Table CalendarEvent**
```sql
- id: uuid PRIMARY KEY
- title: varchar NOT NULL
- description: text
- start_date: timestamptz NOT NULL
- end_date: timestamptz NOT NULL
- type: varchar NOT NULL
- priority: varchar NOT NULL
- status: varchar NOT NULL
- category: varchar NOT NULL
- client_id: uuid FOREIGN KEY → Client(id)
- expert_id: uuid FOREIGN KEY → Expert(id)
- created_by: uuid FOREIGN KEY → Client(id)
- location: text
- is_online: boolean
- meeting_url: text
- metadata: jsonb
- created_at: timestamptz
- updated_at: timestamptz
```

### **Table CalendarEventParticipant**
```sql
- id: uuid PRIMARY KEY
- event_id: uuid NOT NULL FOREIGN KEY → CalendarEvent(id)
- user_id: uuid
- user_type: varchar NOT NULL ('client', 'expert', 'apporteur_affaires')
- user_email: varchar
- user_name: varchar
- status: varchar NOT NULL ('pending', 'accepted', 'declined')
- response_date: timestamptz
- notified_at: timestamptz
- reminder_sent: boolean
- created_at: timestamptz
```

---

## 🔐 Row Level Security (RLS)

### **CalendarEvent - 6 Policies**
1. **Users can create events** (INSERT) - Tous utilisateurs authentifiés
2. **Users can view their own events** (SELECT) - Créateur ou participant
3. **Event creators can view calendar events** (SELECT) - Créateur uniquement
4. **Participants can view calendar events** (SELECT) - Participants uniquement
5. **Clients can view own calendar events** (SELECT) - Clients via `client_id`
6. **Users can update their own events** (UPDATE) - Créateur uniquement
7. **Users can delete their own events** (DELETE) - Créateur uniquement

### **CalendarEventParticipant - Politiques héritées**
- Les participants voient leurs participations via la relation `event_id`

---

## 🎨 Interface Utilisateur

### **Étape Sélection Expert**

**Design:**
- Background gradient : `from-purple-50 to-pink-50`
- Border : `border-2 border-purple-200`
- Icône principale : `Users` (lucide-react)

**États:**
1. **Loading** : Spinner avec message "Chargement des experts..."
2. **Empty** : Icône + message "Aucun expert trouvé" + "Continuer sans"
3. **Liste Experts** : Grid 2 colonnes avec cartes cliquables
4. **Expert sélectionné** : Message confirmation vert avec checkmark

**Carte Expert:**
```
┌─────────────────────────────────────┐
│ [Nom Expert]         ⭐ 4.8         │
│ Entreprise                          │
│                                     │
│ Spécialisations pertinentes:       │
│ [CIR] [TICPE] [BPI]                │
│                                     │
│ 🏆 12 dossiers  ✅ Disponible      │
└─────────────────────────────────────┘
```

**Feedback Sélection:**
- Non sélectionné : `border-gray-200 hover:border-gray-300 bg-white`
- Sélectionné : `ring-2 ring-purple-500 bg-purple-50`
- Checkmark vert visible sur carte sélectionnée

---

## 🧪 Tests & Vérification

### **Script de vérification**
```bash
# Exécuter le script SQL de vérification
psql -U postgres -d profitum -f docs/database/verify-calendar-system.sql
```

### **Vérifications à faire:**

#### 1. **Création Prospect avec Expert**
```javascript
// Créer un prospect
POST /api/apporteur/prospects
{
  company_name: "Test Corp",
  name: "Jean Test",
  email: "test@test.com",
  phone_number: "0600000000",
  selected_products: [
    { id: "prod-1", selected: true, priority: "high" }
  ],
  preselected_expert_id: "expert-123", // ← Expert sélectionné
  meeting_type: "video",
  scheduled_date: "2025-01-15",
  scheduled_time: "14:00"
}

// Vérifier dans la BDD
SELECT * FROM "CalendarEvent" WHERE client_id = [prospect_id];
SELECT * FROM "CalendarEventParticipant" WHERE event_id = [event_id];

// Résultat attendu: 3 participants
// - Apporteur (status: accepted)
// - Client (status: pending)
// - Expert (status: pending)
```

#### 2. **Modification Prospect - Changement Expert**
```javascript
// Ouvrir modal détails prospect
// Modifier expert sélectionné
// Sauvegarder

PUT /api/apporteur/prospects/:id
{
  ...existing_data,
  preselected_expert_id: "expert-456" // ← Nouvel expert
}

// Vérifier mise à jour CalendarEvent.expert_id
// Vérifier mise à jour CalendarEventParticipant
```

#### 3. **Affichage Agendas**
- `/apporteur/agenda` → RDV visible pour apporteur ✅
- `/agenda-client` → RDV visible pour client ✅
- `/expert/agenda` → RDV visible pour expert ✅
- `/admin/calendar` → RDV visible pour admin ✅

---

## 📝 Prochaines Étapes

### **TODO Restants:**

1. ⏳ **Vérifier affichage RDV sur agendas de tous les participants**
   - Tester agenda apporteur
   - Tester agenda client/prospect
   - Tester agenda expert
   - Vérifier filtrage RLS

2. ⏳ **Tester le flow complet de bout en bout**
   - Créer prospect avec expert
   - Vérifier création participants
   - Vérifier affichage multi-agendas
   - Tester modification expert
   - Tester suppression

### **Améliorations Futures:**

1. **Notifications en temps réel**
   - Notification apporteur : RDV créé
   - Notification client : Invitation RDV
   - Notification expert : Invitation RDV

2. **Gestion des confirmations**
   - Bouton accepter/refuser RDV
   - Mise à jour statut participant
   - Notification changement statut

3. **Synchronisation calendriers externes**
   - Google Calendar
   - Outlook Calendar
   - iCal export

4. **Rappels automatiques**
   - Email 24h avant RDV
   - Email 1h avant RDV
   - SMS optionnel

---

## 🐛 Bugs Connus & Solutions

### **Bug 1: Colonnes start_time/end_time n'existent pas**
- ❌ Ancien code : `start_time`, `end_time`
- ✅ Correction : `start_date`, `end_date`
- 📁 Fichier : `server/src/services/ProspectService.ts`

### **Bug 2: Expert présélectionné non chargé en mode édition**
- ❌ Ancien code : Charge formData mais pas selectedExpert
- ✅ Correction : Ajout `fetchExpertDetails()` dans `fetchProspect()`
- 📁 Fichier : `client/src/components/apporteur/ProspectForm.tsx`

---

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs backend : `console.log` dans ProspectService
2. Vérifier les logs frontend : Console navigateur
3. Exécuter script vérification SQL
4. Consulter cette documentation

---

**Dernière mise à jour:** 2025-01-08
**Version:** 1.0.0
**Auteur:** Système Profitum MVP

