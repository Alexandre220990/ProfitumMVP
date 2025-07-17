export const SIMULATEUR_IMPLEMENTATION_DOC = { id: 'simulateur-implementation, ', title: 'Documentation Technique - Simulateur d\'Éligibilité, ', category: 'technique, ', description: 'Documentation complète de l\'implémentation du simulateur d\'éligibilité, ', content: `
    <h1>Documentation Technique - Simulateur d'Éligibilité</h1>
    
    <h2>🏗️ Architecture Technique</h2>
    
    <h3>Frontend (React + TypeScript)</h3>
    <ul>
      <li><strong>Page principale :</strong> <code>/simulateur-eligibilite</code></li>
      <li><strong>Intégration Hero :</strong> Section optimisée conversion sur la page d'accueil</li>
      <li><strong>Composants :</strong> Questionnaire progressi, f, résultats, navigation</li>
      <li><strong>État :</strong> Gestion de session avec localStorage</li>
    </ul>
    
    <h3>Backend (Node.js + Express)</h3>
    <ul>
      <li><strong>API REST :</strong> Endpoints pour session, questions, réponses, éligibilité</li>
      <li><strong>Base de données :</strong> Tables temporaires et permanentes Supabase</li>
      <li><strong>Calculs :</strong> Algorithmes d'éligibilité par produit</li>
      <li><strong>Notifications :</strong> Système email pour fortes éligibilités</li>
    </ul>
    
    <h3>Base de Données</h3>
    <ul>
      <li><strong>Tables temporaires :</strong> <code>simulation_sessions</code>, <code>simulation_answers</code></li>
      <li><strong>Tables permanentes :</strong> <code>client_produits_eligibles</code>, <code>analytics_simulations</code></li>
      <li><strong>Politiques RLS :</strong> Sécurisation des données par client</li>
      <li><strong>Index :</strong> Optimisation des requêtes de calcul</li>
    </ul>
    
    <h2>🔧 Implémentation Détaillée</h2>
    
    <h3>1. Gestion des Sessions</h3>
    <pre><code>
// Création d'une session
POST /api/simulator/session
{
  "productType": "TICPE", "clientInfo": {
    "companyType": "TRANSPORT", "employeeCount": 10, "annualRevenue": 500000 }
}

// Réponse
{ "sessionId": "uuid", "productType": "TICPE", "currentQuestionIndex": 0 }
    </code></pre>
    
    <h3>2. Questionnaire Progressif</h3>
    <ul>
      <li><strong>Questions adaptatives :</strong> Basées sur les réponses précédentes</li>
      <li><strong>Types de questions :</strong> Choix multiples, numériques, textuelles</li>
      <li><strong>Validation :</strong> Contrôles côté client et serveur</li>
      <li><strong>Sauvegarde :</strong> Réponses stockées en temps réel</li>
    </ul>
    
    <h3>3. Calculs d'Éligibilité</h3>
    <pre><code>
// Algorithme TICPE
function calculateTICPE(answers) { const baseEligibility = 0;
  const gainFactors = [];
  
  if (answers.transport_vehicles > 0) {
    baseEligibility += 30;
    gainFactors.push({
      type: 'vehicles, ', value: answers.transport_vehicles * 1500 });
  }
  
  if (answers.fuel_consumption > 10000) { baseEligibility += 40;
    gainFactors.push({
      type: 'fuel, ', value: answers.fuel_consumption * 0.15 });
  }
  
  return { eligibility: Math.min(baseEligibilit, y, 100), estimatedGain: gainFactors.reduce((su, m, factor) => sum + factor.value, 0) };
}
    </code></pre>
    
    <h3>4. Système de Notifications</h3>
    <ul>
      <li><strong>Seuils :</strong> Éligibilité > 70% déclenche notification email</li>
      <li><strong>Templates :</strong> Emails personnalisés par produit</li>
      <li><strong>Tracking :</strong> Ouvertures et clics trackés</li>
      <li><strong>Escalade :</strong> Notification admin pour très fortes éligibilités</li>
    </ul>
    
    <h2>📊 Analytics et Tracking</h2>
    
    <h3>Métriques Collectées</h3>
    <ul>
      <li><strong>Engagement :</strong> Taux de complétion, temps passé</li>
      <li><strong>Conversion :</strong> Clics CTA, créations de compte</li>
      <li><strong>Performance :</strong> Temps de réponse, erreurs</li>
      <li><strong>Business :</strong> Éligibilités par produit, gains potentiels</li>
    </ul>
    
    <h3>Événements Trackés</h3>
    <pre><code>
// Événements Google Analytics 4
gtag('event', 'simulation_start', { product_type: 'TICPE, ', source: 'hero_section' });

gtag('event', 'simulation_complete', { eligibility_percentage: 8, 5, estimated_gain: 1500, 0, product_type: 'TICPE' });

gtag('event', 'account_creation', { source: 'simulation_results, ', eligibility_percentage: 85 });
    </code></pre>
    
    <h2>🔒 Sécurité et Conformité</h2>
    
    <h3>Protection des Données</h3>
    <ul>
      <li><strong>Chiffrement :</strong> Données sensibles chiffrées en transit et au repos</li>
      <li><strong>Anonymisation :</strong> Sessions temporaires sans PII</li>
      <li><strong>Suppression :</strong> Nettoyage automatique des sessions expirées</li>
      <li><strong>Audit :</strong> Logs complets des accès et modifications</li>
    </ul>
    
    <h3>Politiques RLS</h3>
    <pre><code>
-- Politique pour simulation_sessions
CREATE POLICY "Users can only access their own sessions"
ON simulation_sessions FOR ALL
USING (client_id = auth.uid());

-- Politique pour analytics
CREATE POLICY "Admins can view all analytics"
ON analytics_simulations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM "Admin" 
  WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
));
    </code></pre>
    
    <h2>🚀 Optimisations Performance</h2>
    
    <h3>Frontend</h3>
    <ul>
      <li><strong>Lazy Loading :</strong> Composants chargés à la demande</li>
      <li><strong>Memoization :</strong> Calculs mis en cache avec useMemo</li>
      <li><strong>Debouncing :</strong> Sauvegarde automatique avec délai</li>
      <li><strong>Progressive Enhancement :</strong> Fonctionnalité dégradée si JS désactivé</li>
    </ul>
    
    <h3>Backend</h3>
    <ul>
      <li><strong>Cache Redis :</strong> Questions et calculs mis en cache</li>
      <li><strong>Connection Pooling :</strong> Optimisation des connexions DB</li>
      <li><strong>Rate Limiting :</strong> Protection contre les abus</li>
      <li><strong>Compression :</strong> Réponses compressées avec gzip</li>
    </ul>
    
    <h2>🧪 Tests et Qualité</h2>
    
    <h3>Tests Automatisés</h3>
    <ul>
      <li><strong>Unitaires :</strong> Composants React, fonctions de calcul</li>
      <li><strong>Intégration :</strong> API endpoints, flux complet</li>
      <li><strong>E2E :</strong> Scénarios utilisateur avec Playwright</li>
      <li><strong>Performance :</strong> Tests de charge et stress</li>
    </ul>
    
    <h3>Scripts de Test</h3>
    <pre><code>
# Test API simple
node test-simulateur-simple.cjs

# Test complet avec navigateur
node test-simulateur-complet.cjs

# Test de performance
npm run test: performance
    </code></pre>
    
    <h2>📈 Monitoring et Maintenance</h2>
    
    <h3>Métriques de Surveillance</h3>
    <ul>
      <li><strong>Disponibilité :</strong> Uptime > 99.9%</li>
      <li><strong>Performance :</strong> Temps de réponse < 2s</li>
      <li><strong>Erreurs :</strong> Taux d'erreur < 1%</li>
      <li><strong>Utilisation :</strong> Sessions active,s, conversions</li>
    </ul>
    
    <h3>Alertes</h3>
    <ul>
      <li><strong>Erreurs critiques :</strong> Notifications immédiates</li>
      <li><strong>Performance :</strong> Seuils de latence dépassés</li>
      <li><strong>Business :</strong> Baisse des conversions</li>
      <li><strong>Sécurité :</strong> Tentatives d'intrusion</li>
    </ul>
    
    <h2>🔄 Évolutions Futures</h2>
    
    <h3>Phase 2 - Améliorations</h3>
    <ul>
      <li><strong>IA/ML :</strong> Prédiction d'éligibilité avec machine learning</li>
      <li><strong>Personnalisation :</strong> Questions adaptées au profil</li>
      <li><strong>Intégrations :</strong> APIs externes pour données en temps réel</li>
      <li><strong>Mobile :</strong> Application native iOS/Android</li>
    </ul>
    
    <h3>Phase 3 - Fonctionnalités Avancées</h3>
    <ul>
      <li><strong>Simulation multi-produits :</strong> Analyse simultanée</li>
      <li><strong>Comparaison :</strong> Benchmark avec entreprises similaires</li>
      <li><strong>Prédictions :</strong> Évolution des gains dans le temps</li>
      <li><strong>Automatisation :</strong> Détection automatique d'opportunités</li>
    </ul>
  `,
  filePath: 'docs/simulateur-implementation.md,',
  lastModified: new Date('2024-01-15'),
  tags: ['simulateur,', 'technique', 'implementation', 'api', 'base-de-donnees'],
  readTime: 12
}; 