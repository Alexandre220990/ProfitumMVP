# 🎯 GUIDE D'INTÉGRATION TICPE AVEC LOGIQUE CONDITIONNELLE

## 📋 Vue d'ensemble

Ce guide détaille l'intégration complète du simulateur TICPE avec une logique conditionnelle avancée qui permet de masquer automatiquement les questions non pertinentes selon les réponses de l'utilisateur.

## 🏗️ Architecture de la solution

### **1. Structure des données**

```sql
-- Table des questions avec conditions
CREATE TABLE QuestionnaireQuestion (
    id uuid PRIMARY KEY,
    question_id text UNIQUE,           -- TICPE_001, TICPE_002, etc.
    question_order integer,
    question_text text,
    question_type text,                -- choix_unique, choix_multiple, nombre
    options jsonb,                     -- Options de réponse
    validation_rules jsonb,            -- Règles de validation
    conditions jsonb,                  -- Conditions d'affichage
    produits_cibles text[],            -- ['TICPE']
    phase integer                      -- Phase du questionnaire
);
```

### **2. Logique conditionnelle**

```typescript
// Structure des conditions
interface QuestionCondition {
  depends_on: {
    question_id: string;      // Question de référence
    answer: string | string[]; // Réponse attendue
    operator?: '=' | '!=' | 'in' | 'not_in';
  };
}

// Exemple TICPE
{
  question_id: 'TICPE_004',
  conditions: {
    depends_on: { 
      question_id: 'TICPE_003', 
      answer: "Oui" 
    }
  }
}
```

## 🔄 Flux de logique conditionnelle

### **Question clé : "Possédez-vous des véhicules professionnels ?" (TICPE_003)**

```
TICPE_003: "Possédez-vous des véhicules professionnels ?"
├── Réponse "Oui" → Afficher toutes les questions véhicules
│   ├── TICPE_004: "Combien de véhicules ?"
│   ├── TICPE_005: "Types de véhicules ?"
│   ├── TICPE_006: "Chronotachygraphe ?"
│   ├── TICPE_007: "Consommation carburant ?"
│   ├── TICPE_008: "Types de carburant ?"
│   ├── TICPE_009: "Factures carburant ?"
│   ├── TICPE_010: "Usage professionnel ?"
│   ├── TICPE_011: "Kilométrage annuel ?"
│   ├── TICPE_012: "Cartes carburant ?"
│   ├── TICPE_013: "Factures nominatives ?"
│   ├── TICPE_014: "Immatriculation société ?"
│   └── TICPE_015: "Déclaration TICPE ?"
│
└── Réponse "Non" → Masquer toutes les questions véhicules
    └── Passer directement aux questions finales
        ├── TICPE_016: "Projets d'optimisation ?"
        └── TICPE_017: "Objectifs prioritaires ?"
```

## 🛠️ Implémentation technique

### **1. Hook de logique conditionnelle**

```typescript
// client/src/hooks/use-questionnaire-logic.ts
export function useQuestionnaireLogic({
  questions,
  initialResponses = {}
}: UseQuestionnaireLogicProps) {
  // Évalue les conditions selon les réponses
  const evaluateCondition = useCallback((condition: QuestionCondition): boolean => {
    if (!condition.depends_on) return true;
    
    const { question_id, answer, operator = '=' } = condition.depends_on;
    const responseValue = responses[question_id];
    
    switch (operator) {
      case '=': return responseValue === answer;
      case '!=': return responseValue !== answer;
      case 'in': return Array.isArray(answer) && answer.includes(responseValue);
      default: return responseValue === answer;
    }
  }, [responses]);

  // Filtre les questions selon les conditions
  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      if (!question.conditions) return true;
      return evaluateCondition(question.conditions);
    }).sort((a, b) => a.question_order - b.question_order);
  }, [questions, evaluateCondition]);

  return {
    filteredQuestions,
    responses,
    addResponse,
    updateResponse,
    isQuestionVisible,
    isQuestionRequired,
    progress,
    isQuestionnaireComplete
  };
}
```

### **2. Composant de questionnaire intelligent**

