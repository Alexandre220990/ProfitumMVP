# 🔍 DÉCISION FINALE - Tables RDV et Liaisons

## ✅ Q5 : Quelle Table RDV Utiliser ?

### Tables Existantes
- ✅ `ProspectRDV` (existe, vide)
- ✅ `ClientRDV` (existe, vide)

### Structure Identique
```sql
-- Les 2 tables ont EXACTEMENT la même structure :
- id, expert_id, apporteur_id
- meeting_type, scheduled_date, scheduled_time
- status, expert_response, alternative_date, alternative_time
- notes, outcome, etc.
```

### Différence Clé
```
ProspectRDV → prospect_id (référence Prospect)
ClientRDV → client_id (référence Client)
```

### 🎯 RECOMMANDATION : **ClientRDV** (Option B)

**Raisons :**
1. ✅ **Vos prospects SONT des clients** (avec status='prospect')
2. ✅ **Pas de migration** nécessaire quand prospect → client actif
3. ✅ **Architecture simplifiée** (1 seule table)
4. ✅ **Requêtes plus simples** (pas de UNION)
5. ✅ **Cohérence** : Vous utilisez déjà `Client.status='prospect'`

**ProspectRDV serait utile SEULEMENT si** :
- Prospects dans table séparée `Prospect`
- Migration complexe prospect → client
❌ Ce n'est PAS votre cas

**✅ DÉCISION : Utiliser `ClientRDV`**

---

## ✅ Q6 : Comment Lier RDV ↔ Produits ?

### Option A : Colonne dans ClientRDV
```sql
ALTER TABLE ClientRDV ADD COLUMN product_id UUID;

Problème : 1 RDV = 1 seul produit ❌
Si expert traite TICPE + URSSAF en 1 RDV → impossible
```

### Option B : Table de Liaison (RECOMMANDÉ) ✅
```sql
CREATE TABLE ClientRDV_Produits (
  id UUID PRIMARY KEY,
  rdv_id UUID REFERENCES ClientRDV(id),
  client_produit_eligible_id UUID REFERENCES ClientProduitEligible(id),
  product_id UUID REFERENCES ProduitEligible(id),
  notes TEXT,
  priority INTEGER,
  estimated_duration_minutes INTEGER
);

Avantages :
✅ 1 RDV peut traiter plusieurs produits
✅ Flexible et évolutif
✅ Requêtes SQL faciles
✅ Historique précis
```

### Option C : JSON Metadata
```sql
ClientRDV.metadata = {
  "products": ["id1", "id2"],
  "client_produit_eligible_ids": ["cpe1", "cpe2"]
}

Problème : 
❌ Requêtes SQL complexes
❌ Pas de contraintes référentielles
❌ Difficile à maintenir
```

### 🎯 RECOMMANDATION : **Table Liaison** (Option B)

**Structure complète :**
```sql
CREATE TABLE "ClientRDV_Produits" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rdv_id UUID NOT NULL REFERENCES "ClientRDV"(id) ON DELETE CASCADE,
    client_produit_eligible_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES "ProduitEligible"(id),
    
    -- Métadonnées du produit dans ce RDV
    notes TEXT, -- Notes spécifiques à ce produit pour ce RDV
    priority INTEGER DEFAULT 1, -- Ordre de discussion dans le RDV
    estimated_duration_minutes INTEGER DEFAULT 30, -- Temps estimé pour ce produit
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unicité : un produit ne peut être lié qu'une fois à un RDV
    UNIQUE(rdv_id, client_produit_eligible_id)
);

-- Index pour performance
CREATE INDEX idx_clientrdv_produits_rdv ON "ClientRDV_Produits"(rdv_id);
CREATE INDEX idx_clientrdv_produits_cpe ON "ClientRDV_Produits"(client_produit_eligible_id);
CREATE INDEX idx_clientrdv_produits_product ON "ClientRDV_Produits"(product_id);
```

**✅ DÉCISION : Créer table `ClientRDV_Produits`**

---

## 📊 SCHÉMA RELATIONNEL COMPLET

