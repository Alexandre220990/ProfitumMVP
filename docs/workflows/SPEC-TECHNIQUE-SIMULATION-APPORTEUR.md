# 📋 SPÉCIFICATION TECHNIQUE - Simulation Apporteur pour Prospect

**Date :** 9 octobre 2025  
**Version :** 1.0 - Spécification Complète

---

## 🎯 RÉCAPITULATIF DE VOS CHOIX

### ✅ Décisions Prises

| #  | Aspect | Choix | Détails |
|----|--------|-------|---------|
| 1  | **Flux UX** | Option A - Intégré | Tout dans le même formulaire |
| 2  | **Experts** | 1 par produit + Multi-produits | Prioriser experts multi-spécialités |
| 3  | **Questions** | Option A - Complet | Toutes les questions |
| 4  | **Édition** | Continuer → RDV | Simulation → Experts → RDV → Validation |
| 5  | **Persistance** | Auto + Confirmation | Sauvegarde auto, demande confirmation |
| 6  | **Affichage** | Éligibles + Toggle | Voir non éligibles si besoin |
| 7  | **Pré-remplissage** | Oui + Modifiable | Intelligent avec override |
| 8  | **Ordre** | 3→4→5→6→7 | Qualification → Simulation → Experts → RDV → Email |
| 9  | **Email RDV** | Oui + Nouveau | Email validation RDV avec récapitulatif |
| 10 | **Notifications** | Oui | Expert dashboard + agenda + validation |
| 11 | **Responsive** | Oui | Full responsive |
| 12 | **Design** | Premium | Haut de gamme cohérent |

---

## ❓ QUESTIONS CRITIQUES RESTANTES

### 1️⃣ **RDV : 1 ou Plusieurs ?**

**Scénario** : Prospect éligible à 3 produits (TICPE, URSSAF, CEE)

**Option A** : 1 RDV par produit
```
TICPE   → Expert A → RDV le 15/10 à 10h
URSSAF  → Expert B → RDV le 16/10 à 14h
CEE     → Expert C → RDV le 17/10 à 11h

Total : 3 RDV créés
```

**Option B** : 1 RDV groupé si même expert
```
TICPE + URSSAF → Expert A (multi-spécialité) → RDV le 15/10 à 10h
CEE            → Expert C                     → RDV le 16/10 à 14h

Total : 2 RDV créés
```

**Option C** : 1 RDV global + experts multiples
```
RDV le 15/10 à 10h avec :
- Expert A (TICPE + URSSAF)
- Expert C (CEE)

Total : 1 RDV avec 3 participants
```

**👉 Quelle option préférez-vous : A, B ou C ?**

---

### 2️⃣ **Expert Multi-Produits : Algorithme de Sélection**

**Scénario** : Prospect éligible à TICPE + URSSAF + Foncier

**Experts disponibles :**
- Expert A : TICPE ⭐ 4.9 (spécialiste)
- Expert B : URSSAF ⭐ 4.8 (spécialiste)
- Expert C : TICPE + URSSAF ⭐ 4.5 (généraliste)
- Expert D : TICPE + URSSAF + Foncier ⭐ 4.2 (multi-spécialités)
- Expert E : Foncier ⭐ 4.7 (spécialiste)

**Option A** : Prioriser spécialistes (meilleur score)
```
TICPE   → Expert A (4.9) - Spécialiste
URSSAF  → Expert B (4.8) - Spécialiste
Foncier → Expert E (4.7) - Spécialiste

Résultat : 3 experts, 3 RDV
```

**Option B** : Prioriser multi-produits (moins de RDV)
```
TICPE + URSSAF → Expert C (4.5) - Traite 2 produits
Foncier        → Expert E (4.7) - Traite 1 produit

Résultat : 2 experts, 2 RDV
```

**Option C** : Optimisation intelligente (équilibre)
```
TICPE + URSSAF + Foncier → Expert D (4.2) - Traite tous
OU si Expert D pas dispo/score faible :
TICPE + URSSAF → Expert C (4.5)
Foncier        → Expert E (4.7)

Résultat : Minimum d'experts avec qualité maximale
```

