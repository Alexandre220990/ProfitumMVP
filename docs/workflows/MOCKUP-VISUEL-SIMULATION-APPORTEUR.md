# 🎨 MOCKUP VISUEL - Simulation par Apporteur

---

## 📱 VUE D'ENSEMBLE

### État 1 : Formulaire Initial (Toggle Choix)

```
╔═══════════════════════════════════════════════════════════════════════╗
║  📝 Enregistrer un Prospect                                    [×]    ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  [... Sections Entreprise, Décisionnaire, Qualification ...]          ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │ 🎯 Identification des Produits Éligibles                     │    ║
║  │                                                              │    ║
║  │  Comment identifier les besoins de ce prospect ?             │    ║
║  │                                                              │    ║
║  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┌────────────────────────┐ │    ║
║  │  ┃ ⚡ Simulation Automatique  ┃ │ 📝 Sélection Manuelle  │ │    ║
║  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ └────────────────────────┘ │    ║
║  │     Gradient Bleu (actif)         Gris clair (inactif)     │    ║
║  │                                                              │    ║
║  │  ┌────────────────────────────────────────────────────────┐ │    ║
║  │  │ 💡 Recommandé pour une identification précise          │ │    ║
║  │  │                                                        │ │    ║
║  │  │ ✨ Questionnaire court (5-8 questions)                 │ │    ║
║  │  │ ✨ Calcul automatique des scores d'éligibilité         │ │    ║
║  │  │ ✨ Experts recommandés par produit                     │ │    ║
║  │  │ ✨ Économies estimées                                  │ │    ║
║  │  │                                                        │ │    ║
║  │  │           [ ▶ Démarrer la Simulation ]                 │ │    ║
║  │  └────────────────────────────────────────────────────────┘ │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

### État 2 : Simulation en Cours

```
╔═══════════════════════════════════════════════════════════════════════╗
║  🎯 Identification des Produits Éligibles                             ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │ 📊 Simulation pour Transport Express SARL                    │    ║
║  │                                                              │    ║
║  │  Question 3/8                   ████████████░░░░░░   75%    │    ║
║  │                                                              │    ║
║  │  ┌────────────────────────────────────────────────────────┐ │    ║
║  │  │                                                        │ │    ║
║  │  │  🚚 Combien de véhicules possède votre entreprise ?   │ │    ║
║  │  │                                                        │ │    ║
║  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │    ║
║  │  │  │ 1-5          │  │ 6-20         │  │ 21-50        │ │ │    ║
║  │  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │    ║
║  │  │  ┌──────────────┐  ┌──────────────┐                   │ │    ║
║  │  │  │ 51-100       │  │ 100+         │ [●]              │ │    ║
║  │  │  └──────────────┘  └──────────────┘                   │ │    ║
║  │  │                                                        │ │    ║
║  │  └────────────────────────────────────────────────────────┘ │    ║
║  │                                                              │    ║
║  │                 [← Précédent]        [Suivant →]            │    ║
║  │                                                              │    ║
║  │  💡 Réponses déjà enregistrées : 2/8                         │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

### État 3 : Résultats de Simulation