```
┌─────────────┐
│   Client    │
│ (prospect)  │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────┐                   ┌─────────────┐
│ simulations │                   │  ClientRDV  │
└──────┬──────┘                   └──────┬──────┘
       │                                  │
       │                                  │
       ▼                                  ▼
┌──────────────────────┐          ┌──────────────────────┐
│ClientProduitEligible │◄─────────│ ClientRDV_Produits   │
│                      │          │ (NOUVELLE TABLE)     │
├──────────────────────┤          ├──────────────────────┤
│ client_id            │          │ rdv_id               │
│ produit_id           │          │ cpe_id               │
│ simulation_id        │          │ product_id           │
│ statut               │          │ notes                │
│ expert_id (assigné)  │          │ priority             │
│ tauxFinal            │          │ duration_minutes     │
│ montantFinal         │          └──────────────────────┘
└──────────────────────┘

         ▲
         │
         │
    ┌────┴─────┐
    │  Expert  │
    └──────────┘
```

### Relations
```
Client 1──────* ClientProduitEligible
Client 1──────* ClientRDV
ClientRDV 1───* ClientRDV_Produits
ClientProduitEligible 1───* ClientRDV_Produits
Expert 1──────* ClientRDV
Expert 1──────* ClientProduitEligible (via expert_id)
```

---

## 🎯 WORKFLOW RDV PRÉCIS

### Scénario Complet

**Données Prospect :**
- Nom : Transport Express SARL
- Produits éligibles : TICPE (92%), URSSAF (85%), CEE (45%)

**Optimisation Experts :**
```
Algorithme trouve :
├─ Expert A (Jean Dupont) : TICPE + URSSAF (score combiné: 88%)
└─ Expert B (Marie Martin) : CEE (score: 87%)

Résultat : 2 RDV au lieu de 3
```

### Création en BDD

**1. Créer ClientRDV #1**
```sql
INSERT INTO ClientRDV (
  client_id: 'uuid_transport_express',
  expert_id: 'uuid_jean_dupont',
  apporteur_id: 'uuid_apporteur',
  meeting_type: 'physical',
  scheduled_date: '2025-10-15',
  scheduled_time: '10:00',
  duration_minutes: 90, -- 2 produits × 45 min
  location: 'Bureau client - Paris',
  status: 'proposed', -- Nouveau statut
  notes: 'RDV pour TICPE et URSSAF'
) RETURNING id;
```

**2. Lier produits au RDV #1**
```sql
-- TICPE
INSERT INTO ClientRDV_Produits (
  rdv_id: 'rdv_1_id',
  client_produit_eligible_id: 'cpe_ticpe_id',
  product_id: 'ticpe_id',
  priority: 1,
  estimated_duration_minutes: 45
);

-- URSSAF
INSERT INTO ClientRDV_Produits (
  rdv_id: 'rdv_1_id',
  client_produit_eligible_id: 'cpe_urssaf_id',
  product_id: 'urssaf_id',
  priority: 2,
  estimated_duration_minutes: 45
);
```

**3. Créer ClientRDV #2** (même logique pour Expert B + CEE)

**4. Créer Notifications**
```sql
-- Pour Expert A
INSERT INTO ExpertNotification (
  expert_id: 'uuid_jean_dupont',
  notification_type: 'EXPERT_PROSPECT_RDV_PROPOSED',
  title: 'Nouveau RDV Proposé',
  message: 'Transport Express SARL - 15/10 à 10h - TICPE + URSSAF',
  data: {
    rdv_id: 'rdv_1_id',
    prospect_name: 'Transport Express SARL',
    products: ['TICPE', 'URSSAF'],
    estimated_savings: 30000
  },
  priority: 'high',
  status: 'unread'
);

-- Même pour Expert B
```

---

## 🔄 WORKFLOW VALIDATION EXPERT

### Expert Accepte
```
1. Expert clique "✅ Accepter" dans notification
   ↓
2. UPDATE ClientRDV SET 
     status = 'confirmed',
     expert_response = 'accept',
     expert_response_at = NOW()
   ↓
3. Notifications créées :
   ├─ Apporteur : "Jean Dupont a confirmé le RDV"
   └─ Client : "Votre RDV du 15/10 est confirmé"
   ↓
4. Email envoyé au client :
   "Confirmation RDV avec Jean Dupont"
```

