# 🔍 AUDIT MODULE AGENDA/RDV

## 📊 État Actuel

### Tables Identifiées
1. ✅ `RDV` - Table principale (utilisée par /api/rdv)
2. ⚠️ `ClientRDV` - Table secondaire (utilisée par /api/apporteur/extended)

### Routes Backend
1. ✅ `server/src/routes/rdv.ts` - Routes principales
   - GET /api/rdv - Liste RDV
   - GET /api/rdv/:id - Détail RDV
   - POST /api/rdv - Créer RDV
   - PUT /api/rdv/:id - Modifier RDV
   - DELETE /api/rdv/:id - Supprimer RDV

2. ⚠️ `server/src/routes/apporteur-extended.ts`
   - POST /clients/:clientId/rdv - Créer RDV (utilise ClientRDV)
   - GET /clients/:clientId/rdv - Liste RDV client

3. ✅ `server/src/routes/expert-rdv-validation.ts` - Validation RDV par experts

### Pages Frontend
1. `client/src/pages/apporteur/agenda.tsx` - Agenda apporteur
2. `client/src/pages/agenda-client.tsx` - Agenda client
3. `client/src/pages/expert/agenda.tsx` - Agenda expert
4. `client/src/pages/agenda-admin.tsx` - Agenda admin
5. `client/src/pages/ApporteurAgenda.tsx` - Doublon ?

### Composants
1. `client/src/components/UnifiedCalendar.tsx` - Calendrier unifié
2. `client/src/components/client/ClientRDVValidationCard.tsx` - Validation RDV client

---

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. Doublon de Tables
```
RDV (principale)           vs    ClientRDV (secondaire)
├── client_id                    ├── client_id
├── expert_id                    ├── expert_id
├── apporteur_id                 ├── apporteur_id
├── scheduled_date               ├── scheduled_date
├── scheduled_time               ├── scheduled_time
├── duration_minutes: 60 ❌      ├── duration_minutes: 60 ❌
└── ...                          └── ...
```

**Risque :** RDV enregistrés dans 2 tables différentes → Incohérence

### 2. Duration par Défaut
```typescript
duration_minutes: rdvData.duration_minutes || 60  // ❌ 60min
```
**Doit être :** 30min

### 3. Slots Horaires
**Actuel :** Aucune validation
**Besoin :** Slots de 30min (09:00, 09:30, 10:00, 10:30, etc.)

### 4. Formulaire Création
**Actuel :** Bouton "Nouveau RDV" sans action
**Besoin :** Modal/Page avec formulaire complet

### 5. Sélection Participants
**Actuel :** 1 client + 1 expert + 1 apporteur (max)
**Besoin :** Multi-sélection possible ?

---

## ❓ QUESTIONS POUR L'UTILISATEUR

### 1. Table à Utiliser
**Quelle table devons-nous standardiser ?**
- A. `RDV` (recommandé - plus complète)
- B. Supprimer `ClientRDV` et migrer vers `RDV`

### 2. Qui Peut Créer
**Quels types d'utilisateurs peuvent créer un RDV ?**
- [ ] Client
- [ ] Expert  
- [ ] Apporteur
- [ ] Admin

### 3. Participants
**Un RDV doit avoir :**
- Client : 1 obligatoire OU plusieurs possibles ?
- Expert : 1 obligatoire OU plusieurs possibles ?
- Apporteur : Optionnel ?
- Admin : Participant ou observateur ?

**Exemple souhaité :**
```
RDV "Audit Fiscal"
├── 1 Client (obligatoire)
├── 1 Expert (obligatoire)
└── 1 Apporteur (optionnel)
```

OU

```
RDV "Réunion Multi-Produits"
├── 1 Client
├── Expert TICPE
├── Expert URSSAF
└── 1 Apporteur
```

### 4. Champs du Formulaire
**Quels champs sont nécessaires ?**

Actuels (table RDV):
- scheduled_date ✅
- scheduled_time ✅
- duration_minutes (30min fixe ?)
- meeting_type (video/physique/phone)
- title
- description/notes
- location (si physique)
- meeting_url (si video)
- client_id ✅
- expert_id ✅
- apporteur_id (optionnel)
- status (proposed/confirmed/completed/cancelled)
- category
- priority

**Manque-t-il des champs ?**
- [ ] Produits liés au RDV ?
- [ ] Documents à préparer ?
- [ ] Rappel auto (email/SMS) ?
- [ ] Lien Google Calendar ?

### 5. Validations
**Règles métier :**
- [ ] RDV uniquement en semaine (lundi-vendredi) ?
- [ ] Horaires bureau (9h-18h) ?
- [ ] Pas de RDV le week-end ?
- [ ] Délai minimum avant RDV (ex: 24h) ?
- [ ] Expert disponible (vérification agenda) ?

### 6. Notifications
**Qui reçoit des notifications à la création ?**
- [ ] Client
- [ ] Expert
- [ ] Apporteur
- [ ] Tous

---

## 🎯 PLAN D'ACTION PROPOSÉ (Après Réponses)

### Phase 1 : Unification
1. Supprimer table `ClientRDV`
2. Migrer données vers `RDV` si nécessaire
3. Standardiser routes sur `RDV`

### Phase 2 : Backend
1. Mettre duration par défaut à 30min
2. Ajouter validation slots (00:00/00:30)
3. Ajouter endpoint multi-participants
4. Améliorer validations

### Phase 3 : Frontend
1. Créer formulaire unifié création RDV
2. Sélecteur multi-participants
3. Sélecteur créneaux 30min
4. Validation frontend
5. Intégrer dans toutes les pages agenda

### Phase 4 : Tests
1. Créer RDV depuis chaque type d'utilisateur
2. Vérifier slots 30min
3. Vérifier multi-participants
4. Tester notifications

---

## 📝 Répondez aux Questions

**Merci de répondre aux Q1-Q6 ci-dessus pour que je puisse optimiser parfaitement le module RDV !**

Je vais créer un système professionnel aligné avec vos besoins exacts.