```
╔═══════════════════════════════════════════════════════════════════════╗
║  🎯 Identification des Produits Éligibles                             ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │ ✅ Simulation Terminée !                  🎉                  │    ║
║  │                                                              │    ║
║  │  📊 Résultats pour Transport Express SARL                    │    ║
║  │                                                              │    ║
║  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    ║
║  │  │ 🏆 3     │  │ ⚠️ 2     │  │ ❌ 5     │  │ 💰 45k€  │    │    ║
║  │  │ Éligible │  │ À vérif. │  │ Non élig.│  │ Économies│    │    ║
║  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │    ║
║  │                                                              │    ║
║  │              [🔄 Refaire]  [✅ Valider les Résultats]        │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────────────────┐
│ 💼 Produits Éligibles & Experts                                        │
│                                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ 🏆 TICPE - Remboursement Carburant             Score: 92% 🌟    │  │
│ │                                                                  │  │
│ │ ┌──────────────────────────────────────────────────────────┐    │  │
│ │ │ 📈 Analyse Intelligente                                  │    │  │
│ │ │ ├─ Éligibilité : 92% (Très élevé) 🔥                     │    │  │
│ │ │ ├─ Économies : ~18 000€/an 💰                            │    │  │
│ │ │ ├─ Priorité : Haute (traiter en premier) ⚡              │    │  │
│ │ │ └─ Confiance : 95%                                       │    │  │
│ │ └──────────────────────────────────────────────────────────┘    │  │
│ │                                                                  │  │
│ │ ┌──────────────────────────────────────────────────────────┐    │  │
│ │ │ 👤 Expert Recommandé                                     │    │  │
│ │ │                                                          │    │  │
│ │ │  ┌─────┐  Jean Dupont                     ⭐ 4.8/5.0    │    │  │
│ │ │  │ 🧑‍💼 │  Cabinet Expertise Fiscale                      │    │  │
│ │ │  └─────┘                                                 │    │  │
│ │ │                                                          │    │  │
│ │ │  ✅ Spécialiste TICPE (Match: 98%)                        │    │  │
│ │ │  📊 45 dossiers TICPE réussis                            │    │  │
│ │ │  ⚡ Disponible sous 24h                                   │    │  │
│ │ │  🎯 Taux de succès : 94%                                 │    │  │
│ │ │                                                          │    │  │
│ │ │  [✓ Inviter au RDV]  [i Profil Complet]                 │    │  │
│ │ └──────────────────────────────────────────────────────────┘    │  │
│ │                                                                  │  │
│ │ ┌──────────────────────────────────────────────────────────┐    │  │
│ │ │ 📝 Notes TICPE                                           │    │  │
│ │ │ [_____________________________________________]          │    │  │
│ │ └──────────────────────────────────────────────────────────┘    │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ ✅ URSSAF - Cotisations Sociales                Score: 85% 🔥   │  │
│ │ [Même structure]                                                 │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ ⚠️ CEE - Certificats Énergie                    Score: 45%      │  │
│ │                                                                  │  │
│ │ ⚠️ Éligibilité à confirmer avec expert                           │  │
│ │                                                                  │  │
│ │ 👤 Expert Généraliste : Pierre Durand ⭐ 4.5                     │  │
│ │    Peut affiner l'analyse                                        │  │
│ │                                                                  │  │
│ │    [✓ Inclure quand même]  [× Exclure]                          │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│ ▼ Voir les 5 produits non éligibles                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 PALETTE COULEURS

### Simulation Toggle
```css
/* Actif (Simulation) */
background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)
border: 2px solid #3b82f6
shadow: 0 4px 12px rgba(59, 130, 246, 0.3)
text: white

/* Inactif */
background: white
border: 2px solid #e2e8f0
text: #64748b
hover: border-color: #cbd5e1
```

### Zones de Simulation
```css
/* En cours */
background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)
border: 2px solid #bfdbfe

/* Terminée */
background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)
border: 2px solid #6ee7b7
```

### Cards Produits (selon score)
```css
/* Score >= 80% - Hautement Éligible */
background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)
border-left: 4px solid #10b981
badge: bg-green-600 text-white

/* Score 60-79% - Éligible */
background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)
border-left: 4px solid #3b82f6
badge: bg-blue-600 text-white

/* Score 40-59% - À Confirmer */
background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)
border-left: 4px solid #f59e0b
badge: bg-orange-600 text-white

/* Score < 40% - Non Éligible */
background: #f8fafc
border-left: 4px solid #cbd5e1
badge: bg-gray-500 text-white
```

---

## 🎬 ANIMATIONS

### 1. Transition Toggle
```tsx
// Slide gauche → droite avec fade
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)

// Simulateur apparaît
opacity: 0 → 1
transform: translateY(20px) → translateY(0)
duration: 0.4s
```

### 2. Questions de Simulation
```tsx
// Slide entre questions
transform: translateX(-100%) → translateX(0)
opacity: 0 → 1
duration: 0.3s
```

### 3. Résultats Produits
```tsx
// Apparition staggered (décalée)
Product 1: delay 0ms
Product 2: delay 100ms
Product 3: delay 200ms
...

// Animation
opacity: 0 → 1
transform: translateY(20px) → translateY(0)
```

### 4. Badge Score
```tsx
// Pulse pour scores élevés
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite

// Seulement si score >= 80%
```

---

## 📊 COMPOSANTS DÉTAILLÉS

### 1. Toggle Simulation/Manuelle

```tsx
<div className="bg-white rounded-xl border-2 border-gray-200 p-6">
  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
    <Target className="h-6 w-6 text-blue-600" />
    Identification des Produits Éligibles
  </h3>
  
  <p className="text-gray-600 mb-6">
    Comment souhaitez-vous identifier les besoins de ce prospect ?
  </p>
  
  {/* Toggle Tabs */}
  <div className="flex gap-3 mb-6">
    <button
      onClick={() => setMode('simulation')}
      className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
        mode === 'simulation'
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <Zap className="h-5 w-5" />
        Simulation Automatique
      </div>
    </button>
    
    <button
      onClick={() => setMode('manual')}
      className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
        mode === 'manual'
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <List className="h-5 w-5" />
        Sélection Manuelle
      </div>
    </button>
  </div>
  
  {/* Contenu dynamique */}
  {mode === 'simulation' ? <SimulatorPanel /> : <ManualSelector />}