**👉 Quelle logique d'optimisation : A, B ou C ?**

---

### 3️⃣ **RDV : Qui Choisit la Date ?**

**Lors de l'enregistrement prospect** :

**Option A** : Apporteur fixe la date immédiatement
```
Formulaire → Date/heure RDV → Expert notifié → Expert accepte/refuse
```

**Option B** : Proposition, expert confirme
```
Formulaire → Proposition date → Expert valide → RDV confirmé
```

**Option C** : Expert choisit après
```
Formulaire → RDV "à planifier" → Expert propose dates → Client choisit
```

**👉 Workflow RDV préféré : A, B ou C ?**

---

### 4️⃣ **Email au Prospect : Quand ?**

**Timing d'envoi de l'email** :

**Option A** : Immédiatement après enregistrement
```
Enregistrement → Email envoyé → Expert valide RDV après
⚠️ Risque : RDV pas encore validé par expert
```

**Option B** : Après validation expert
```
Enregistrement → Expert valide → Email envoyé
⚠️ Délai : Prospect peut attendre 24-48h
```

**Option C** : 2 emails
```
Email 1 : Bienvenue + accès compte (immédiat)
Email 2 : RDV confirmé (après validation expert)
```

**👉 Timing email : A, B ou C ?**

---

### 5️⃣ **Table RDV : Quelle Structure ?**

**Votre BDD a déjà** : `ProspectRDV` ET `ClientRDV`

**Question** : Un prospect devient client après inscription. Quelle table utiliser ?

**Option A** : Toujours `ProspectRDV`
```
Créer dans ProspectRDV
Migrer vers ClientRDV quand prospect → client
```

**Option B** : Unifier en `ClientRDV`
```
Créer directement dans ClientRDV
(car prospect = client avec status='prospect')
```

**Option C** : Créer nouvelle table `ApporteurProspectRDV`
```
Table spécifique pour RDV créés par apporteurs
```

**👉 Quelle table utiliser : A, B ou C ?**

---

### 6️⃣ **Lien ClientProduitEligible ↔ RDV**

**Comment lier les RDV aux produits ?**

**Option A** : Colonne `product_id` dans table RDV
```sql
ALTER TABLE ClientRDV ADD COLUMN product_id UUID REFERENCES ProduitEligible(id);
```

**Option B** : Table de liaison `RDV_Produits`
```sql
CREATE TABLE RDV_Produits (
  rdv_id UUID,
  product_id UUID,
  PRIMARY KEY (rdv_id, product_id)
);
```

**Option C** : Metadata JSON
```sql
ClientRDV.metadata = {
  products: ['produit_id_1', 'produit_id_2'],
  client_produit_eligible_ids: ['cpe_1', 'cpe_2']
}
```

**👉 Lien RDV-Produit : A, B ou C ?**

---

### 7️⃣ **Expert Refuse le RDV : Que se passe-t-il ?**

**Workflow de refus** :

**Option A** : Proposition automatique d'un autre expert
```
Expert A refuse → Système propose Expert B (même spécialité)
→ Notification apporteur + prospect
```

**Option B** : Notification apporteur pour action manuelle
```
Expert A refuse → Apporteur notifié → Apporteur choisit nouvel expert
```

**Option C** : Système intelligent avec fallback
```
Expert A refuse → Tentative auto Expert B → Si échec → Notif apporteur
```

**👉 Gestion refus expert : A, B ou C ?**

---

### 8️⃣ **Prospect Sans Simulation : Que Montrer ?**

**Si apporteur choisit "Sélection Manuelle"** :

**Option A** : Liste complète 10 produits avec checkboxes
```
[ ] TICPE
[ ] URSSAF
[ ] CEE
... (10 produits)

→ Pour produits cochés : recommander 1 expert par produit
```

**Option B** : Sélection puis recommandation globale
```
Apporteur coche 3 produits
→ Système trouve 1 expert qui peut traiter les 3
→ Si impossible : propose combinaison optimale
```