```typescript
// client/src/components/IntelligentQuestionnaire.tsx
export function IntelligentQuestionnaire({
  questions,
  onComplete,
  initialResponses = {}
}: IntelligentQuestionnaireProps) {
  const {
    filteredQuestions,
    responses,
    updateResponse,
    isQuestionVisible,
    progress,
    isQuestionnaireComplete
  } = useQuestionnaireLogic({ questions, initialResponses });

  // Auto-avancement pour TICPE_003
  const handleResponse = (value: any) => {
    updateResponse(currentQuestion.question_id, value);
    
    // Si pas de véhicules, passer aux questions finales
    if (currentQuestion.question_id === 'TICPE_003' && value === 'Non') {
      setTimeout(() => {
        const finalQuestions = filteredQuestions.filter(q => 
          q.phase === 6 || q.question_id === 'TICPE_016' || q.question_id === 'TICPE_017'
        );
        if (finalQuestions.length > 0) {
          setCurrentQuestionIndex(finalQuestions[0].question_order - 1);
        }
      }, 500);
    }
  };

  return (
    <div>
      {/* Barre de progression */}
      <Progress value={progress} />
      
      {/* Question actuelle */}
      <Card>
        <CardHeader>
          <CardTitle>{currentQuestion.question_text}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderQuestion(currentQuestion)}
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={handlePrevious}>Précédent</Button>
        <Button onClick={handleNext}>Suivant</Button>
      </div>
    </div>
  );
}
```

### **3. Service de données**

```typescript
// client/src/services/questionnaireService.ts
export class QuestionnaireService {
  // Charger les questions TICPE
  static async loadTICPEQuestions(): Promise<QuestionnaireQuestion[]> {
    const { data, error } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .contains('produits_cibles', ['TICPE'])
      .order('question_order', { ascending: true });
    
    return data || [];
  }

  // Vérifier si une question est visible
  static isQuestionVisible(
    question: QuestionnaireQuestion,
    responses: Record<string, any>
  ): boolean {
    if (!question.conditions?.depends_on) return true;
    
    const { question_id, answer, operator = '=' } = question.conditions.depends_on;
    const responseValue = responses[question_id];
    
    switch (operator) {
      case '=': return responseValue === answer;
      case '!=': return responseValue !== answer;
      case 'in': return Array.isArray(answer) && answer.includes(responseValue);
      default: return responseValue === answer;
    }
  }
}
```

## 🧪 Tests et validation

### **1. Script de test automatisé**

```bash
# Tester l'intégration complète
node server/scripts/test-ticpe-integration.js
```

Ce script vérifie :
- ✅ Présence des questions TICPE
- ✅ Logique conditionnelle fonctionnelle
- ✅ Sauts de questions selon les réponses
- ✅ Cohérence des phases
- ✅ Questions requises

### **2. Cas de test**

#### **Cas 1 : Utilisateur sans véhicules**
```typescript
const responses = {
  'TICPE_003': 'Non',  // Pas de véhicules
  'TICPE_016': ['CIR', 'URSSAF'],  // Questions finales
  'TICPE_017': ['Réduire les coûts']
};

// Questions visibles : TICPE_001, TICPE_002, TICPE_003, TICPE_016, TICPE_017
// Questions masquées : TICPE_004 à TICPE_015
```

#### **Cas 2 : Utilisateur avec véhicules**
```typescript
const responses = {
  'TICPE_003': 'Oui',  // Avec véhicules
  'TICPE_004': '4 à 10 véhicules',
  'TICPE_005': ['Camions > 7,5t'],
  // ... toutes les questions véhicules
};

// Questions visibles : Toutes (TICPE_001 à TICPE_017)
// Questions masquées : Aucune
```

## 🚀 Déploiement et utilisation

### **1. Intégration dans le simulateur existant**

```typescript
// client/src/pages/simulateur-eligibilite.tsx
import { IntelligentQuestionnaire } from '../components/IntelligentQuestionnaire';
import { QuestionnaireService } from '../services/questionnaireService';

export default function SimulateurEligibilite() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const ticpeQuestions = await QuestionnaireService.loadTICPEQuestions();
        setQuestions(ticpeQuestions);
      } catch (error) {
        console.error('Erreur chargement questions:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadQuestions();
  }, []);

  const handleComplete = async (responses: Record<string, any>) => {
    // Traitement des réponses
    console.log('Réponses complètes:', responses);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <IntelligentQuestionnaire
      questions={questions}
      onComplete={handleComplete}
      showProgress={true}
      showNavigation={true}
    />
  );
}
```

