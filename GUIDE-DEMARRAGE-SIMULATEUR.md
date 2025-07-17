# 🚀 Guide de Démarrage Rapide - Simulateur d'Éligibilité

## 📋 Prérequis

- Node.js v18+ installé
- npm installé
- Accès à la base de données Supabase

## 🎯 Objectif

Démarrer le simulateur d'éligibilité accessible via la section Hero de la page d'accueil pour maximiser la conversion.

## ⚡ Démarrage Rapide

### Option 1: Script Automatique (Recommandé)

```bash
# Depuis la racine du projet
./start-simulateur.sh
```

### Option 2: Démarrage Manuel

#### Étape 1: Backend
```bash
cd server
npm install
npm run dev
```

#### Étape 2: Frontend (nouveau terminal)
```bash
cd client
npm install
npm run dev
```

## 🧪 Tests

### Test API Simple
```bash
cd client
node test-simulateur-simple.cjs
```

### Test Complet (avec navigateur)
```bash
cd client
node test-simulateur-complet.cjs
```

## 🌐 URLs d'Accès

- **Page d'accueil**: http://localhost:3000
- **Simulateur**: http://localhost:3000/simulateur-eligibilite
- **API Backend**: http://localhost:5000

## 🎨 Fonctionnalités de la Section Hero

### ✅ Optimisations Conversion

1. **Titre engageant**: "Économisez jusqu'à 50 000€"
2. **Badge de confiance**: "Découvrez vos gains en 2 minutes"
3. **Statistiques rassurantes**: 
   - 15 000€ gain moyen
   - 98% satisfaction
   - 2min d'analyse
4. **Call-to-Action principal**: "Découvrir mes gains GRATUITEMENT"
5. **Garanties**: "Aucun engagement • Résultats en 2 minutes • 100% sécurisé"

### 🎯 Carte de Simulation

- **Étapes claires**: 1-2-3 processus
- **Exemple concret**: "23 450€ de gains TICPE non récupérés"
- **Bouton d'action**: "Commencer ma simulation"

## 🔧 Configuration

### Variables d'Environnement

```bash
# Backend (.env dans server/)
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_clé_anon
SUPABASE_SERVICE_KEY=votre_clé_service

# Frontend (.env dans client/)
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon
```

## 📊 Analytics et Tracking

### Événements Trackés

1. **Clic sur CTA Hero**: `hero_cta_click`
2. **Démarrage simulation**: `simulation_start`
3. **Complétion questionnaire**: `questionnaire_complete`
4. **Affichage résultats**: `results_display`
5. **Clic création compte**: `account_creation_click`

### Métriques de Conversion

- **Taux de clic Hero**: Objectif > 15%
- **Taux de complétion**: Objectif > 70%
- **Taux de création compte**: Objectif > 25%

## 🚨 Dépannage

### Erreur "Connection Refused"

```bash
# Vérifier que le backend est démarré
curl http://localhost:5000/health

# Redémarrer le backend
cd server && npm run dev
```

### Erreur "Module not found"

```bash
# Réinstaller les dépendances
cd client && npm install
cd ../server && npm install
```

### Erreur Base de Données

```bash
# Vérifier la connexion Supabase
cd server && node test-supabase-connection.js
```

## 📈 Optimisations Futures

### Phase 2: Améliorations Conversion

1. **A/B Testing** des titres et CTA
2. **Personnalisation** selon le secteur d'activité
3. **Notifications push** pour les abandons
4. **Chatbot** d'aide en temps réel
5. **Témoignages** vidéo intégrés

### Phase 3: Fonctionnalités Avancées

1. **Simulation multi-produits** simultanée
2. **Export PDF** des résultats
3. **Rappels automatiques** par email
4. **Intégration CRM** pour le suivi
5. **API publique** pour partenaires

## 📞 Support

En cas de problème :

1. Vérifier les logs : `tail -f backend.log` ou `tail -f frontend.log`
2. Tester l'API : `node test-simulateur-simple.cjs`
3. Redémarrer les serveurs : `./start-simulateur.sh`

---

**🎉 Le simulateur est maintenant prêt à maximiser vos conversions !** 