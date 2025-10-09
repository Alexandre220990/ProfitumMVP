# 🎨 PROPOSITION DE DESIGN - Simulation par Apporteur d'Affaires

**Date :** 9 octobre 2025  
**Objectif :** Permettre aux apporteurs de faire une simulation pour leurs prospects lors de l'enregistrement

---

## 📊 ANALYSE DE L'EXISTANT

### Flux Actuel - ProspectForm.tsx (1002 lignes)

**Structure actuelle :**
```
1. Informations Entreprise (company_name, SIREN, adresse, website)
2. Décisionnaire (nom, email, téléphone, poste)
3. Qualification (score, intérêt, budget, timeline)
4. Rendez-vous (type, date, heure, lieu)
5. Produits Éligibles ← SÉLECTION MANUELLE (checkboxes)
   └── Pour chaque produit : notes, priorité, montant estimé
6. Sélection Expert (si produits sélectionnés)
   └── Experts recommandés avec matching de spécialisations
7. Notes
8. Envoi Email ← SYSTÈME DE RADIO BUTTONS EXISTANT
   ├── Option 1: Ne pas envoyer
   ├── Option 2: Email "Échange concluant"
   └── Option 3: Email "Présentation"
9. Boutons : Annuler / Enregistrer
```

---

## 🎯 OBJECTIF DE LA NOUVELLE FONCTIONNALITÉ

### Avant (Actuel)
```
Apporteur → Sélection MANUELLE des produits → Enregistrement
```

### Après (Nouveau)
```
Apporteur → Option A: Sélection MANUELLE (comme avant)
         → Option B: SIMULATION (automatique + précise)
                   ↓
            Formulaire de simulation (questions)
                   ↓
            Produits éligibles IDENTIFIÉS automatiquement
                   ↓
            Experts adaptés à CHAQUE produit
```

---

## 🎨 PROPOSITION DE DESIGN

### ✅ OPTION 1 : TOGGLE SIMULATION (RECOMMANDÉ)

**Positionnement** : Juste AVANT la section "Produits Éligibles"

```tsx
┌─────────────────────────────────────────────────────────────┐
│ 📋 Qualification                                             │
│  [Budget] [Timeline] [Qualification Score] [Intérêt]         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎯 IDENTIFICATION DES BESOINS                     ← NOUVEAU  │
│                                                               │
│ Comment souhaitez-vous identifier les produits éligibles ?   │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚡ Simulation Intelligente (Recommandé)                  │ │
│ │ ○ Questionnaire court (5-8 questions)                   │ │
│ │   → Identification automatique précise                  │ │
│ │   → Experts adaptés à chaque produit                    │ │
│ │   → Économies estimées                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📝 Sélection Manuelle                                    │ │
│ │ ○ Choisir manuellement les produits                     │ │
│ │   → Plus rapide mais moins précis                       │ │
│ │   → Recommandé si vous connaissez déjà les besoins      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SI SIMULATION SÉLECTIONNÉE :                                 │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 Simulation pour [Nom du Prospect]                    │ │
│ │                                                          │ │
│ │ Question 1/8                            [========░░] 80% │ │
│ │                                                          │ │
│ │ 💼 Quel est votre secteur d'activité ?                  │ │
│ │                                                          │ │
│ │ [ ] Agriculture                                         │ │
│ │ [ ] BTP                                                 │ │
│ │ [✓] Transport & Logistique                             │ │
│ │ [ ] Industrie                                           │ │
│ │                                                          │ │
│ │           [← Précédent]    [Suivant →]                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ OU SI SIMULATION TERMINÉE :                                  │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Simulation terminée !                                 │ │
│ │                                                          │ │
│ │ 🎯 3 produits éligibles identifiés                       │ │
│ │ 💰 Économies potentielles : ~45 000€                     │ │
│ │                                                          │ │
│ │ [📝 Modifier la simulation]  [✅ Valider]                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 💼 Produits Éligibles Identifiés         ← TITRE DYNAMIQUE  │
│                                                               │
│ SI SIMULATION FAITE :                                         │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ TICPE                          Score: 92%      🏆 #1  │ │
│ │ Taxe Intérieure de Consommation                         │ │
│ │ 💰 Économies estimées : ~18 000€                         │ │
│ │                                                          │ │
│ │ 👤 Expert recommandé : Jean Dupont ⭐ 4.8               │ │
│ │    Spécialiste TICPE - 45 dossiers réussis              │ │
│ │    [📅 Inviter au RDV]                                  │ │
│ │                                                          │ │
│ │ ▼ Détails (click pour développer)                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ URSSAF                         Score: 85%         #2  │ │
│ │ ...                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ CEE                           Score: 45%              │ │
│ │ Certificats d'Économies d'Énergie                       │ │
│ │ 💰 Économies estimées : ~5 000€                          │ │
│ │ ⚠️ Éligibilité à confirmer avec expert                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ SI PAS DE SIMULATION :                                        │
│                                                               │
│ [ ] TICPE                                                     │
│ [ ] URSSAF                                                    │
│ [ ] CEE                                                       │
│ ... (liste de tous les produits avec checkboxes)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📧 Envoi Email (existant)                                    │
│ ○ Ne pas envoyer                                             │
│ ○ Email "Échange concluant"                                  │
│ ○ Email "Présentation"                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     [Annuler]  [Enregistrer le Prospect]     │
└─────────────────────────────────────────────────────────────┘
```