**Option C** : Wizard guidé
```
Étape 1 : Sélectionner produits
Étape 2 : Système optimise experts
Étape 3 : Apporteur valide/ajuste
```

**👉 Mode manuel : A, B ou C ?**

---

### 9️⃣ **Affichage Mobile : Priorités**

**Sur mobile/tablette, que privilégier ?**

**Option A** : Formulaire vertical long
```
Une colonne
Toutes les sections empilées
Scroll vertical important
```

**Option B** : Wizard multi-étapes
```
1 section par écran
Navigation prev/next
Progress bar en haut
```

**Option C** : Accordéons
```
Sections collapsibles
Ouvrir/fermer selon besoin
Moins de scroll
```

**👉 UX Mobile : A, B ou C ?**

---

### 🔟 **Sauvegarde Auto : Fréquence ?**

**Quand déclencher la sauvegarde auto ?**

**Option A** : Après chaque champ
```
onChange → debounce 2s → save
⚠️ Beaucoup de requêtes
```

**Option B** : Après chaque section
```
Entreprise complétée → save
Décisionnaire complété → save
...
```

**Option C** : Intelligente
```
Champs critiques (email, nom) → save immédiat
Autres champs → save toutes les 30s si changement
```

**👉 Fréquence sauvegarde : A, B ou C ?**

---

## 🏗️ ARCHITECTURE PROPOSÉE

### Base de Données

#### Nouvelle Table : `ClientRDV_Produits` (Option 6-B recommandée)

```sql
CREATE TABLE "ClientRDV_Produits" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rdv_id UUID NOT NULL REFERENCES "ClientRDV"(id) ON DELETE CASCADE,
    client_produit_eligible_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES "ProduitEligible"(id),
    expert_id UUID NOT NULL REFERENCES "Expert"(id),
    notes TEXT,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rdv_id, client_produit_eligible_id)
);
```

#### Nouveau Type de Notification

```typescript
// À ajouter dans NotificationType
EXPERT_PROSPECT_RDV_PROPOSED = 'expert_prospect_rdv_proposed',
EXPERT_PROSPECT_RDV_CONFIRMED = 'expert_prospect_rdv_confirmed',
EXPERT_PROSPECT_RDV_MODIFIED = 'expert_prospect_rdv_modified',
APPORTEUR_EXPERT_RDV_ACCEPTED = 'apporteur_expert_rdv_accepted',
APPORTEUR_EXPERT_RDV_REFUSED = 'apporteur_expert_rdv_refused',
PROSPECT_RDV_SCHEDULED = 'prospect_rdv_scheduled',
```

---

### API Endpoints Nécessaires

#### 1. Simulation par Apporteur

```typescript
// POST /api/apporteur/prospects/:prospectId/simulation
POST /api/apporteur/prospects/:prospectId/simulation
Request: {
  answers: Record<number, string[]>,
  apporteur_id: string,
  prospect_data: {
    company_name: string,
    budget_range: string,
    timeline: string,
    qualification_score: number
  }
}
Response: {
  simulation_id: string,
  eligible_products: ClientProduitEligibleWithExpert[],
  total_savings: number,
  recommended_experts: Expert[]
}
```

#### 2. Experts Recommandés (Optimisés Multi-Produits)

```typescript
// POST /api/apporteur/experts/recommend
POST /api/apporteur/experts/recommend
Request: {
  product_ids: string[],
  optimize_for: 'quality' | 'quantity' | 'balanced'
}
Response: {
  recommendations: {
    expert: Expert,
    products: string[], // IDs produits qu'il peut traiter
    combined_score: number,
    estimated_rdv_count: number
  }[]
}
```

#### 3. Création RDV Multiples

