# 🔍 Debug - Calculate Eligibility Erreur 400

## Problème
L'endpoint `/api/simulator/calculate-eligibility` retourne 400 mais les logs ne montrent pas l'appel.

## Actions de Debug

### 1. Vérifier les Logs Railway Complets
Dans Railway Dashboard → Logs, cherchez spécifiquement:
```
🎯 Calcul d'éligibilité pour la session: 99763d96...
```

**Si ce log n'apparaît PAS:**
- La route n'est pas appelée OU
- La route crash avant le premier console.log

### 2. Tester Directement l'Endpoint

Utilisez la console du navigateur sur https://www.profitum.app:

```javascript
// Dans la console Chrome
const sessionToken = '99763d96-3f02-4538-ba3d-e71e9d86df46'; // Votre session actuelle

fetch('https://profitummvp-production.up.railway.app/api/simulator/calculate-eligibility', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session_token: sessionToken
  })
})
.then(res => res.json())
.then(data => console.log('Réponse:', data))
.catch(err => console.error('Erreur:', err));
```

**Regardez la réponse exacte:**
- Si `"error": "session_token est requis"` → Problème de body
- Si `"error": "Simulation non trouvée"` → session_token invalide
- Si `"error": "Aucune réponse trouvée"` → answers vide
- Si autre chose → me le donner

### 3. Vérifier la Simulation dans la BDD

```sql
SELECT 
  id,
  session_token,
  status,
  jsonb_pretty(answers) as answers,
  jsonb_object_keys(answers) as question_count
FROM simulations
WHERE session_token = '99763d96-3f02-4538-ba3d-e71e9d86df46';
```

**Vérifiez:**
- ✅ answers n'est PAS vide `{}`
- ✅ answers contient bien les UUIDs des questions
- ✅ status est 'en_cours' (pas 'completed' avant l'appel)

### 4. Erreur Possible: Conversion UUID

L'endpoint fait:
```typescript
const questions = await supabase
  .from('QuestionnaireQuestion')
  .select('id, question_id')
  .in('id', Object.keys(simulation.answers));
```

**Si aucune question n'est trouvée:**
- Les UUIDs dans answers ne correspondent à aucune QuestionnaireQuestion
- La conversion échoue → answers devient `{}`
- Le check retourne 400: "Aucune réponse trouvée"

**Test SQL:**
```sql
-- Vérifier que les UUIDs correspondent
SELECT 
  id,
  question_id,
  question_text
FROM "QuestionnaireQuestion"
WHERE id IN (
  'a65a9d33-0b7c-4acb-938a-de410a6587da',
  'b61e0e88-b405-4066-9422-94de061970bd'
  -- etc... tous vos UUIDs
);
```

Si AUCUN résultat → c'est ça le problème !