---

### ✅ OPTION 2 : INTÉGRATION MODALE SÉPARÉE

**Principe** : Checkbox "Faire une simulation" → Ouvre modal séparé

```tsx
┌─────────────────────────────────────────────────────────────┐
│ 💼 Produits Éligibles                                        │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [✓] Faire une simulation pour identifier les produits │   │
│ │                                                        │   │
│ │ 💡 Questionnaire court pour identifier automatiquement│   │
│ │    les produits les plus pertinents                   │   │
│ │                                                        │   │
│ │    [ Démarrer la simulation → ]                        │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ [Liste des produits...]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MODAL SIMULATION                          │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 🎯 Simulation pour [Nom Prospect]               [×]   │   │
│ │                                                        │   │
│ │ [Questions du simulateur UnifiedSimulator]             │   │
│ │                                                        │   │
│ │                       [Valider et Appliquer]           │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## ❓ QUESTIONS IMPORTANTES POUR VOUS

### 1️⃣ **Flux UX Préféré**

**Option A (Recommandée)** : Intégration fluide dans le formulaire
- ✅ Tout sur une seule page, pas de rupture
- ✅ Vision d'ensemble complète
- ✅ Plus rapide pour l'apporteur
- ⚠️ Formulaire plus long

**Option B** : Modal séparée
- ✅ Formulaire principal reste court
- ✅ Simulation isolée, focus total
- ⚠️ Navigation entre modal et formulaire
- ⚠️ Moins de vision d'ensemble

**👉 Quelle option préférez-vous : A ou B ?**

---

### 2️⃣ **Affichage des Experts**

**Scénario 1** : Avec simulation
```
✅ TICPE (Score: 92%)
   → Expert recommandé : Jean Dupont (spécialiste TICPE)
   
✅ URSSAF (Score: 85%)
   → Expert recommandé : Marie Martin (spécialiste URSSAF)
```

**Scénario 2** : Sans simulation
```
Tous les produits affichés
   → 1 expert global pour tous les produits ?
   → OU permettre de choisir 1 expert par produit ?
