# 🧪 Guide d'Utilisation du Script de Test

## Script: `test-simulation-complete.js`

Ce script teste automatiquement tout le flux de simulation :
1. ✅ Connexion client
2. ✅ Création simulation
3. ✅ Récupération questions
4. ✅ Génération réponses (profil Transport)
5. ✅ Sauvegarde réponses
6. ✅ Finalisation simulation
7. ✅ Vérification ClientProduitEligible créés

---

## 🚀 Exécution

### Prérequis
```bash
# 1. Variables d'environnement configurées dans .env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
API_URL=http://localhost:3000  # ou votre URL
```

### Lancer le test
```bash
# Assurez-vous que le serveur tourne
npm run dev

# Dans un autre terminal, lancer le test
node test-simulation-complete.js
```

---

## 📊 Résultat Attendu

```
================================================================================
🧪 DÉMARRAGE DU TEST COMPLET DE SIMULATION
================================================================================

ℹ️  Connexion du client de test...
✅ Client connecté: Test Client

ℹ️  Création de la simulation...
✅ Simulation créée: ID 123

ℹ️  Récupération des questions...
✅ 15 questions récupérées

ℹ️  Génération des réponses de test...
✅ Réponses générées pour 9 questions

ℹ️  Sauvegarde des réponses...
✅ Réponses sauvegardées

ℹ️  Finalisation de la simulation...
✅ Simulation terminée et traitée

ℹ️  Vérification des données de simulation...
📋 Détails de la simulation:
   ID: 123
   Client: abc-123-def
   Status: completed
   Créée le: 17/10/2025 10:30:00
   Produits évalués: 9
   Produits éligibles: 5
✅ Données de simulation vérifiées

ℹ️  Vérification des ClientProduitEligible créés...

================================================================================
📊 RÉSULTATS DE LA SIMULATION
================================================================================

✅ PRODUITS ÉLIGIBLES (5)
--------------------------------------------------------------------------------

1. TICPE
   📈 Gain estimé: 15 000€
   ⏱️  Durée: 12 mois
   ⭐ Priorité: 1
   💯 Score: 100.0%

2. Chronotachygraphes digitaux
   📈 Gain estimé: 3 000€
   ⏱️  Durée: 12 mois
   ⭐ Priorité: 2
   💯 Score: 100.0%

3. DFS
   📈 Gain estimé: 8 000€
   ⏱️  Durée: 12 mois
   ⭐ Priorité: 3
   💯 Score: 100.0%

4. URSSAF
   📈 Gain estimé: 5 000€
   ⏱️  Durée: 12 mois
   ⭐ Priorité: 4
   💯 Score: 100.0%

5. Optimisation Énergie
   📈 Gain estimé: 4 000€
   ⏱️  Durée: 12 mois
   ⭐ Priorité: 5
   💯 Score: 100.0%

❌ PRODUITS NON ÉLIGIBLES (4)
--------------------------------------------------------------------------------
1. Foncier
2. MSA
3. CEE
4. TVA

================================================================================

✅ 5 produits éligibles identifiés !

================================================================================
📊 RÉSUMÉ DES TESTS
================================================================================
✅ Tests réussis: 8
❌ Tests échoués: 0
================================================================================

✅ 🎉 TOUS LES TESTS SONT PASSÉS !
ℹ️  Test terminé
```

---

## 🔧 Personnalisation

### Modifier les réponses de test

Éditez la fonction `generateTestAnswers()` dans le script :

```javascript
function generateTestAnswers(questions) {
  const answers = {
    1: ['Transport'],           // Secteur → Transport
    2: ['Plus de 500 000€'],   // CA élevé
    3: ['Aucun'],              // Pas de contentieux
    4: ['Oui'],                // Propriétaire → Foncier éligible
    5: ['Oui'],                // Factures énergie
    6: ['Oui'],                // Véhicules pro
    7: ['Camions de plus de 7,5 tonnes'],
    // etc...
  };
  return answers;
}
```

### Profils de test disponibles

**Profil 1: Transport (par défaut)**
- ✅ TICPE, Chronotachygraphes, DFS, URSSAF, Optimisation Énergie

**Profil 2: Agricole**
```javascript
1: ['Secteur Agricole'],  // → MSA éligible
3: ['Aucun'],             // Pas contentieux
```

**Profil 3: Propriétaire**
```javascript
4: ['Oui'],  // Propriétaire locaux → Foncier éligible
```

---

## 🐛 Dépannage

### Erreur "Cannot find module"
```bash
npm install
```

### Erreur de connexion API
```bash
# Vérifier que le serveur tourne
curl http://localhost:3000/api/health

# Si pas de réponse, lancer le serveur
npm run dev
```

### Aucun produit éligible
1. Vérifier les règles dans la BDD :
```sql
SELECT * FROM "EligibilityRules" WHERE is_active = true;
```

2. Vérifier les logs serveur pour voir l'évaluation

3. Adapter les réponses de test

### Erreur Supabase
```bash
# Vérifier les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

---

## 📝 Ce que le test valide

✅ **Authentification**
- Connexion client fonctionnelle
- Token JWT valide

✅ **API Simulations**
- POST /api/simulations (création)
- GET /api/simulations/questions
- POST /api/simulations/:id/answers
- POST /api/simulations/:id/terminer

✅ **Moteur d'Éligibilité**
- ModernDecisionEngine fonctionne
- Règles EligibilityRules appliquées
- Évaluation correcte selon profil

✅ **Base de Données**
- ClientProduitEligible créés
- Statuts corrects (eligible/non_eligible)
- Métadonnées complètes
- Montants calculés

---

## 🎯 Tests Avancés

### Test automatisé en CI/CD
```yaml
# .github/workflows/test.yml
- name: Test Simulation
  run: |
    npm run dev &
    sleep 5
    node test-simulation-complete.js
```

### Tests multiples profils
```bash
# Créer des variantes du script
cp test-simulation-complete.js test-agricole.js
cp test-simulation-complete.js test-proprietaire.js

# Modifier les réponses dans chaque fichier
# Exécuter tous les tests
node test-simulation-complete.js
node test-agricole.js
node test-proprietaire.js
```

---

## 📞 Support

En cas de problème :
1. Vérifier les logs serveur
2. Consulter `CORRECTION-SIMULATION-ELIGIBILITE.md`
3. Vérifier `check-eligibility-rules-content.sql`