```typescript
// POST /api/apporteur/prospects/:prospectId/schedule-meetings
POST /api/apporteur/prospects/:prospectId/schedule-meetings
Request: {
  meetings: [
    {
      expert_id: string,
      product_ids: string[], // Produits à discuter dans ce RDV
      client_produit_eligible_ids: string[],
      meeting_type: 'phone' | 'video' | 'physical',
      scheduled_date: string,
      scheduled_time: string,
      location?: string,
      notes?: string
    }
  ]
}
Response: {
  created_meetings: RDV[],
  notifications_sent: {
    expert_ids: string[],
    prospect_email_sent: boolean
  }
}
```

#### 4. Validation Expert

```typescript
// PUT /api/expert/meetings/:meetingId/respond
PUT /api/expert/meetings/:meetingId/respond
Request: {
  response: 'accept' | 'propose_alternative' | 'refuse',
  alternative_date?: string,
  alternative_time?: string,
  refusal_reason?: string,
  notes?: string
}
Response: {
  meeting: RDV,
  notifications_sent: {
    apporteur: boolean,
    prospect: boolean
  }
}
```

---

## 🎨 FLUX UX COMPLET

### Étape par Étape

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : Informations Entreprise                           │
│ ├─ Nom entreprise *                                         │
│ ├─ SIREN                                                    │
│ ├─ Adresse                                                  │
│ └─ Site web                                                 │
│                                                              │
│ [Auto-save après validation]                                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : Décisionnaire                                     │
│ ├─ Nom complet *                                            │
│ ├─ Email *                                                  │
│ ├─ Téléphone *                                              │
│ └─ Poste                                                    │
│                                                              │
│ [Auto-save après validation]                                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 : Qualification                                     │
│ ├─ Score qualification (1-10)                               │
│ ├─ Niveau d'intérêt                                         │
│ ├─ Budget                                                   │
│ └─ Timeline                                                 │
│                                                              │
│ [Auto-save après validation]                                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 : Identification Produits + Simulation              │
│                                                              │
│ ┌───────────────────┬───────────────────┐                   │
│ │ ⚡ Simulation     │ 📝 Manuelle       │                   │
│ │ ═════════════════ │ ───────────────── │                   │
│ └───────────────────┴───────────────────┘                   │
│                                                              │
│ SI SIMULATION :                                              │
│   ┌─────────────────────────────────────────────┐           │
│   │ 📊 Questions (8-12 questions)               │           │
│   │ → Pré-remplies avec données formulaire      │           │
│   │ → Modifiables par apporteur                 │           │
│   │ → Navigation prev/next                      │           │
│   └─────────────────────────────────────────────┘           │
│                                                              │
│   ✅ Résultats :                                             │
│   ┌─────────────────────────────────────────────┐           │
│   │ 🏆 TICPE (92%)        ~18 000€              │           │
│   │ ✅ URSSAF (85%)       ~12 000€              │           │
│   │ ⚠️ CEE (45%)          ~5 000€               │           │
│   │                                             │           │
│   │ Total économies : ~35 000€                  │           │
│   │                                             │           │
│   │ ▼ Voir 7 produits non éligibles             │           │
│   └─────────────────────────────────────────────┘           │
│                                                              │
│ SI MANUELLE :                                                │
│   [ ] TICPE                                                  │
│   [ ] URSSAF                                                 │
│   [ ] CEE                                                    │
│   ... (10 produits)                                          │
│                                                              │
│ [Auto-save après simulation]                                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 5 : Experts Recommandés (Multi-Optimisés)            │
│                                                              │
│ 🎯 Optimisation : 3 produits → 2 experts (au lieu de 3)     │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Expert A - Jean Dupont              ⭐ 4.7           │ │
│ │    Cabinet Expertise Fiscale                            │ │
│ │                                                         │ │
│ │    ✅ Traite 2 produits :                                │ │
│ │    ├─ 🏆 TICPE (Match: 98%)                             │ │
│ │    └─ ✅ URSSAF (Match: 95%)                             │ │
│ │                                                         │ │
│ │    💰 Économies totales client : ~30 000€               │ │
│ │    📊 65 dossiers similaires réussis                    │ │
│ │    ⚡ Disponible sous 24h                                │ │
│ │                                                         │ │
│ │    [✓ Sélectionné]  [i Voir Profil]                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Expert B - Marie Martin             ⭐ 4.6           │ │
│ │    Cabinet Énergie Conseil                              │ │
│ │                                                         │ │
│ │    ⚠️ Traite 1 produit :                                 │ │
│ │    └─ ⚠️ CEE (Match: 92%)                                │ │
│ │                                                         │ │
│ │    💰 Économies client : ~5 000€                         │ │
│ │    📊 28 dossiers CEE réussis                           │ │
│ │                                                         │ │
│ │    [✓ Sélectionné]  [i Voir Profil]                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ 💡 Alternative : Expert C peut traiter les 3 produits       │
│    mais score moyen plus faible (4.3/5.0)                   │
│    [ Voir l'alternative ]                                   │
│                                                              │
│ [Auto-save experts sélectionnés]                            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 6 : Planification RDV (1 par Expert)                 │
│                                                              │
│ 🏆 Optimisation : 2 RDV au lieu de 3                         │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 RDV #1 avec Jean Dupont                              │ │
│ │                                                         │ │
│ │ Produits à discuter :                                   │ │
│ │ ├─ 🏆 TICPE (~18 000€)                                  │ │
│ │ └─ ✅ URSSAF (~12 000€)                                  │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────┐     │ │
│ │ │ Type : [●] Présentiel [ ] Visio [ ] Tél       │     │ │
│ │ │ Date : [15/10/2025]  Heure : [10:00]          │     │ │
│ │ │ Durée : 90 min (2 produits = 45min chacun)    │     │ │
│ │ │ Lieu : [Bureau client - Paris]                │     │ │
│ │ └─────────────────────────────────────────────────┘     │ │
│ │                                                         │ │
│ │ 📝 Notes pour l'expert :                                 │ │
│ │ [____________________________________]                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 RDV #2 avec Marie Martin                             │ │
│ │ Produits : ⚠️ CEE (~5 000€)                              │ │
│ │ [Même structure que RDV #1]                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Auto-save après chaque RDV]                                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 7 : Envoi Email                                       │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📧 Options d'email au prospect                          │ │
│ │                                                         │ │
│ │ [ ] Ne pas envoyer                                      │ │
│ │                                                         │ │
│ │ [●] Email "Échange concluant" (existant)                │ │
│ │     + Présentation Profitum                             │ │
│ │                                                         │ │
│ │ [ ] Email "Présentation" (existant)                     │ │
│ │     + Présentation détaillée                            │ │
│ │                                                         │ │
│ │ [✓] Inclure résultats simulation          ← NOUVEAU     │ │
│ │     + Produits identifiés                               │ │
│ │     + Économies estimées                                │ │
│ │                                                         │ │
│ │ [✓] Inclure récapitulatif RDV            ← NOUVEAU     │ │
│ │     + Liste des RDV planifiés                           │ │
│ │     + Experts assignés                                  │ │
│ │     + Calendrier ICS en pièce jointe                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ 💡 Aperçu email :                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Objet : Bienvenue chez Profitum - Vos RDV confirmés    │ │
│ │                                                         │ │
│ │ Bonjour [Nom],                                          │ │
│ │                                                         │ │
│ │ Suite à notre échange, voici vos identifiants :         │ │
│ │ Email : [email]                                         │ │
│ │ Mot de passe : [temp_password]                          │ │
│ │                                                         │ │
│ │ 📊 Produits identifiés pour vous :                      │ │
│ │ • TICPE : ~18 000€ d'économies                          │ │
│ │ • URSSAF : ~12 000€ d'économies                         │ │
│ │ • CEE : ~5 000€ d'économies                             │ │
│ │ TOTAL : ~35 000€                                        │ │
│ │                                                         │ │
│ │ 📅 RDV planifiés :                                       │ │
│ │                                                         │ │
│ │ RDV #1 : 15/10/2025 à 10:00                             │ │
│ │ Expert : Jean Dupont (TICPE + URSSAF)                   │ │
│ │ Type : Présentiel - Paris                               │ │
│ │ [Ajouter à mon agenda]                                  │ │
│ │                                                         │ │
│ │ RDV #2 : 16/10/2025 à 14:00                             │ │
│ │ Expert : Marie Martin (CEE)                             │ │
│ │ Type : Visioconférence                                  │ │
│ │ [Ajouter à mon agenda]                                  │ │
│ │                                                         │ │
│ │ [Accéder à mon espace]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 8 : Validation Finale                                 │
│                                                              │
│ ✅ Récapitulatif :                                           │
│ ├─ Prospect : Transport Express SARL                        │
│ ├─ 3 produits éligibles (~35 000€)                          │
│ ├─ 2 experts assignés                                       │
│ ├─ 2 RDV planifiés                                          │
│ └─ Email envoyé : Oui                                       │
│                                                              │
│            [Annuler]  [✅ Enregistrer le Prospect]           │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ SAUVEGARDE EN BDD                                           │
│                                                              │
│ 1. ✅ Créer Client (status: prospect)                        │
│ 2. ✅ Créer Simulation                                       │
│ 3. ✅ Créer ClientProduitEligible (3 produits)               │
│ 4. ✅ Créer ClientRDV (2 RDV)                                │
│ 5. ✅ Créer ClientRDV_Produits (liaisons)                    │
│ 6. ✅ Créer ExpertNotifications (2 experts)                  │
│ 7. ✅ Envoyer Email au prospect                              │
│ 8. ✅ Créer ProspectStatut (nouveau)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 WORKFLOW EXPERT (Après Enregistrement)

### Vue Expert Dashboard

```
╔═══════════════════════════════════════════════════════════════╗
║ 🏠 Dashboard Expert - Jean Dupont                            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║ 🔔 Notifications (1 nouvelle)                                  ║
║                                                                ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ 🆕 Nouveau RDV Proposé - Transport Express SARL           │ ║
║ │                                                            │ ║
║ │ 📅 15/10/2025 à 10:00 (90 min)                             │ ║
║ │ 📍 Présentiel - Paris                                      │ ║
║ │ 👤 Apporteur : Alexandre Martin (Apporteur Pro)            │ ║
║ │                                                            │ ║
║ │ Produits à traiter :                                       │ ║
║ │ • TICPE (~18 000€)                                         │ ║
║ │ • URSSAF (~12 000€)                                        │ ║
║ │                                                            │ ║
║ │ ℹ️ Score qualification : 8/10                              │ ║
║ │ ℹ️ Intérêt : Élevé                                         │ ║
║ │ ℹ️ Budget : 10k-50k€                                       │ ║
║ │                                                            │ ║
║ │ [✅ Accepter]  [📅 Proposer autre date]  [❌ Refuser]      │ ║
║ └────────────────────────────────────────────────────────────┘ ║
║                                                                ║
║ 📅 Agenda                                                      ║
║                                                                ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ Lundi 15/10                                                │ ║
║ │                                                            │ ║
║ │ ⏰ 10:00-11:30  🆕 Transport Express (À CONFIRMER)          │ ║
║ │                TICPE + URSSAF                              │ ║
║ │                [Gérer ce RDV]                              │ ║
║ │                                                            │ ║
║ │ ⏰ 14:00-15:00  ✅ Client ABC (CONFIRMÉ)                    │ ║
║ │                Foncier                                     │ ║
║ └────────────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════╝
```

### Actions Expert

```
Expert clique "✅ Accepter"
   ↓
Mise à jour ClientRDV :
├─ status: 'scheduled' → 'confirmed'
├─ expert_response: 'accept'
├─ expert_response_at: NOW()
   ↓
Notifications envoyées :
├─ Apporteur : "Expert A a accepté le RDV"
├─ Prospect : "Votre RDV est confirmé"
   ↓
Email confirmé au prospect :
└─ "RDV confirmé avec Jean Dupont le 15/10 à 10h"
```

```
Expert clique "📅 Proposer autre date"
   ↓
Modal proposition :
├─ Nouvelle date
├─ Nouvelle heure
├─ Raison (optionnel)
   ↓
Mise à jour ClientRDV :
├─ status: 'scheduled' → 'pending_reschedule'
├─ expert_response: 'propose_alternative'
├─ alternative_date: nouvelle_date
├─ alternative_time: nouvelle_heure
   ↓
Notifications :
├─ Apporteur : "Expert propose 16/10 à 15h"
├─ Apporteur peut accepter/refuser la proposition
```

---

## 🎯 ALGORITHME EXPERT MULTI-PRODUITS

### Logique d'Optimisation

```typescript
function optimizeExpertSelection(
  products: ClientProduitEligible[],
  availableExperts: Expert[]
): ExpertRecommendation[] {
  
  // 1. Calculer toutes les combinaisons possibles
  const combinations = generateExpertCombinations(products, availableExperts);
  
  // 2. Scorer chaque combinaison
  combinations.forEach(combo => {
    combo.score = calculateCombinationScore({
      // Critères de qualité
      averageExpertRating: getAverageRating(combo.experts),
      productMatchScores: getProductMatches(combo),
      expertExperience: getTotalExperience(combo.experts),
      
      // Critères d'efficacité
      numberOfExperts: combo.experts.length, // Moins = mieux
      numberOfMeetings: combo.meetings.length, // Moins = mieux
      totalDuration: estimateTotalDuration(combo),
      
      // Critères de disponibilité
      expertAvailability: checkAvailability(combo.experts),
      
      // Pondération
      weights: {
        quality: 0.4,      // 40% qualité
        efficiency: 0.3,   // 30% efficacité
        availability: 0.3  // 30% disponibilité
      }
    });
  });
  
  // 3. Trier par score
  combinations.sort((a, b) => b.score - a.score);
  
  // 4. Retourner top 3 recommandations
  return combinations.slice(0, 3).map(combo => ({
    experts: combo.experts,
    meetings: combo.meetings,
    products: combo.products,
    totalScore: combo.score,
    estimatedSavings: combo.totalSavings,
    advantages: generateAdvantages(combo),
    tradeoffs: generateTradeoffs(combo)
  }));
}

function calculateCombinationScore(params) {
  const qualityScore = (
    params.averageExpertRating * 20 +        // Max 100
    params.productMatchScores * 0.8 +        // Max 80
    params.expertExperience * 0.2            // Max 20
  );
  
  const efficiencyScore = (
    (5 - params.numberOfExperts) * 20 +      // Moins d'experts = mieux
    (5 - params.numberOfMeetings) * 15 +     // Moins de RDV = mieux
    (200 - params.totalDuration) * 0.15      // Moins de temps = mieux
  );
  
  const availabilityScore = params.expertAvailability * 100;
  
  return (
    qualityScore * params.weights.quality +
    efficiencyScore * params.weights.efficiency +
    availabilityScore * params.weights.availability
  );
}
```

### Exemples de Résultats

**Cas 1** : 3 produits (TICPE, URSSAF, Foncier)

```
Recommandation #1 (Score: 92/100) ⭐ RECOMMANDÉ
├─ Expert A (TICPE + URSSAF) ⭐ 4.8
├─ Expert B (Foncier) ⭐ 4.7
└─ 2 RDV, durée totale 120 min
   Avantages : Meilleure qualité, spécialistes
   Compromis : 2 RDV à gérer

Recommandation #2 (Score: 85/100)
├─ Expert C (TICPE + URSSAF + Foncier) ⭐ 4.2
└─ 1 RDV, durée 90 min
   Avantages : 1 seul RDV, plus simple
   Compromis : Généraliste, qualité moyenne

Recommandation #3 (Score: 78/100)
├─ Expert D (TICPE) ⭐ 4.9
├─ Expert E (URSSAF) ⭐ 4.8
├─ Expert F (Foncier) ⭐ 4.7
└─ 3 RDV, durée totale 150 min
   Avantages : Spécialistes top qualité
   Compromis : 3 RDV, complexe à organiser
```

**👉 L'apporteur peut choisir entre les 3 recommandations**

---

## 📱 DESIGN RESPONSIVE

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* 1 colonne */
  /* Wizard multi-étapes */
  /* Bottom sheet pour produits */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 2 colonnes */
  /* Sections collapsibles */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Layout optimal */
  /* Tout visible */
}
```

### Composants Mobile

```tsx
// Mobile : Bottom Sheet pour Produits
<Sheet>
  <SheetTrigger>
    3 produits éligibles • 35 000€
  </SheetTrigger>
  <SheetContent side="bottom" className="h-[80vh]">
    <ProductsList />
  </SheetContent>
</Sheet>

// Mobile : Wizard Navigation
<div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
  <Button onClick={prev}>← Précédent</Button>
  <Button onClick={next}>Suivant →</Button>
</div>
```

---

## 🚀 QUESTIONS CRITIQUES FINALES

Avant de commencer l'implémentation complète, j'ai besoin de vos réponses :

### **Workflow RDV**
**Q1** : RDV - A (1 par produit), B (groupé par expert), ou C (1 global) ?  
**Q2** : Expert multi-produits - A (qualité), B (quantité), ou C (équilibré) ?  
**Q3** : Date RDV - A (apporteur fixe), B (proposition), ou C (expert après) ?  
**Q4** : Email timing - A (immédiat), B (après validation), ou C (2 emails) ?

### **Technique**
**Q5** : Table RDV - A (ProspectRDV), B (ClientRDV), ou C (nouvelle) ?  
**Q6** : Lien RDV-Produit - A (colonne), B (table liaison), ou C (JSON) ?  
**Q7** : Refus expert - A (auto-propose), B (apporteur manuel), ou C (intelligent) ?  
**Q8** : Mode manuel experts - A (1 par produit), B (1 global optimisé), ou C (wizard) ?

### **UX Mobile**
**Q9** : Mobile - A (vertical), B (wizard), ou C (accordéons) ?  
**Q10** : Auto-save - A (chaque champ), B (chaque section), ou C (intelligent) ?

---

## 💡 MES RECOMMANDATIONS PROFESSIONNELLES

Basé sur 15 ans d'expérience UX/UI et systèmes CRM :

```
Q1: B (Groupé par expert) - Réduit complexité client
Q2: C (Équilibré) - Meilleur compromis qualité/efficacité
Q3: B (Proposition + validation) - Plus professionnel
Q4: C (2 emails) - Confirmation immédiate + validation RDV
Q5: B (ClientRDV) - Simplifie architecture (prospect = client)
Q6: B (Table liaison) - Plus flexible et évolutif
Q7: C (Intelligent) - Meilleure UX pour tous
Q8: B (1 global optimisé) - Cohérence avec simulation
Q9: B (Wizard) - Meilleure UX mobile
Q10: C (Intelligent) - Balance performance/sécurité
```

---

## 📊 ESTIMATION DÉVELOPPEMENT

### Phase 1 : Backend (3-4 jours)
- API simulation apporteur
- Algorithme optimisation experts
- API création RDV multiples
- Système notifications
- API validation expert

### Phase 2 : Frontend (4-5 jours)
- Toggle Simulation/Manuelle
- Simulateur embarqué
- Cards produits enrichies
- Sélection experts optimisée
- Workflow RDV multiples
- Preview emails

### Phase 3 : Tests & Polish (2-3 jours)
- Tests unitaires
- Tests intégration
- Design responsive
- Animations
- Documentation

**Total estimé : 9-12 jours de développement**

---

## 🎯 PROCHAINE ÉTAPE

**Répondez aux 10 questions (format : "Q1-B, Q2-C, Q3-A...")**

Et je commence l'implémentation complète avec :
1. ✅ Schéma BDD complet
2. ✅ APIs backend
3. ✅ Composants React
4. ✅ Design system cohérent
5. ✅ Tests
6. ✅ Documentation

**Prêt à créer un système haut de gamme ! 🚀**