```

**👉 Comment voulez-vous gérer les experts en mode manuel ?**
- A) 1 seul expert global pour tous les produits
- B) 1 expert par produit
- C) Expert global + possibilité d'override par produit

---

### 3️⃣ **Questions de Simulation**

**Option A** : Questionnaire complet (toutes les questions existantes)
- ✅ Plus précis
- ⚠️ Plus long (10-15 questions)

**Option B** : Questionnaire court (questions clés seulement)
- ✅ Plus rapide (5-8 questions)
- ✅ Meilleure UX pour apporteur
- ⚠️ Moins précis

**Option C** : Pré-remplissage intelligent
- ✅ Utiliser les données déjà saisies (budget, secteur, etc.)
- ✅ Ne demander QUE les questions manquantes
- ✅ Ultra rapide

**👉 Quelle approche préférez-vous : A, B ou C ?**

---

### 4️⃣ **Édition des Résultats**

Après la simulation, l'apporteur peut-il :
- A) **Seulement voir** les résultats (lecture seule)
- B) **Modifier** les produits identifiés (ajouter/retirer)
- C) **Ajuster** les scores/priorités manuellement

**👉 Quel niveau de contrôle voulez-vous donner ?**

---

### 5️⃣ **Persistance des Données**

Si l'apporteur fait une simulation puis quitte le formulaire :
- A) **Tout est perdu** (recommencer)
- B) **Sauvegarde automatique** en brouillon
- C) **Demander confirmation** avant de quitter

**👉 Comment gérer la persistance ?**

---

## 🎨 DESIGN DÉTAILLÉ (Option A - Intégration Fluide)

### Wireframe Complet

```tsx
┌────────────────────────────────────────────────────────────────────────┐
│ 📝 Enregistrer un Prospect                                    [×]      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ [Informations Entreprise - Section standard]                           │
│ [Décisionnaire - Section standard]                                     │
│ [Qualification - Section standard]                                     │
│ [Rendez-vous - Section standard]                                       │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 🎯 IDENTIFICATION DES BESOINS               ← NOUVELLE SECTION  │   │
│ │                                                                  │   │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │   │
│ │ ┃ [●] Simulation Intelligente                  ⚡ RECOMMANDÉ  ┃ │   │
│ │ ┃                                                            ┃ │   │
│ │ ┃ ✨ Questionnaire court adaptatif (5-8 questions)          ┃ │   │
│ │ ┃ ✨ Identification automatique des produits éligibles      ┃ │   │
│ │ ┃ ✨ Scores de pertinence calculés                          ┃ │   │
│ │ ┃ ✨ Experts recommandés par produit                        ┃ │   │
│ │ ┃ ✨ Économies estimées                                     ┃ │   │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │   │
│ │                                                                  │   │
│ │ ┌────────────────────────────────────────────────────────────┐ │   │
│ │ │ [ ] Sélection Manuelle                                     │ │   │
│ │ │                                                            │ │   │
│ │ │ 📝 Choisir manuellement les produits depuis la liste       │ │   │
│ │ │ ⚡ Plus rapide si vous connaissez déjà les besoins        │ │   │
│ │ └────────────────────────────────────────────────────────────┘ │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ═══════════════════════════════════════════════════════════════════    │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ SI SIMULATION SÉLECTIONNÉE :                                     │   │
│ │                                                                  │   │
│ │ ┌──────────────────────────────────────────────────────────┐    │   │
│ │ │ 📊 Questionnaire de Qualification          [1/8] ▓▓▓▓░░░ │    │   │
│ │ │                                                          │    │   │
│ │ │ 💼 Secteur d'activité du prospect                        │    │   │
│ │ │                                                          │    │   │
│ │ │ ┌──────────────────┐  ┌──────────────────┐              │    │   │
│ │ │ │ 🏗️ BTP           │  │ 🚚 Transport     │ [✓]         │    │   │
│ │ │ └──────────────────┘  └──────────────────┘              │    │   │
│ │ │ ┌──────────────────┐  ┌──────────────────┐              │    │   │
│ │ │ │ 🏭 Industrie     │  │ 🌾 Agriculture   │              │    │   │
│ │ │ └──────────────────┘  └──────────────────┘              │    │   │
│ │ │                                                          │    │   │
│ │ │                          [← Précédent]  [Suivant →]     │    │   │
│ │ └──────────────────────────────────────────────────────────┘    │   │
│ │                                                                  │   │
│ │ ... [Questions 2-8] ...                                          │   │
│ │                                                                  │   │
│ │ ┌──────────────────────────────────────────────────────────┐    │   │
│ │ │ ✅ Simulation Terminée !                                 │    │   │
│ │ │                                                          │    │   │
│ │ │ 🎯 Produits Identifiés                                   │    │   │
│ │ │                                                          │    │   │
│ │ │ ✅ 3 produits éligibles                                  │    │   │
│ │ │ ⚠️ 2 produits à confirmer                                │    │   │
│ │ │ ❌ 5 produits non éligibles                              │    │   │
│ │ │                                                          │    │   │
│ │ │ 💰 Total économies potentielles : ~45 000€               │    │   │
│ │ │                                                          │    │   │
│ │ │ [🔄 Refaire]  [✅ Valider ces résultats]                │    │   │
│ │ └──────────────────────────────────────────────────────────┘    │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 💼 Produits Éligibles & Experts Recommandés    ← SECTION ENRICHIE      │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ 🏆 TICPE - Taxe Intérieure                          Score: 92%    │ │
│ │                                                                    │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ 📊 Analyse Automatique                                       │ │ │
│ │ │ ├─ Score d'éligibilité : 92% (Très élevé)                    │ │ │
│ │ │ ├─ Économies estimées : ~18 000€/an                          │ │ │
│ │ │ ├─ Priorité : Haute (Traiter en premier)                     │ │ │
│ │ │ └─ Confiance : 95%                                           │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │                                                                    │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ 👤 Expert Recommandé                                         │ │ │
│ │ │                                                              │ │ │
│ │ │ Jean Dupont ⭐ 4.8/5.0                                      │ │ │
│ │ │ Cabinet Expertise Fiscale                                    │ │ │
│ │ │                                                              │ │ │
│ │ │ ✅ Spécialiste TICPE (98% de match)                          │ │ │
│ │ │ 📈 45 dossiers TICPE réussis                                 │ │ │
│ │ │ ⚡ Disponible sous 24h                                        │ │ │
│ │ │ 🎯 Taux de succès : 94%                                      │ │ │
│ │ │                                                              │ │ │
│ │ │ [✓] Inviter au rendez-vous   [i] Voir profil complet        │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │                                                                    │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ 📝 Notes spécifiques TICPE                                   │ │ │
│ │ │ [____________________________________________________]       │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ✅ URSSAF - Cotisations Sociales                    Score: 85%    │ │
│ │ [Même structure que TICPE]                                        │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ CEE - Certificats Énergie                        Score: 45%    │ │
│ │                                                                    │ │
│ │ ⚠️ Éligibilité à confirmer - Nécessite analyse expert             │ │
│ │ [Ajouter quand même]  [Exclure]                                   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ▼ Afficher les 7 produits non éligibles                                │
└──────────────────────────────────────────────────────────────────────────┘
```

**👉 Voulez-vous :**
- A) Afficher TOUS les produits (éligibles + non éligibles)
- B) Afficher SEULEMENT les produits éligibles (masquer les autres)
- C) Afficher éligibles + possibilité de "tout afficher"

---

### 3️⃣ **Pré-remplissage Intelligent**

Données déjà disponibles dans le formulaire :
- ✅ Budget range
- ✅ Timeline
- ✅ Secteur d'activité (via SIREN lookup potentiel)
- ✅ Nombre d'employés (via qualification)

**👉 Voulez-vous :**
- A) Pré-remplir automatiquement les questions de simulation avec ces données
- B) Demander toutes les questions sans pré-remplissage
- C) Pré-remplir + permettre modification

---

### 4️⃣ **Position de la Section Simulation**

**Option A** : Après Qualification, Avant RDV
```
1. Entreprise
2. Décisionnaire
3. Qualification
4. 🆕 SIMULATION          ← ICI
5. Rendez-vous
6. Produits (résultats simulation)
7. Expert
8. Email
```

**Option B** : Après Qualification, remplace section Produits
```
1. Entreprise
2. Décisionnaire
3. Qualification
4. 🆕 SIMULATION + PRODUITS   ← FUSION
5. Rendez-vous
6. Expert
7. Email
```

**👉 Quelle position préférez-vous ?**

---

### 5️⃣ **Affichage Mobile**

Le ProspectForm sera-t-il utilisé sur mobile/tablette par les apporteurs ?
- Si OUI : Design responsive nécessaire
- Si NON : Optimisation desktop uniquement

**👉 Besoin de responsive ?**

---

## 💎 MA RECOMMANDATION (Design Haut de Gamme)

### 🌟 **Design "Premium Progressive"**

**Concept** : Toggle élégant avec animation progressive

```tsx
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Identification des Produits Éligibles                     │
│                                                               │
│ ┌──────────────────────┬──────────────────────┐              │
│ │ ⚡ Simulation Auto   │ 📝 Sélection Manuelle │              │
│ │ ═══════════════════  │ ─────────────────── │              │
│ │     (active)         │    (inactive)        │              │
│ └──────────────────────┴──────────────────────┘              │
│                                                               │
│ [Contenu dynamique selon le mode]                            │
└───────────────────────────────────────────────────────────────┘
```

**Étapes de la simulation :**
1. **Carte compacte** avec progression horizontale
2. **Questions une par une** avec animation slide
3. **Résultats immédiats** avec confetti animation
4. **Produits enrichis** avec experts + économies

**Palette couleurs :**
- Toggle actif : `bg-gradient-to-r from-blue-600 to-indigo-600`
- Simulation en cours : `bg-gradient-to-br from-blue-50 to-indigo-50`
- Résultats : `bg-gradient-to-br from-green-50 to-emerald-50`
- Experts : `bg-gradient-to-r from-purple-50 to-pink-50` (déjà utilisé)

**Micro-interactions :**
- ✨ Transition fluide toggle → simulation
- ✨ Progress bar animée
- ✨ Produits apparaissent un par un (stagger animation)
- ✨ Badge de score avec effet pulse
- ✨ Hover effects sur experts

---

## 📐 COMPOSANTS À CRÉER

### Nouveaux Composants

1. **`SimulationToggle.tsx`**
   - Toggle simulation/manuelle
   - Animation de transition
   
2. **`EmbeddedSimulator.tsx`**
   - Version compacte de UnifiedSimulator
   - Adapté pour intégration dans formulaire
   - Questions pré-remplies si possible

3. **`SimulationResults.tsx`**
   - Affichage résultats simulation
   - Cards produits enrichies
   - Experts recommandés par produit

4. **`ProductEligibilityCard.tsx`**
   - Card produit avec score
   - Expert recommandé intégré
   - Actions rapides (inviter expert, notes)

5. **`ManualProductSelector.tsx`**
   - Liste produits avec checkboxes (existant)
   - Amélioré avec recherche/filtres

---

## 🔧 MODIFICATIONS BACKEND NÉCESSAIRES

### Nouvelles Routes API

```typescript
// POST /api/apporteur/prospects/:id/simulation
// Créer une simulation pour un prospect (par apporteur)
{
  prospect_id: string,
  answers: Record<string, any>,
  apporteur_id: string
}
→ Retourne : produits éligibles + experts recommandés

