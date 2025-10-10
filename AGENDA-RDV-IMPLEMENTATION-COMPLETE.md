# 📅 AGENDA / RDV - IMPLÉMENTATION COMPLÈTE

## 🎯 RÉSUMÉ GLOBAL

Le module Agenda/RDV a été entièrement repensé et optimisé pour offrir une expérience professionnelle V1 avec :
- ✅ 2 vues distinctes : **Liste** et **Calendrier**
- ✅ Scission claire entre **RDV en attente** et **RDV confirmés**
- ✅ Workflow automatique de confirmation post-RDV
- ✅ Support multi-profils avec filtres
- ✅ RDV de 30min sur heure pile ou demi-heure
- ✅ Notifications automatiques complètes

---

## 📋 VUE LISTE - Scission Claire

### Affichage

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Liste  |  📅 Calendrier                    [➕ Nouveau RDV]  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ⏳ RDV en attente de confirmation (2)                          │
│  ├─ [🔵 Client] Présentation Produit - 15 oct 09:00            │
│  │   Proposé | ✓ Accepter | ✗ Refuser | 🕐 Contre-proposer     │
│  └─ [🟢 Expert] Consultation - 16 oct 14:30                    │
│      Proposé | ✓ Accepter | ✗ Refuser | 🕐 Contre-proposer     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ✅ RDV confirmés (3)                                           │
│  ├─ [🔵 Client] Audit Fiscal - 17 oct 10:00                    │
│  ├─ [🟣 Apporteur] Suivi Prospect - 18 oct 11:30               │
│  └─ [🟢 Expert] Bilan Annuel - 19 oct 16:00                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📅 RDV passés (1)                                              │
│  └─ [🔵 Client] Signature Contrat - 10 oct 09:00 (Terminé)     │
└─────────────────────────────────────────────────────────────────┘
```

### Caractéristiques
- 🟡 **Section Jaune** : RDV en attente (avec actions)
- 🟢 **Section Verte** : RDV confirmés (ordre chronologique)
- ⚪ **Section Grise** : RDV passés (ordre anti-chronologique)
- 🎨 Bordures colorées selon type de profil (bleu/vert/violet)
- ⚡ Animations fluides (framer-motion)

---

## 📅 VUE CALENDRIER - Groupée par Date

### Affichage

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Liste  |  📅 Calendrier                    [➕ Nouveau RDV]  │
└─────────────────────────────────────────────────────────────────┘

📅 Mardi 15 octobre 2025
├─ 09:00 - [🔵] Présentation Produit (Client) | Confirmé
│  📹 Visio | 30min | 👥 Cabinet Martin
│
├─ 14:30 - [🟢] Consultation Fiscale (Expert) | Proposé
│  📍 Présentiel | 30min | 👥 Profitum SAS
│  [✓ Accepter] [✗ Refuser] [🕐 Contre-proposer]
│
└─ 16:00 - [🟣] Suivi Prospect (Apporteur) | Confirmé
   📞 Téléphone | 30min | 👥 MARC DURANT

📅 Mercredi 16 octobre 2025
├─ 10:00 - [🔵] Audit Fiscal (Client) | Confirmé
│  📹 Visio | 30min | 👥 Expert Roussel
│
└─ ...
```

### Caractéristiques
- 📆 Groupement par date (ordre chronologique)
- 🕐 Tri par heure dans chaque date
- 🎨 Badges colorés par type de profil
- 📊 Vue chronologique optimale pour planification

---

## 🔄 WORKFLOW AUTOMATIQUE POST-RDV

### 1️⃣ Détection Automatique

```typescript
Service: rdvCompletionService.ts
Fréquence: Toutes les 30 minutes
Logique:
  - Récupère tous les RDV avec status = 'confirmed'
  - Calcule heure_fin = scheduled_time + duration_minutes
  - Si heure_fin <= heure_actuelle → RDV terminé
```

### 2️⃣ Notification Automatique

**Déclenchement :** Dès que l'heure de fin est atteinte

**Notification envoyée à :** Tous les participants

**Contenu :**
```
Titre: "RDV à confirmer"
Message: "Le RDV 'Présentation Produit' prévu le 15/10/2025 
          à 09:00 est terminé. A-t-il eu lieu ?"
Actions: 
  - ✅ Oui, le RDV a eu lieu
  - ❌ Non, le RDV n'a pas eu lieu (+ motif)
```

### 3️⃣ Confirmation Utilisateur

**Route API :** `POST /api/rdv/:id/mark-completed`

**Payload :**
```json
{
  "completed": true,  // ou false
  "cancellation_reason": "Motif si non effectué"
}
```

**Actions backend :**
- Si `completed = true` → status = 'completed'
- Si `completed = false` → status = 'cancelled' + raison
- Notification envoyée aux autres participants
- Email automatique (optionnel)