### **2. Configuration des variables d'environnement**

```bash
# .env
SUPABASE_URL=https://gvvlstubqfxdzltldunj.supabase.co
SUPABASE_ANON_KEY=votre_clé_anon_supabase
DATABASE_URL=postgresql://postgres:[password]@db.gvvlstubqfxdzltldunj.supabase.co:5432/postgres
```

### **3. Mise à jour de la base de données**

```bash
# Exécuter le script de mise à jour
./server/scripts/update-ticpe-simulator.sh
```

## 📊 Métriques et monitoring

### **1. Statistiques de parcours**

```typescript
// Statistiques des questions TICPE
const stats = await QuestionnaireService.getTICPEStats();
console.log({
  totalQuestions: stats.totalQuestions,        // 17
  questionsByPhase: stats.questionsByPhase,   // {1: 2, 2: 4, 3: 3, 4: 2, 5: 5, 6: 2}
  requiredQuestions: stats.requiredQuestions   // 15
});
```

### **2. Tracking des sauts de questions**

```typescript
// Événements à tracker
trackEvent('question_skipped', {
  question_id: 'TICPE_004',
  reason: 'no_vehicles',
  depends_on: 'TICPE_003'
});

trackEvent('question_answered', {
  question_id: 'TICPE_003',
  answer: 'Non',
  skipped_questions: ['TICPE_004', 'TICPE_005', '...']
});
```

## 🔧 Maintenance et évolutions

### **1. Ajout de nouvelles conditions**

```typescript
// Exemple : condition sur le secteur d'activité
{
  question_id: 'TICPE_SPECIAL',
  conditions: {
    depends_on: {
      question_id: 'TICPE_001',
      answer: ['Transport routier de marchandises', 'BTP / Travaux publics'],
      operator: 'in'
    }
  }
}
```

### **2. Modification des règles existantes**

```sql
-- Modifier une condition existante
UPDATE QuestionnaireQuestion
SET conditions = '{"depends_on": {"question_id": "TICPE_003", "answer": "Oui", "operator": "="}}'
WHERE question_id = 'TICPE_004';
```

### **3. Ajout de nouveaux opérateurs**

```typescript
// Dans useQuestionnaireLogic.ts
switch (operator) {
  case '=': return responseValue === answer;
  case '!=': return responseValue !== answer;
  case 'in': return Array.isArray(answer) && answer.includes(responseValue);
  case 'not_in': return Array.isArray(answer) && !answer.includes(responseValue);
  case '>': return Number(responseValue) > Number(answer);
  case '<': return Number(responseValue) < Number(answer);
  case 'contains': return String(responseValue).includes(String(answer));
  default: return responseValue === answer;
}
```

## 🎯 Avantages de cette approche

### **1. Expérience utilisateur optimisée**
- ✅ Questions pertinentes uniquement
- ✅ Parcours raccourci pour les non-éligibles
- ✅ Progression logique et fluide
- ✅ Réduction de l'abandon

### **2. Maintenance facilitée**
- ✅ Conditions centralisées en base
- ✅ Modifications sans redéploiement
- ✅ Tests automatisés
- ✅ Documentation intégrée

### **3. Extensibilité**
- ✅ Réutilisable pour d'autres produits
- ✅ Opérateurs conditionnels extensibles
- ✅ Intégration facile avec l'existant
- ✅ Évolutivité garantie

## 🚀 Prochaines étapes

1. **Déploiement** : Exécuter le script de mise à jour
2. **Tests** : Valider avec des utilisateurs réels
3. **Optimisation** : Ajuster les conditions selon les retours
4. **Extension** : Appliquer aux autres produits (URSSAF, DFS, etc.)

---

**🎉 L'intégration TICPE avec logique conditionnelle est maintenant complète et prête pour la production !** 