// GET /api/apporteur/prospects/:id/simulation
// Récupérer la simulation existante d'un prospect
→ Retourne : simulation + résultats

// PUT /api/apporteur/prospects/:id/simulation
// Mettre à jour la simulation (refaire)
{
  answers: Record<string, any>
}
```

### Modifications Base de Données

**Ajout colonne dans simulations :**
```sql
ALTER TABLE simulations 
ADD COLUMN created_by_apporteur_id UUID REFERENCES ApporteurAffaires(id);

-- Pour identifier les simulations créées par apporteurs
-- vs créées par les clients eux-mêmes
```

---

## 🎨 CODE COULEURS & STATUTS

### Produits Éligibles (avec score)

```tsx
Score >= 80%  → 🏆 Badge OR + Border VERT
                "Hautement éligible"
                bg-gradient-to-r from-green-50 to-emerald-50
                border-green-400

Score 60-79%  → ✅ Badge BLEU + Border BLEU
                "Éligible"
                bg-gradient-to-r from-blue-50 to-indigo-50
                border-blue-400

Score 40-59%  → ⚠️ Badge ORANGE + Border ORANGE
                "À confirmer"
                bg-gradient-to-r from-orange-50 to-amber-50
                border-orange-400

Score < 40%   → ❌ Badge GRIS + Border GRIS
                "Non éligible"
                bg-gray-50
                border-gray-300