### Expert Propose Nouvelle Date
```
1. Expert clique "📅 Proposer autre date"
   ↓
2. Modal :
   ├─ Nouvelle date : 16/10/2025
   ├─ Nouvelle heure : 14:00
   └─ Raison : "Conflit d'agenda"
   ↓
3. UPDATE ClientRDV SET 
     status = 'pending_client_validation',
     expert_response = 'propose_alternative',
     alternative_date = '2025-10-16',
     alternative_time = '14:00',
     expert_notes = 'Conflit d'agenda'
   ↓
4. Notifications créées :
   ├─ Apporteur : "Expert propose 16/10 à 14h"
   └─ Client : "L'expert propose 16/10 à 14h - À valider"
   ↓
5. Client voit dans son espace :
   ┌────────────────────────────────────────┐
   │ ⚠️ RDV à Revalider                     │
   │                                        │
   │ RDV initial : 15/10 à 10h              │
   │ Proposition expert : 16/10 à 14h       │
   │                                        │
   │ [✅ Accepter]  [❌ Refuser]             │
   └────────────────────────────────────────┘
   ↓
6. Client accepte :
   UPDATE ClientRDV SET
     status = 'confirmed',
     scheduled_date = alternative_date,
     scheduled_time = alternative_time,
     client_validation_at = NOW()
   ↓
7. Notifications :
   ├─ Apporteur : "Client a accepté nouvelle date"
   ├─ Expert : "RDV confirmé 16/10 à 14h"
   └─ Client : "Confirmation RDV 16/10 à 14h"
```

---

## ✅ DÉCISIONS FINALES

### Q5 : Table RDV
**✅ RÉPONSE : B - ClientRDV**

**Justification :**
- Vos prospects sont des `Client` avec `status='prospect'`
- Pas de migration nécessaire
- Architecture simplifiée
- Utilisation de `client_id` partout

### Q6 : Lien RDV-Produit
**✅ RÉPONSE : B - Table Liaison `ClientRDV_Produits`**

**Justification :**
- Flexibilité totale (1 RDV = N produits)
- Contraintes référentielles
- Requêtes SQL optimisées
- Métadonnées par produit (notes, priorité, durée)
- Évolutif pour futures fonctionnalités

---

## 🎯 RÉSUMÉ COMPLET DE VOS CHOIX

| # | Question | Réponse | Détails |
|---|----------|---------|---------|
| Q1 | RDV | **B** | Groupé par expert |
| Q2 | Algo expert | **C** | Optimisation intelligente |
| Q3 | Date RDV | **B** | Apporteur propose, expert valide/repropose |
| Q4 | Email | **B** | Après validation expert |
| Q5 | Table RDV | **B** | ClientRDV ✅ |
| Q6 | Lien produit | **B** | Table liaison ClientRDV_Produits ✅ |
| Q7 | Refus | **Reproposition** | Expert propose nouvelle date |
| Q8 | Manuel | **A** | 1 expert par produit |
| Q9 | Mobile | **A** | Scroll vertical |
| Q10 | Auto-save | **C** | Intelligent |

### Workflow Validation RDV
```
Apporteur fixe RDV (proposition)
    ↓
Expert reçoit notification
    ↓
Expert accepte OU propose nouvelle date
    ↓
Si nouvelle date → Client doit valider
    ↓
RDV confirmé → Emails envoyés à tous
```

---

## 🚀 PRÊT POUR IMPLÉMENTATION

**Tous les choix sont validés !**

Je vais maintenant créer :
1. ✅ Migration BDD (table `ClientRDV_Produits`)
2. ✅ Service `ExpertOptimizationService.ts`
3. ✅ Service `ProspectSimulationService.ts`  
4. ✅ 5 routes API backend
5. ✅ 9 composants React
6. ✅ Modification `ProspectForm.tsx`
7. ✅ Templates emails
8. ✅ Dashboard expert
9. ✅ Tests complets

**Confirmation finale : Puis-je commencer l'implémentation maintenant ?** 🚀