### 4️⃣ Résultats

**Si RDV effectué :**
```
✅ Status → 'completed'
📧 Notification : "Le RDV a été marqué comme effectué"
📊 Comptabilisé dans statistiques conversion
```

**Si RDV non effectué :**
```
❌ Status → 'cancelled'
💬 Raison stockée : "Client absent" / "Annulation de dernière minute"
📧 Notification : "Le RDV n'a pas eu lieu. Raison: [...]"
📊 Non comptabilisé dans conversion
```

---

## 🎛️ SÉLECTEUR DE VUE

### Interface

```
┌───────────────────────────────────┐
│  Mon Agenda                       │
│  Gérez tous vos rendez-vous       │
│                                   │
│  [📋 Liste] [📅 Calendrier]       │
└───────────────────────────────────┘
```

**Comportement :**
- Bouton actif : fond bleu, texte blanc
- Bouton inactif : fond gris clair, texte gris foncé
- État sauvegardé en local (viewMode: 'list' | 'calendar')
- Vue par défaut : **Liste**

---

## 🎨 ADAPTATION MONO-TYPE VS MULTI-TYPES

### Utilisateur Mono-Type (1 seul profil)

```
╔═══════════════════════════════════════╗
║  Mon Agenda                           ║
║  Gérez tous vos rendez-vous           ║
╚═══════════════════════════════════════╝

[📋 Liste] [📅 Calendrier]  [➕ Nouveau RDV]

┌─────────────────────────────────────┐
│  ⏳ RDV en attente (2)               │
│  ├─ Présentation Produit             │  <-- PAS de badge type
│  └─ Consultation                     │
└─────────────────────────────────────┘
```

**Différences :**
- ❌ Pas de mention "Multi-Types"
- ❌ Pas de section filtres (cases à cocher)
- ❌ Pas de pastille colorée ni badge "En tant que"
- ✅ Bordures colorées conservées (aide visuelle)

### Utilisateur Multi-Types (2+ profils)

```
╔════════════════════════════════════════════╗
║  Mon Agenda Multi-Types                    ║
║  Gérez vos RDV selon vos différents profils║
╚════════════════════════════════════════════╝

┌─────────────────────────────────────┐
│  👥 Afficher mes RDV                │
│  ☑ 🔵 Mes RDV Client                │
│  ☑ 🟢 Mes RDV Expert                │
│  ☑ 🟣 Mes RDV Apporteur             │
└─────────────────────────────────────┘

[📋 Liste] [📅 Calendrier]  [➕ Nouveau RDV]

┌─────────────────────────────────────┐
│  ⏳ RDV en attente (2)               │
│  ├─ 🔵 Présentation [En tant que: client]
│  └─ 🟢 Consultation [En tant que: expert]
└─────────────────────────────────────┘
```

**Différences :**
- ✅ "Multi-Types" visible
- ✅ Section filtres avec cases à cocher
- ✅ Pastilles colorées (🔵🟢🟣)
- ✅ Badges "En tant que" pour clarifier

---

## ⚙️ CONTRAINTES TECHNIQUES

### RDV de 30 minutes

```typescript
// Backend validation (server/src/routes/rdv.ts)
duration_minutes: 30  // Par défaut et obligatoire
```

### Horaires sur heure pile ou demi-heure

```typescript
// Validation backend
const [hours, minutes] = scheduled_time.split(':').map(Number);
if (minutes !== 0 && minutes !== 30) {
  return res.status(400).json({
    error: 'Les RDV doivent commencer à l\'heure pile ou à la demi-heure'
  });
}
```

**Horaires valides :** 09:00, 09:30, 10:00, 10:30, ...  
**Horaires invalides :** 09:15, 09:45, 10:20, ...

---

## 📊 STATUTS DES RDV

| Statut       | Badge Couleur | Description                          |
|--------------|---------------|--------------------------------------|
| `proposed`   | 🟡 Jaune      | En attente de confirmation           |
| `confirmed`  | 🟢 Vert       | Confirmé par tous                    |
| `completed`  | 🔵 Bleu       | Effectué (marqué post-échéance)      |
| `cancelled`  | 🔴 Rouge      | Annulé (avec motif)                  |
| `rescheduled`| 🟠 Orange     | Reprogrammé (nouvelle date proposée) |

---

## 🔔 NOTIFICATIONS AUTOMATIQUES

### 1. Proposition de RDV
```
Destinataires: Tous les participants invités
Message: "[Nom] vous propose un RDV"
Actions: Accepter / Refuser / Contre-proposer
```

### 2. Acceptation RDV
```
Destinataires: Créateur + autres participants
Message: "[Nom] a accepté le RDV"
```

### 3. Refus RDV
```
Destinataires: Créateur + autres participants
Message: "[Nom] a refusé le RDV. Motif: [...]"
```