```

---

## 🚀 PROPOSITION FINALE

### Flux UX Optimisé

```
1. Apporteur saisit infos de base (entreprise, contact)
   ↓
2. Arrive section "Identification Besoins"
   ├─→ Option A: Active Simulation
   │   ├─→ 5-8 questions pré-remplies
   │   ├─→ Résultats immédiats
   │   └─→ Produits + Experts automatiques
   │
   └─→ Option B: Sélection Manuelle
       └─→ Checkboxes produits (comme actuellement)
   ↓
3. Section Produits s'adapte automatiquement
   ├─→ Si simulation : Cards enrichies avec scores + experts
   └─→ Si manuelle : Checkboxes simples
   ↓
4. RDV + Email (sections standards)
   ↓
5. Enregistrement
   └─→ Création Client + Simulation + ClientProduitEligible
```

---

## ❓ QUESTIONS CLÉS POUR FINALISER

Avant de commencer l'implémentation, j'ai besoin de vos réponses :

1. **Flux UX** : Option A (intégré) ou B (modal) ?
2. **Questions** : Questionnaire complet, court, ou pré-rempli ?
3. **Experts** : 1 global ou 1 par produit en mode manuel ?
4. **Affichage produits** : Tous, seulement éligibles, ou avec toggle ?
5. **Édition résultats** : Lecture seule ou modifiable ?
6. **Position** : Avant RDV ou fusion avec Produits ?
7. **Mobile** : Responsive nécessaire ?

**Répondez avec vos préférences et je crée l'implémentation complète !** 🚀