</div>
```

---

### 2. Panel Simulateur Intégré

```tsx
<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
  {!simulationStarted ? (
    // État initial
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Sparkles className="h-8 w-8 text-blue-600" />
        <h4 className="text-2xl font-bold text-gray-900">
          Simulation Intelligente
        </h4>
      </div>
      
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-sm">5-8 questions</p>
          <p className="text-xs text-gray-600">Questionnaire court</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="font-semibold text-sm">Identification auto</p>
          <p className="text-xs text-gray-600">Produits pertinents</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="font-semibold text-sm">Experts adaptés</p>
          <p className="text-xs text-gray-600">Par produit</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <Euro className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-sm">Économies estimées</p>
          <p className="text-xs text-gray-600">Calcul précis</p>
        </div>
      </div>
      
      <Button 
        size="lg" 
        className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600"
        onClick={() => setSimulationStarted(true)}
      >
        <Play className="h-5 w-5 mr-2" />
        Démarrer la Simulation
      </Button>
      
      <p className="text-sm text-gray-500">
        💡 Les données déjà saisies seront pré-remplies
      </p>
    </div>
  ) : simulationCompleted ? (
    // Résultats
    <SimulationResults />
  ) : (
    // Questions
    <SimulationQuestions />
  )}
</div>
```

---

### 3. Card Produit Éligible (avec Expert)

```tsx
<Card className="overflow-hidden">
  {/* Header avec score */}
  <div className={`p-4 border-l-4 ${getScoreColor(product.score)}`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="text-lg font-bold text-gray-900">
            {product.nom}
          </h4>
          <Badge className={getScoreBadgeClass(product.score)}>
            {product.score >= 80 && '🏆 '}
            Score: {product.score}%
          </Badge>
          <Badge variant="outline">
            #{product.priority}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{product.description}</p>
      </div>
    </div>
    
    {/* Économies */}
    <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg">
      <Euro className="h-5 w-5 text-green-600" />
      <div>
        <p className="text-sm font-semibold text-green-900">
          Économies estimées : ~{product.estimatedSavings.toLocaleString()}€/an
        </p>
        <p className="text-xs text-green-700">
          Basé sur le profil du prospect
        </p>
      </div>
    </div>
    
    {/* Expert recommandé */}
    {product.recommendedExpert && (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-5 w-5 text-purple-600" />
          <p className="font-semibold text-gray-900">Expert Recommandé</p>
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
            <User className="h-6 w-6 text-purple-700" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {product.recommendedExpert.name}
            </p>
            <p className="text-sm text-gray-600">
              {product.recommendedExpert.company_name}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
            <Star className="h-4 w-4 text-yellow-600 fill-current" />
            <span className="font-bold text-sm">
              {product.recommendedExpert.rating}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex items-center gap-1 text-gray-700">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Match: {product.recommendedExpert.matchScore}%
          </div>
          <div className="flex items-center gap-1 text-gray-700">
            <FileText className="h-4 w-4 text-blue-600" />
            {product.recommendedExpert.completedDossiers} dossiers
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="default"
            className="flex-1"
            onClick={() => inviteExpertToMeeting(product.recommendedExpert.id)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter au RDV
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => viewExpertProfile(product.recommendedExpert.id)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )}
    
    {/* Actions */}
    <div className="mt-4 flex gap-2">
      <Button size="sm" variant="ghost" className="text-xs">
        <ChevronDown className="h-4 w-4 mr-1" />
        Voir détails complets
      </Button>
    </div>
  </div>
</Card>
```

---

## 🔄 ÉTATS & TRANSITIONS

### Diagramme de Flux

```
┌─────────────┐
│  Formulaire │
│   Prospect  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────┐
│ Section: Identification Besoins  │
│                                  │
│  [ Simulation ] [ Manuelle ]    │ ← Toggle
└────┬──────────────────┬──────────┘
     │                  │
     │                  │
     ▼                  ▼
┌─────────────┐   ┌─────────────┐
│ Simulation  │   │  Sélection  │
│ Intelligence│   │  Checkboxes │
└──────┬──────┘   └──────┬──────┘
       │                  │
       ▼                  │
┌─────────────┐           │
│ Questions   │           │
│ (5-8)       │           │
└──────┬──────┘           │
       │                  │
       ▼                  │
┌─────────────┐           │
│ Calcul      │           │
│ Éligibilité │           │
└──────┬──────┘           │
       │                  │
       ▼                  ▼
┌──────────────────────────────────┐
│ Produits + Experts Recommandés   │
│                                  │
│ ✅ TICPE (92%) → Expert A         │
│ ✅ URSSAF (85%) → Expert B        │
│ ⚠️ CEE (45%) → Expert C          │
└────────────┬─────────────────────┘
             │
             ▼
┌────────────────────────┐
│ Validation & Création  │
│ - Client               │
│ - Simulation           │
│ - ClientProduitEligible│
│ - Experts assignés     │
└────────────────────────┘
```

---

## 💻 STRUCTURE TECHNIQUE

### Nouveaux États React

```typescript
// Dans ProspectForm.tsx
const [identificationMode, setIdentificationMode] = useState<'simulation' | 'manual'>('simulation');
const [simulationStarted, setSimulationStarted] = useState(false);
const [simulationCompleted, setSimulationCompleted] = useState(false);
const [simulationAnswers, setSimulationAnswers] = useState<Record<number, string[]>>({});
const [identifiedProducts, setIdentifiedProducts] = useState<ClientProduitEligibleWithExpert[]>([]);
const [currentSimulationStep, setCurrentSimulationStep] = useState(0);
```

### Nouveaux Types

```typescript
interface ClientProduitEligibleWithExpert {
  produit: {
    id: string;
    nom: string;
    description: string;
    categorie: string;
  };
  eligibility: {
    score: number;
    isEligible: boolean;
    priority: 'high' | 'medium' | 'low';
    estimatedSavings: number;
    confidence: number;
  };
  recommendedExpert?: {
    id: string;
    name: string;
    company_name: string;
    rating: number;
    matchScore: number;
    specializations: string[];
    completedDossiers: number;
    availability: string;
    invited: boolean;
  };
  metadata: {
    source: 'simulation' | 'manual';
    simulation_id?: string;
    satisfied_rules?: number;
    total_rules?: number;
  };
  notes?: string;
}
```

---

## 🎯 ÉTAPES D'IMPLÉMENTATION

### Phase 1 : Backend (API)
1. ✅ Route création simulation par apporteur
2. ✅ Logique récupération experts par produit
3. ✅ Endpoint matching expert-produit

### Phase 2 : Frontend (Composants)
1. ✅ Composant SimulationToggle
2. ✅ Composant EmbeddedSimulator
3. ✅ Composant ProductEligibilityCard
4. ✅ Composant ExpertRecommendation

### Phase 3 : Intégration
1. ✅ Modifier ProspectForm.tsx
2. ✅ Gérer états simulation
3. ✅ Liaison produits → experts
4. ✅ Sauvegarde complète

---

## 🎁 FONCTIONNALITÉS BONUS

### 1. Pré-visualisation Email
```
💡 Aperçu de l'email qui sera envoyé au prospect avec :
   - Résultats de simulation
   - Produits identifiés
   - Expert(s) assigné(s)
   - Lien vers RDV
```

### 2. Export PDF Résultats
```
📄 Générer PDF avec :
   - Résumé simulation
   - Produits éligibles
   - Économies estimées
   - Prochaines étapes
```

### 3. Analytics Temps Réel
```
📊 Pour l'apporteur :
   - Taux de conversion simulation → signature
   - Produits les plus identifiés
   - Temps moyen simulation
```

---

## ❓ VOS DÉCISIONS NÉCESSAIRES

Merci de répondre à ces questions pour que je puisse implémenter :

**UX & Design :**
1. Flux : Option A (intégré) ou B (modal) ?
2. Position : Avant RDV ou fusion avec Produits ?
3. Responsive : Nécessaire ou desktop only ?

**Fonctionnel :**
4. Questions : Complet, court, ou pré-rempli intelligent ?
5. Experts : 1 par produit automatique ou global manuel ?
6. Affichage produits : Tous, seulement éligibles, ou toggle ?
7. Édition : Résultats lecture seule ou modifiables ?

**Technique :**
8. Persistance : Sauvegarde auto ou pas ?
9. Email : Inclure résultats simulation dans l'email prospect ?
10. Export : PDF des résultats utile ?

**Répondez simplement avec les numéros : "1-A, 2-A, 3-Oui, etc."** 

Je crée ensuite l'implémentation complète ! 🚀