### 4. Contre-proposition
```
Destinataires: Créateur + autres participants
Message: "[Nom] propose une nouvelle date: [date]"
Actions: Accepter nouvelle date / Refuser
```

### 5. RDV à confirmer (post-échéance) ⭐ NOUVEAU
```
Déclenchement: Automatique à heure_fin
Destinataires: Tous les participants
Message: "Le RDV est terminé. A-t-il eu lieu ?"
Actions: Oui / Non (+ motif)
```

### 6. Confirmation post-RDV
```
Destinataires: Autres participants
Message: "[Nom] a confirmé que le RDV a eu lieu"
OU
Message: "[Nom] indique que le RDV n'a pas eu lieu. Raison: [...]"
```

---

## 🗂️ STRUCTURE FICHIERS

### Frontend

```
client/src/
├── components/rdv/
│   ├── UnifiedAgendaView.tsx     (Vue principale avec 2 modes)
│   ├── RDVFormModal.tsx          (Formulaire création/édition)
│   └── RDVCard.tsx               (Composant interne carte RDV)
│
└── pages/
    ├── apporteur/agenda.tsx      (Wrapper apporteur)
    ├── agenda-client.tsx         (Wrapper client)
    ├── expert/agenda.tsx         (Wrapper expert)
    └── agenda-admin.tsx          (Wrapper admin)
```

### Backend

```
server/src/
├── routes/
│   └── rdv.ts                    (Routes RDV + /mark-completed)
│
└── services/
    └── rdvCompletionService.ts   (Service notification auto)
```

---

## 🚀 DÉPLOIEMENT

### Installation dépendance

```bash
npm install node-cron
```

### Démarrage automatique

Le service `rdvCompletionService` démarre automatiquement avec le serveur (`server/src/index.ts`).

**Logs de démarrage :**
```
✅ Service RDV Completion démarré (vérification toutes les 30min)
🔍 Vérification RDV terminés à 2025-10-15 14:30
📊 2 RDV à marquer comme potentiellement terminés
📧 Notification envoyée à Jean Dupont (jean@example.com)
✅ Notifications envoyées pour RDV abc-123 - "Présentation Produit"
```

---

## 🧪 TESTS

### Test notification automatique

1. Créer un RDV avec `scheduled_time` dans le passé
2. Status = 'confirmed'
3. Attendre 30min (ou redémarrer serveur)
4. Vérifier notifications dans table `Notification`

### Test confirmation post-RDV

```bash
curl -X POST http://localhost:5001/api/rdv/RDV_ID/mark-completed \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

**Résultat attendu :**
- Status RDV → 'completed'
- Notifications envoyées aux participants
- Emails envoyés (si configuré)

### Test refus post-RDV

```bash
curl -X POST http://localhost:5001/api/rdv/RDV_ID/mark-completed \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": false,
    "cancellation_reason": "Client absent sans prévenir"
  }'
```

**Résultat attendu :**
- Status RDV → 'cancelled'
- Champ `cancellation_reason` rempli
- Notifications avec motif envoyées

---

## 📈 STATISTIQUES & CONVERSION

Les RDV effectués (`completed`) sont désormais comptabilisés dans les statistiques de conversion :

```typescript
// Conversion Prospect → RDV
const rdvs = await supabase
  .from('RDV')
  .select('*')
  .eq('client_id', clientId)
  .neq('status', 'cancelled');

// Conversion RDV → Signature (RDV effectués uniquement)
const completedRDVs = await supabase
  .from('RDV')
  .select('*')
  .eq('client_id', clientId)
  .eq('status', 'completed');
```

---

## ✅ CHECKLIST FINALE

- [x] 2 vues distinctes (Liste / Calendrier)
- [x] Scission claire RDV en attente vs confirmés
- [x] RDV de 30min obligatoires
- [x] Horaires sur heure pile ou demi-heure
- [x] Support multi-profils avec filtres
- [x] Adaptation mono-type vs multi-types
- [x] Workflow post-RDV automatique
- [x] Notifications complètes
- [x] Service cron de vérification
- [x] Route API `/mark-completed`
- [x] Emails automatiques
- [x] Animations fluides
- [x] Responsive design
- [x] TypeScript typé
- [x] Gestion erreurs
- [x] Logs détaillés

---

## 🎯 PROCHAINES ÉTAPES (Optionnel)

1. **Interface de réponse notification** : Boutons dans l'app pour répondre directement
2. **Rappels avant RDV** : Email/notification 24h et 1h avant
3. **Récurrence** : RDV récurrents (hebdomadaire, mensuel)
4. **Export iCal** : Exporter RDV vers calendriers externes
5. **Statistiques avancées** : Taux de présence par client/expert
6. **Détails RDV** : Modal avec plus d'infos (notes, documents)

---

**🚀 Le module Agenda/RDV est maintenant prêt pour la production V1 !**

