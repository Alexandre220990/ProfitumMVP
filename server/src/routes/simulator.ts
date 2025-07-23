import express from 'express';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Types pour les données
interface SessionData {
  session_token: string;
  ip_address: string;
  user_agent: string;
}

interface ResponseData {
  session_id: string;
  question_id: string;
  response_value: string;
}

interface EligibilityResult {
  produit_id: string;
  eligibility_score: number;
  estimated_savings: number;
  confidence_level: string;
  recommendations: string[];
}

// Fonction pour envoyer une notification de forte éligibilité (simplifiée)
async function sendHighEligibilityNotification(sessionData: SessionData, results: EligibilityResult[]) {
  try {
    const highEligibilityResults = results.filter(r => r.eligibility_score >= 70);
    
    if (highEligibilityResults.length > 0) {
      const totalSavings = highEligibilityResults.reduce((sum: number, r: EligibilityResult) => sum + r.estimated_savings, 0);
      
      console.log('🚨 Forte éligibilité détectée !');
      console.log(`Session ID: ${sessionData.session_token}`);
      console.log(`IP: ${sessionData.ip_address}`);
      console.log(`Total des économies potentielles: ${totalSavings.toLocaleString('fr-FR')}€`);
      console.log('Produits très éligibles:');
      highEligibilityResults.forEach(r => {
        console.log(`  - ${r.produit_id}: ${r.eligibility_score}% éligible - ${r.estimated_savings}€`);
      });
    }
  } catch (error) {
    console.error('Erreur lors de la notification:', error);
  }
}

// Fonction pour nettoyer les sessions expirées
async function cleanupExpiredSessions() {
  try {
    const { error } = await supabase
      .from('TemporarySession')
      .delete()
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) {
      console.error('Erreur lors du nettoyage des sessions:', error);
    } else {
      console.log('🧹 Sessions expirées nettoyées');
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des sessions:', error);
  }
}

// Nettoyage automatique toutes les heures
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// Créer une session temporaire
router.post('/session', async (req, res) => {
  try {
    const sessionToken = uuidv4();
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    const { data, error } = await supabase
      .from('TemporarySession')
      .insert({
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de session:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de session'
      });
    }

    return res.json({
      success: true,
      session_token: sessionToken,
      session_id: data.id
    });
  } catch (error) {
    console.error('Erreur lors de la création de session:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de session'
    });
  }
});

// Récupérer les questions du questionnaire
router.get('/questions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .order('question_order', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des questions:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des questions'
      });
    }

    return res.json(data || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des questions'
    });
  }
});

// Sauvegarder une réponse
router.post('/response', async (req, res) => {
  try {
    const { session_id, question_id, response_value } = req.body as ResponseData;

    // Vérifier que la session existe d'abord
    const { data: sessionData, error: sessionError } = await supabase
      .from('TemporarySession')
      .select('id')
      .eq('session_token', session_id)
      .single();

    if (sessionError || !sessionData) {
      console.error('Session non trouvée:', session_id);
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      });
    }

    // Utiliser l'ID de la session pour l'insertion
    const { error } = await supabase
      .from('TemporaryResponse')
      .insert({
        session_id: sessionData.id, // Utiliser l'ID de la session, pas le token
        question_id,
        response_value: Array.isArray(response_value) ? response_value : [response_value]
      });

    if (error) {
      console.error('Erreur lors de la sauvegarde de la réponse:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la sauvegarde de la réponse'
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la réponse:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde de la réponse'
    });
  }
});

// Calculer l'éligibilité
router.post('/calculate-eligibility', async (req, res) => {
  try {
    const { session_id } = req.body;

    // Récupérer les données de session (session_id peut être soit l'ID soit le token)
    const { data: sessionData, error: sessionError } = await supabase
      .from('TemporarySession')
      .select('*')
      .or(`id.eq.${session_id},session_token.eq.${session_id}`)
      .single();

    if (sessionError || !sessionData) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      });
    }

    // Récupérer toutes les réponses de la session
    const { data: responses, error: responsesError } = await supabase
      .from('TemporaryResponse')
      .select('question_id, response_value')
      .eq('session_id', sessionData.id);

    if (responsesError) {
      console.error('Erreur lors de la récupération des réponses:', responsesError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des réponses'
      });
    }

    // Récupérer les règles de calcul
    const { data: rules, error: rulesError } = await supabase
      .from('ProductCalculationRules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (rulesError) {
      console.error('Erreur lors de la récupération des règles:', rulesError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des règles'
      });
    }

    // Récupérer les taux spécifiques
    const { data: rates, error: ratesError } = await supabase
      .from('ProductSpecificRates')
      .select('*');

    if (ratesError) {
      console.error('Erreur lors de la récupération des taux:', ratesError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des taux'
      });
    }

    // Calculer l'éligibilité pour chaque produit
    const results = [];
    const calculator = new AdvancedEligibilityCalculator();

    // Produits à calculer
    const products = ['TICPE', 'URSSAF', 'DFS', 'FONCIER'];

    for (const productId of products) {
      console.log(`🎯 Calcul pour ${productId}...`);
      
      let result = {
        produit_id: productId,
        eligibility_score: 0,
        estimated_savings: 0,
        confidence_level: 'faible',
        recommendations: ['❌ Non éligible', '💡 Inscrivez-vous pour une analyse approfondie de votre dossier']
      };

      // Utiliser le calculateur optimisé selon le produit
      if (productId === 'TICPE') {
        const ticpeResult = calculator.calculateTICPESavings(responses || []);
        result = {
          produit_id: productId,
          eligibility_score: ticpeResult.score,
          estimated_savings: ticpeResult.savings,
          confidence_level: ticpeResult.confidence,
          recommendations: generateRecommendations(productId, ticpeResult.score, ticpeResult.savings)
        };
      } else if (productId === 'URSSAF') {
        const urssafResult = calculator.calculateURSSAFSavings(responses || []);
        result = {
          produit_id: productId,
          eligibility_score: urssafResult.score,
          estimated_savings: urssafResult.savings,
          confidence_level: urssafResult.confidence,
          recommendations: generateRecommendations(productId, urssafResult.score, urssafResult.savings)
        };
      } else if (productId === 'DFS') {
        const dfsResult = calculator.calculateDFSSavings(responses || [], rates || []);
        result = {
          produit_id: productId,
          eligibility_score: dfsResult.score,
          estimated_savings: dfsResult.savings,
          confidence_level: dfsResult.confidence,
          recommendations: generateRecommendations(productId, dfsResult.score, dfsResult.savings)
        };
      } else if (productId === 'FONCIER') {
        const foncierResult = calculator.calculateFoncierSavings(responses || []);
        result = {
          produit_id: productId,
          eligibility_score: foncierResult.score,
          estimated_savings: foncierResult.savings,
          confidence_level: foncierResult.confidence,
          recommendations: generateRecommendations(productId, foncierResult.score, foncierResult.savings)
        };
      }

      results.push(result);
      console.log(`   ✅ ${productId}: ${result.estimated_savings}€ (${result.eligibility_score}%)`);
    }

    // Sauvegarder les résultats
    for (const result of results) {
      const { error: insertError } = await supabase
        .from('TemporaryEligibility')
        .insert({
          session_id: sessionData.id,
          produit_id: result.produit_id,
          eligibility_score: result.eligibility_score,
          estimated_savings: result.estimated_savings,
          confidence_level: result.confidence_level,
          recommendations: result.recommendations
        });

      if (insertError) {
        console.error('Erreur lors de la sauvegarde du résultat:', insertError);
      }
    }

    // Marquer la session comme complétée
    const { error: updateError } = await supabase
      .from('TemporarySession')
      .update({
        completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionData.id);

    if (updateError) {
      console.error('Erreur lors du marquage de la session comme complétée:', updateError);
    } else {
      console.log('✅ Session marquée comme complétée:', sessionData.session_token);
    }

    // Envoyer notification si forte éligibilité
    await sendHighEligibilityNotification(sessionData, results);

    return res.json(results);
  } catch (error) {
    console.error('Erreur lors du calcul de l\'éligibilité:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul de l\'éligibilité'
    });
  }
});

// Récupérer les résultats
router.get('/results/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des résultats'
      });
    }

    return res.json(data || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des résultats'
    });
  }
});

// Récupérer les résultats d'une session (pour affichage dashboard)
router.get('/results/session/:sessionToken', async (req, res) => {
  try {
    const { sessionToken } = req.params;

    // Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      });
    }

    // Récupérer les résultats d'éligibilité
    const { data: eligibilityResults, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id);

    if (eligibilityError) {
      console.error('Erreur récupération éligibilité:', eligibilityError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des résultats'
      });
    }

    // Récupérer les réponses pour recalculer si nécessaire
    const { data: responses, error: responsesError } = await supabase
      .from('TemporaryResponse')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Erreur récupération réponses:', responsesError);
    }

    // Recalculer avec le calculateur avancé
    const calculator = new AdvancedEligibilityCalculator();
    const recalculatedResults = [];

    for (const result of eligibilityResults || []) {
      let finalResult = { ...result };

      // Utiliser directement le calculateur optimisé pour tous les résultats
      if (responses) {
        if (result.produit_id === 'TICPE') {
          const recalculated = calculator.calculateTICPESavings(responses);
          finalResult = {
            ...result,
            estimated_savings: recalculated.savings,
            eligibility_score: recalculated.score,
            confidence_level: recalculated.confidence,
            recommendations: generateRecommendations(result.produit_id, recalculated.score, recalculated.savings)
          };
        } else if (result.produit_id === 'URSSAF') {
          const recalculated = calculator.calculateURSSAFSavings(responses);
          finalResult = {
            ...result,
            estimated_savings: recalculated.savings,
            eligibility_score: recalculated.score,
            confidence_level: recalculated.confidence,
            recommendations: generateRecommendations(result.produit_id, recalculated.score, recalculated.savings)
          };
        } else if (result.produit_id === 'DFS') {
          const recalculated = calculator.calculateDFSSavings(responses, []);
          finalResult = {
            ...result,
            estimated_savings: recalculated.savings,
            eligibility_score: recalculated.score,
            confidence_level: recalculated.confidence,
            recommendations: generateRecommendations(result.produit_id, recalculated.score, recalculated.savings)
          };
        } else if (result.produit_id === 'FONCIER') {
          const recalculated = calculator.calculateFoncierSavings(responses);
          finalResult = {
            ...result,
            estimated_savings: recalculated.savings,
            eligibility_score: recalculated.score,
            confidence_level: recalculated.confidence,
            recommendations: generateRecommendations(result.produit_id, recalculated.score, recalculated.savings)
          };
        }
      }

      recalculatedResults.push(finalResult);
    }

    return res.json({
      success: true,
      session: {
        id: session.id,
        session_token: session.session_token,
        created_at: session.created_at,
        completed: session.completed
      },
      results: recalculatedResults
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des résultats'
    });
  }
});

// Route de tracking analytics
router.post('/track', async (req, res) => {
  try {
    const { event, session_token, data } = req.body;

    const { error } = await supabase
      .from('SimulatorAnalytics')
      .insert({
        session_token,
        event_type: event,
        event_data: data,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Erreur lors du tracking:', error);
      return res.status(500).json({ success: false });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors du tracking:', error);
    return res.status(500).json({ success: false });
  }
});

// Récupérer toutes les sessions
router.get('/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des sessions:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des sessions'
      });
    }

    return res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des sessions'
    });
  }
});

// Route de gestion des abandons
router.post('/abandon', async (req, res) => {
  try {
    const { session_token, reason } = req.body;

    // Marquer la session comme abandonnée
    const { error: updateError } = await supabase
      .from('TemporarySession')
      .update({
        abandoned: true,
        abandon_reason: reason,
        abandoned_at: new Date().toISOString()
      })
      .eq('session_token', session_token);

    if (updateError) {
      console.error('Erreur lors de la mise à jour de la session:', updateError);
      return res.status(500).json({ success: false });
    }

    // Récupérer les données de la session pour analyse
    const { data: sessionData, error: sessionError } = await supabase
      .from('TemporarySession')
      .select(`
        *,
        TemporaryResponse (count),
        TemporaryEligibility (count)
      `)
      .eq('session_token', session_token)
      .single();

    if (sessionError) {
      console.error('Erreur lors de la récupération des données de session:', sessionError);
    } else {
      console.log('📊 Session abandonnée:', {
        session_token,
        reason,
        responses_count: sessionData?.TemporaryResponse?.[0]?.count || 0,
        eligibility_count: sessionData?.TemporaryEligibility?.[0]?.count || 0
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la gestion de l\'abandon:', error);
    return res.status(500).json({ success: false });
  }
});

// Fonctions de calcul d'éligibilité
async function calculateEligibilityForAllProducts(responses: any[], rules: any[], rates: any[]): Promise<EligibilityResult[]> {
  const products = ['TICPE', 'URSSAF', 'DFS', 'FONCIER'];
  const results: EligibilityResult[] = [];

  for (const productId of products) {
    const result = await calculateEligibilityForProduct(productId, responses, rules, rates);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

async function calculateEligibilityForProduct(productId: string, responses: any[], rules: any[], rates: any[]): Promise<EligibilityResult | null> {
  try {
    let estimatedSavings = 0;
    let score = 0;
    let confidenceLevel = 'faible';

    // Calculer les économies estimées selon le produit avec le nouveau calculateur
    switch (productId) {
      case 'TICPE':
        const ticpeResult = eligibilityCalculator.calculateTICPESavings(responses);
        estimatedSavings = ticpeResult.savings;
        score = ticpeResult.score;
        confidenceLevel = ticpeResult.confidence;
        break;
      case 'URSSAF':
        const urssafResult = eligibilityCalculator.calculateURSSAFSavings(responses);
        estimatedSavings = urssafResult.savings;
        score = urssafResult.score;
        confidenceLevel = urssafResult.confidence;
        break;
      case 'DFS':
        const dfsResult = eligibilityCalculator.calculateDFSSavings(responses, rates);
        estimatedSavings = dfsResult.savings;
        score = dfsResult.score;
        confidenceLevel = dfsResult.confidence;
        break;
      case 'FONCIER':
        const foncierResult = eligibilityCalculator.calculateFoncierSavings(responses);
        estimatedSavings = foncierResult.savings;
        score = foncierResult.score;
        confidenceLevel = foncierResult.confidence;
        break;
    }

    // Générer les recommandations basées sur les gains
    const recommendations = generateRecommendations(productId, score, estimatedSavings);

    return {
      produit_id: productId,
      eligibility_score: Math.round(score),
      estimated_savings: Math.round(estimatedSavings),
      confidence_level: confidenceLevel,
      recommendations
    };
  } catch (error) {
    console.error(`Erreur lors du calcul pour ${productId}:`, error);
    return null;
  }
}

function applyRule(rule: any, responses: any[]): number {
  // Si pas de conditions, score par défaut
  if (!rule.rule_conditions) {
    return rule.priority || 10;
  }

  let score = 0;
  const conditions = rule.rule_conditions;

  // Pour chaque condition, on regarde si une réponse la satisfait
  for (const [key, expected] of Object.entries(conditions)) {
    for (const response of responses) {
      const value = (typeof response.response_value === 'string')
        ? response.response_value.toLowerCase()
        : JSON.stringify(response.response_value).toLowerCase();

      if (typeof expected === 'boolean' && expected) {
        if (value.includes(key.replace(/_/g, ''))) score += rule.priority || 10;
      } else if (typeof expected === 'number') {
        if (value.includes(expected.toString())) score += rule.priority || 10;
      } else if (typeof expected === 'string') {
        if (value.includes(expected.toLowerCase())) score += rule.priority || 10;
      }
    }
  }

  return score;
}

// Moteur de calcul avancé pour l'éligibilité
class AdvancedEligibilityCalculator {
  private tauxCarburant: { [key: string]: number };
  private coefficientsVehicules: { [key: string]: number };
  private estimationsConsommation: { [key: string]: number };

  constructor() {
    this.tauxCarburant = {
      'Gazole professionnel': 0.177,
      'Gazole Non Routier (GNR)': 0.150,
      'Essence': 0.177,
      'GPL': 0.177,
      'Électricité': 0.177
    };

    this.coefficientsVehicules = {
      'Camions de plus de 7,5 tonnes': 1.0,
      'Camions de 3,5 à 7,5 tonnes': 0.8,
      'Véhicules utilitaires légers': 0.6,
      'Engins de chantier': 0.9,
      'Véhicules de service': 0.7,
      'Véhicules de fonction': 0.5,
      'Tracteurs agricoles': 0.9
    };

    this.estimationsConsommation = {
      'Moins de 5 000 litres': 3000,
      '5 000 à 15 000 litres': 10000,
      '15 000 à 50 000 litres': 32500,
      'Plus de 50 000 litres': 75000
    };
  }

  /**
   * Extraction des données du profil client depuis les réponses
   */
  extractClientProfile(responses: any[]): any {
    const profile: any = {};

    console.log('🔍 Extraction du profil - Réponses reçues:', responses.length);

    // Mapper les réponses aux champs du profil
    responses.forEach((response, index) => {
      console.log(`   ${index + 1}. Question ID: ${response.question_id}`);
      
      // Extraire la valeur de la réponse (gérer les arrays et les strings)
      let value: string | string[] = '';
      if (Array.isArray(response.response_value)) {
        value = response.response_value;
        console.log(`      - Format: array, Valeur: ${JSON.stringify(value)}`);
      } else if (typeof response.response_value === 'string') {
        value = response.response_value;
        console.log(`      - Format: string, Valeur: "${value}"`);
      } else if (typeof response.response_value === 'object' && response.response_value !== null) {
        // Si c'est un objet, essayer d'extraire la valeur
        value = Object.values(response.response_value).join(', ');
        console.log(`      - Format: object, Valeur extraite: "${value}"`);
      }

      // Convertir en string pour le traitement
      const valueStr = Array.isArray(value) ? value.join(', ') : value;
      
      // Mapping basé sur le contenu de la réponse (plus robuste)
      
      // Secteur d'activité
      if (valueStr?.includes('Transport') || valueStr?.includes('Logistique')) {
        if (valueStr?.includes('marchandises') || valueStr?.includes('Logistique')) {
          profile.secteur = 'Transport routier de marchandises';
        } else if (valueStr?.includes('voyageurs')) {
          profile.secteur = 'Transport routier de voyageurs';
        } else {
          profile.secteur = 'Transport routier de marchandises'; // Par défaut
        }
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      } else if (valueStr?.includes('BTP') || valueStr?.includes('Travaux')) {
        profile.secteur = 'BTP / Travaux publics';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      } else if (valueStr?.includes('Taxi') || valueStr?.includes('VTC')) {
        profile.secteur = 'Taxi / VTC';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      } else if (valueStr?.includes('Agricole')) {
        profile.secteur = 'Secteur Agricole';
        console.log(`      → Secteur détecté: ${profile.secteur}`);
      }

      // Véhicules professionnels
      if (valueStr?.includes('Oui') && (valueStr?.includes('véhicule') || valueStr?.includes('professionnel'))) {
        profile.vehiculesProfessionnels = 'Oui';
        console.log(`      → Véhicules professionnels: ${profile.vehiculesProfessionnels}`);
      }

      // Nombre de véhicules
      if (valueStr?.includes('1 à 3')) profile.nombreVehicules = '1 à 3 véhicules';
      else if (valueStr?.includes('4 à 10')) profile.nombreVehicules = '4 à 10 véhicules';
      else if (valueStr?.includes('11 à 25')) profile.nombreVehicules = '11 à 25 véhicules';
      else if (valueStr?.includes('Plus de 25')) profile.nombreVehicules = 'Plus de 25 véhicules';

      // Types de véhicules
      if (valueStr?.includes('Camion') && valueStr?.includes('7,5 tonnes')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Camions de plus de 7,5 tonnes');
        console.log(`      → Type véhicule ajouté: Camions de plus de 7,5 tonnes`);
      }
      if (valueStr?.includes('Camion') && valueStr?.includes('3,5 à 7,5')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Camions de 3,5 à 7,5 tonnes');
        console.log(`      → Type véhicule ajouté: Camions de 3,5 à 7,5 tonnes`);
      }
      if (valueStr?.includes('utilitaire') || valueStr?.includes('Utilitaire')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Véhicules utilitaires légers');
        console.log(`      → Type véhicule ajouté: Véhicules utilitaires légers`);
      }
      if (valueStr?.includes('engin') || valueStr?.includes('Engin')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Engins de chantier');
        console.log(`      → Type véhicule ajouté: Engins de chantier`);
      }
      if (valueStr?.includes('Tracteur') || valueStr?.includes('tracteur')) {
        if (!profile.typesVehicules) profile.typesVehicules = [];
        profile.typesVehicules.push('Tracteurs agricoles');
        console.log(`      → Type véhicule ajouté: Tracteurs agricoles`);
      }

      // Consommation carburant
      if (valueStr?.includes('Plus de 50 000')) {
        profile.consommationCarburant = 'Plus de 50 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      } else if (valueStr?.includes('15 000 à 50 000')) {
        profile.consommationCarburant = '15 000 à 50 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      } else if (valueStr?.includes('5 000 à 15 000')) {
        profile.consommationCarburant = '5 000 à 15 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      } else if (valueStr?.includes('Moins de 5 000')) {
        profile.consommationCarburant = 'Moins de 5 000 litres';
        console.log(`      → Consommation détectée: ${profile.consommationCarburant}`);
      }

      // Types de carburant
      if (valueStr?.includes('Gazole') && !valueStr?.includes('Non Routier') && !valueStr?.includes('GNR')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Gazole professionnel');
        console.log(`      → Carburant ajouté: Gazole professionnel`);
      }
      if (valueStr?.includes('GNR') || valueStr?.includes('Non Routier')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Gazole Non Routier (GNR)');
        console.log(`      → Carburant ajouté: Gazole Non Routier (GNR)`);
      }
      if (valueStr?.includes('Essence')) {
        if (!profile.typesCarburant) profile.typesCarburant = [];
        profile.typesCarburant.push('Essence');
        console.log(`      → Carburant ajouté: Essence`);
      }

      // Factures carburant
      if (valueStr?.includes('3 dernières années complètes')) {
        profile.facturesCarburant = 'Oui, 3 dernières années complètes';
        console.log(`      → Factures détectées: ${profile.facturesCarburant}`);
      } else if (valueStr?.includes('2 dernières années')) {
        profile.facturesCarburant = 'Oui, 2 dernières années';
        console.log(`      → Factures détectées: ${profile.facturesCarburant}`);
      } else if (valueStr?.includes('1 dernière année')) {
        profile.facturesCarburant = 'Oui, 1 dernière année';
        console.log(`      → Factures détectées: ${profile.facturesCarburant}`);
      } else if (valueStr?.includes('Partiellement')) {
        profile.facturesCarburant = 'Partiellement';
        console.log(`      → Factures détectées: ${profile.facturesCarburant}`);
      }

      // Usage professionnel
      if (valueStr?.includes('100% professionnel')) {
        profile.usageProfessionnel = '100% professionnel';
        console.log(`      → Usage détecté: ${profile.usageProfessionnel}`);
      } else if (valueStr?.includes('80-99%')) {
        profile.usageProfessionnel = '80-99% professionnel';
        console.log(`      → Usage détecté: ${profile.usageProfessionnel}`);
      } else if (valueStr?.includes('60-79%')) {
        profile.usageProfessionnel = '60-79% professionnel';
        console.log(`      → Usage détecté: ${profile.usageProfessionnel}`);
      }

      // Cartes carburant
      if (valueStr?.includes('toutes les stations')) {
        profile.cartesCarburant = 'Oui, toutes les stations';
        console.log(`      → Cartes carburant: ${profile.cartesCarburant}`);
      } else if (valueStr?.includes('partiellement')) {
        profile.cartesCarburant = 'Oui, partiellement';
        console.log(`      → Cartes carburant: ${profile.cartesCarburant}`);
      } else if (valueStr?.includes('Non')) {
        profile.cartesCarburant = 'Non';
        console.log(`      → Cartes carburant: ${profile.cartesCarburant}`);
      }

      // Factures nominatives
      if (valueStr?.includes('systématiquement')) {
        profile.facturesNominatives = 'Oui, systématiquement';
        console.log(`      → Factures nominatives: ${profile.facturesNominatives}`);
      } else if (valueStr?.includes('partiellement')) {
        profile.facturesNominatives = 'Oui, partiellement';
        console.log(`      → Factures nominatives: ${profile.facturesNominatives}`);
      }

      // Immatriculation société
      if (valueStr?.includes('100%')) {
        profile.immatriculationSociete = 'Oui, 100%';
        console.log(`      → Immatriculation société: ${profile.immatriculationSociete}`);
      } else if (valueStr?.includes('majoritairement')) {
        profile.immatriculationSociete = 'Oui, majoritairement';
        console.log(`      → Immatriculation société: ${profile.immatriculationSociete}`);
      }

      // Déclarations TICPE
      if (valueStr?.includes('régulièrement')) {
        profile.declarationsTicpe = 'Oui, régulièrement';
        console.log(`      → Déclarations TICPE: ${profile.declarationsTicpe}`);
      } else if (valueStr?.includes('occasionnellement')) {
        profile.declarationsTicpe = 'Oui, occasionnellement';
        console.log(`      → Déclarations TICPE: ${profile.declarationsTicpe}`);
      }

      // Chiffre d'affaires
      if (valueStr?.includes('Plus de 5 000 000€')) {
        profile.chiffreAffaires = 'Plus de 5 000 000€';
      } else if (valueStr?.includes('1 000 000€ - 5 000 000€')) {
        profile.chiffreAffaires = '1 000 000€ - 5 000 000€';
      } else if (valueStr?.includes('500 000€ - 1 000 000€')) {
        profile.chiffreAffaires = '500 000€ - 1 000 000€';
      } else if (valueStr?.includes('100 000€ - 500 000€')) {
        profile.chiffreAffaires = '100 000€ - 500 000€';
      } else if (valueStr?.includes('Moins de 100 000€')) {
        profile.chiffreAffaires = 'Moins de 100 000€';
      }
    });

    // MÉTHODE OPTIMALE :
    // Si la détection classique n'a pas trouvé, on déduit la présence de véhicules professionnels
    if (!profile.vehiculesProfessionnels || profile.vehiculesProfessionnels !== 'Oui') {
      if (
        (profile.nombreVehicules && typeof profile.nombreVehicules === 'string' && !profile.nombreVehicules.includes('0')) ||
        (profile.typesVehicules && Array.isArray(profile.typesVehicules) && profile.typesVehicules.length > 0)
      ) {
        profile.vehiculesProfessionnels = 'Oui';
      }
    }

    console.log('📊 Profil final extrait:', profile);
    return profile;
  }

  /**
   * Calcul TICPE avancé
   */
  calculateTICPESavings(responses: any[]): { savings: number; score: number; confidence: string } {
    console.log('🔍 DEBUG TICPE - Réponses reçues:', responses.length);
    responses.forEach((r, i) => {
      console.log(`   ${i + 1}. Question: ${r.question_id}, Réponse: ${r.response_value}`);
    });

    const profile = this.extractClientProfile(responses);
    console.log('🔍 DEBUG TICPE - Profil extrait:', profile);
    
    // Vérification éligibilité de base
    const secteursEligibles = [
      'Transport routier de marchandises',
      'Transport routier de voyageurs',
      'Taxi / VTC',
      'BTP / Travaux publics',
      'Secteur Agricole'
    ];

    console.log('🔍 DEBUG TICPE - Vérification éligibilité:');
    console.log(`   - Secteur détecté: ${profile.secteur}`);
    console.log(`   - Véhicules professionnels: ${profile.vehiculesProfessionnels}`);
    console.log(`   - Secteur éligible: ${secteursEligibles.includes(profile.secteur)}`);

    if (!secteursEligibles.includes(profile.secteur) || profile.vehiculesProfessionnels !== 'Oui') {
      console.log('❌ DEBUG TICPE - Non éligible: secteur ou véhicules manquants');
      return { savings: 0, score: 0, confidence: 'faible' };
    }

    // Calcul du montant récupérable
    let estimatedSavings = 0;
    let score = 0;

    // Score d'éligibilité (0-100)
    const scoresSecteur: { [key: string]: number } = {
      'Transport routier de marchandises': 30,
      'Transport routier de voyageurs': 30,
      'Taxi / VTC': 25,
      'BTP / Travaux publics': 20,
      'Secteur Agricole': 15
    };
    score += scoresSecteur[profile.secteur] || 0;
    console.log(`🔍 DEBUG TICPE - Score secteur: ${score}`);

    // Véhicules professionnels (25 points)
    score += 25;
    console.log(`🔍 DEBUG TICPE - Score après véhicules: ${score}`);

    // Types de véhicules (20 points)
    if (profile.typesVehicules) {
      let vehicleScore = 0;
      profile.typesVehicules.forEach((type: string) => {
        switch (type) {
          case 'Camions de plus de 7,5 tonnes': vehicleScore += 20; break;
          case 'Camions de 3,5 à 7,5 tonnes': vehicleScore += 15; break;
          case 'Engins de chantier': vehicleScore += 15; break;
          case 'Tracteurs agricoles': vehicleScore += 15; break;
          case 'Véhicules utilitaires légers': vehicleScore += 10; break;
          case 'Véhicules de service': vehicleScore += 10; break;
        }
      });
      score += Math.min(vehicleScore, 20);
      console.log(`🔍 DEBUG TICPE - Score après types véhicules: ${score} (types: ${profile.typesVehicules.join(', ')})`);
    }

    // Consommation carburant (15 points)
    if (profile.consommationCarburant) {
      if (profile.consommationCarburant === 'Plus de 50 000 litres') score += 15;
      else if (profile.consommationCarburant === '15 000 à 50 000 litres') score += 10;
      else if (profile.consommationCarburant === '5 000 à 15 000 litres') score += 5;
      console.log(`🔍 DEBUG TICPE - Score après consommation: ${score} (consommation: ${profile.consommationCarburant})`);
    }

    // Documents disponibles (10 points)
    if (profile.facturesCarburant && profile.facturesCarburant.includes('complètes')) {
      score += 10;
    }
    console.log(`🔍 DEBUG TICPE - Score final: ${score}`);

    // Calcul du montant récupérable
    if (score > 0) {
      const fuelRate = this.getFuelRate(profile.typesCarburant, profile.secteur);
      const totalConsumption = this.estimationsConsommation[profile.consommationCarburant] || 10000;
      const vehicleCoefficient = this.getVehicleCoefficient(profile.typesVehicules);
      const usageCoefficient = profile.usageProfessionnel === '100% professionnel' ? 1.0 : 0.8;
      
      estimatedSavings = totalConsumption * fuelRate * vehicleCoefficient * usageCoefficient;
      
      // Plafonnement
      estimatedSavings = Math.min(estimatedSavings, 100000);
      estimatedSavings = Math.max(estimatedSavings, 500);

      console.log(`🔍 DEBUG TICPE - Calcul montant:`);
      console.log(`   - Taux carburant: ${fuelRate}`);
      console.log(`   - Consommation totale: ${totalConsumption}`);
      console.log(`   - Coefficient véhicule: ${vehicleCoefficient}`);
      console.log(`   - Coefficient usage: ${usageCoefficient}`);
      console.log(`   - Montant calculé: ${estimatedSavings}`);
    }

    const confidence = score >= 70 ? 'élevé' : score >= 40 ? 'moyen' : 'faible';
    console.log(`🔍 DEBUG TICPE - Résultat final: ${estimatedSavings}€, score: ${score}, confiance: ${confidence}`);
    
    return { savings: Math.round(estimatedSavings), score: Math.min(score, 100), confidence };
  }

  /**
   * Calcul URSSAF avancé
   */
  calculateURSSAFSavings(responses: any[]): { savings: number; score: number; confidence: string } {
    let score = 0;
    let estimatedSavings = 0;

    // Recherche d'indicateurs d'éligibilité URSSAF
    const hasEmployees = responses.some(r => 
      r.response_value?.includes('employés') || 
      r.response_value?.includes('salariés') ||
      r.response_value?.includes('personnel')
    );

    const hasPayroll = responses.some(r => 
      r.response_value?.includes('paie') || 
      r.response_value?.includes('salaire') ||
      r.response_value?.includes('cotisations')
    );

    const hasOptimization = responses.some(r => 
      r.response_value?.includes('Optimisation URSSAF') ||
      r.response_value?.includes('CICE') ||
      r.response_value?.includes('Crédit')
    );

    if (hasEmployees) {
      score += 40;
      estimatedSavings += 5000;
    }

    if (hasPayroll) {
      score += 30;
      estimatedSavings += 3000;
    }

    if (hasOptimization) {
      score += 30;
      estimatedSavings += 2000;
    }

    const confidence = score >= 70 ? 'élevé' : score >= 40 ? 'moyen' : 'faible';
    return { savings: Math.round(estimatedSavings), score: Math.min(score, 100), confidence };
  }

  /**
   * Calcul DFS avancé
   */
  calculateDFSSavings(responses: any[], rates: any[]): { savings: number; score: number; confidence: string } {
    let score = 0;
    let estimatedSavings = 0;

    // Recherche d'indicateurs d'éligibilité DFS
    const hasRevenue = responses.some(r => 
      r.response_value?.includes('€') || 
      r.response_value?.includes('chiffre') ||
      r.response_value?.includes('CA')
    );

    const hasOptimization = responses.some(r => 
      r.response_value?.includes('Optimisation') ||
      r.response_value?.includes('fiscal') ||
      r.response_value?.includes('impôt')
    );

    const hasCIR = responses.some(r => 
      r.response_value?.includes('CIR') ||
      r.response_value?.includes('Recherche')
    );

    if (hasRevenue) {
      score += 35;
      estimatedSavings += 8000;
    }

    if (hasOptimization) {
      score += 35;
      estimatedSavings += 4000;
    }

    if (hasCIR) {
      score += 30;
      estimatedSavings += 6000;
    }

    const confidence = score >= 70 ? 'élevé' : score >= 40 ? 'moyen' : 'faible';
    return { savings: Math.round(estimatedSavings), score: Math.min(score, 100), confidence };
  }

  /**
   * Calcul FONCIER avancé
   */
  calculateFoncierSavings(responses: any[]): { savings: number; score: number; confidence: string } {
    let score = 0;
    let estimatedSavings = 0;

    // Recherche d'indicateurs d'éligibilité FONCIER
    const hasProperty = responses.some(r => 
      r.response_value?.includes('propriétaire') || 
      r.response_value?.includes('immobilier') ||
      r.response_value?.includes('bien')
    );

    const hasRental = responses.some(r => 
      r.response_value?.includes('location') || 
      r.response_value?.includes('louer') ||
      r.response_value?.includes('bail')
    );

    const hasOptimization = responses.some(r => 
      r.response_value?.includes('Optimisation') ||
      r.response_value?.includes('fiscal') ||
      r.response_value?.includes('impôt')
    );

    if (hasProperty) {
      score += 40;
      estimatedSavings += 3000;
    }

    if (hasRental) {
      score += 35;
      estimatedSavings += 2000;
    }

    if (hasOptimization) {
      score += 25;
      estimatedSavings += 1000;
    }

    const confidence = score >= 70 ? 'élevé' : score >= 40 ? 'moyen' : 'faible';
    return { savings: Math.round(estimatedSavings), score: Math.min(score, 100), confidence };
  }

  /**
   * Utilitaires
   */
  getFuelRate(typesCarburant: string[], secteur: string): number {
    if (!typesCarburant || typesCarburant.length === 0) {
      const tauxDefaut: { [key: string]: number } = {
        'Transport routier de marchandises': 0.177,
        'Transport routier de voyageurs': 0.177,
        'Taxi / VTC': 0.213,
        'BTP / Travaux publics': 0.150,
        'Secteur Agricole': 0.150
      };
      return tauxDefaut[secteur] || 0.177;
    }

    let maxRate = 0;
    typesCarburant.forEach(type => {
      const rate = this.tauxCarburant[type] || 0.177;
      if (rate > maxRate) maxRate = rate;
    });

    return maxRate;
  }

  getVehicleCoefficient(typesVehicules: string[]): number {
    if (!typesVehicules || typesVehicules.length === 0) return 0.7;

    let totalCoefficient = 0;
    typesVehicules.forEach(type => {
      totalCoefficient += this.coefficientsVehicules[type] || 0.5;
    });

    return totalCoefficient / typesVehicules.length;
  }
}

// Instance globale du calculateur
const eligibilityCalculator = new AdvancedEligibilityCalculator();

function generateRecommendations(productId: string, score: number, estimatedSavings: number): string[] {
  const recommendations: string[] = [];
  
  if (estimatedSavings > 0) {
    recommendations.push(`🎯 ÉLIGIBILITÉ POSSIBLE ! Gain potentiel de ${estimatedSavings.toLocaleString('fr-FR')}€`);
    recommendations.push(`💡 Inscrivez-vous pour une analyse approfondie de votre dossier`);
  } else {
    recommendations.push(`❌ Non éligible`);
    recommendations.push(`💡 Inscrivez-vous pour une analyse approfondie de votre dossier`);
  }
  
  return recommendations;
}

/**
 * Migrer les résultats de simulation vers ClientProduitEligible lors de l'inscription
 */
async function migrateSimulationToClient(sessionToken: string, clientId: string) {
  try {
    console.log(`🔄 Migration simulation ${sessionToken} vers client ${clientId}`);

    // Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      console.error('Session non trouvée:', sessionToken);
      return { success: false, error: 'Session non trouvée' };
    }

    // Récupérer les résultats d'éligibilité
    const { data: eligibilityResults, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id);

    if (eligibilityError) {
      console.error('Erreur récupération éligibilité:', eligibilityError);
      return { success: false, error: 'Erreur récupération éligibilité' };
    }

    // Récupérer les réponses pour recalculer si nécessaire
    const { data: responses, error: responsesError } = await supabase
      .from('TemporaryResponse')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Erreur récupération réponses:', responsesError);
    }

    const calculator = new AdvancedEligibilityCalculator();
    let migratedCount = 0;

    // Migrer chaque résultat
    for (const result of eligibilityResults || []) {
      let finalSavings = result.estimated_savings;
      let finalScore = result.eligibility_score;
      let finalConfidence = result.confidence_level;

      // Recalculer si le résultat est à 0
      if (result.estimated_savings === 0 && result.eligibility_score === 0 && responses) {
        if (result.produit_id === 'TICPE') {
          const recalculated = calculator.calculateTICPESavings(responses);
          finalSavings = recalculated.savings;
          finalScore = recalculated.score;
          finalConfidence = recalculated.confidence;
        }
      }

      // Vérifier si l'éligibilité existe déjà
      const { data: existingEligibility, error: existingError } = await supabase
        .from('ClientProduitEligible')
        .select('id')
        .eq('clientId', clientId)
        .eq('produitId', result.produit_id)
        .single();

      const eligibilityData = {
        clientId: clientId,
        produitId: result.produit_id,
        statut: finalScore >= 50 ? 'eligible' : 'non_eligible',
        tauxFinal: finalScore / 100,
        montantFinal: finalSavings,
        dureeFinale: 12, // 12 mois par défaut
        simulationId: session.id,
        metadata: {
          confidence_level: finalConfidence,
          recommendations: result.recommendations || [],
          session_token: session.session_token,
          migrated_at: new Date().toISOString()
        },
        notes: `Migration depuis simulateur - Score: ${finalScore}%, Confiance: ${finalConfidence}`,
        priorite: finalScore >= 80 ? 1 : finalScore >= 60 ? 2 : 3,
        dateEligibilite: new Date().toISOString(),
        current_step: 0,
        progress: 0
      };

      if (existingEligibility) {
        // Mettre à jour l'éligibilité existante
        const { error: updateError } = await supabase
          .from('ClientProduitEligible')
          .update(eligibilityData)
          .eq('id', existingEligibility.id);

        if (updateError) {
          console.error(`Erreur mise à jour éligibilité:`, updateError);
        } else {
          migratedCount++;
          console.log(`✅ Éligibilité mise à jour: ${result.produit_id} - ${finalSavings}€`);
        }
      } else {
        // Créer une nouvelle éligibilité
        const { error: insertError } = await supabase
          .from('ClientProduitEligible')
          .insert(eligibilityData);

        if (insertError) {
          console.error(`Erreur création éligibilité:`, insertError);
        } else {
          migratedCount++;
          console.log(`✅ Nouvelle éligibilité créée: ${result.produit_id} - ${finalSavings}€`);
        }
      }
    }

    // Marquer la session comme migrée
    const { error: updateSessionError } = await supabase
      .from('TemporarySession')
      .update({
        migrated_to_account: true,
        migrated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateSessionError) {
      console.error('Erreur marquage session migrée:', updateSessionError);
    }

    console.log(`✅ Migration terminée: ${migratedCount} éligibilités migrées`);
    return { success: true, migratedCount };

  } catch (error) {
    console.error('Erreur migration simulation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

// Route pour migrer une simulation vers un client (appelée lors de l'inscription)
router.post('/migrate/:sessionToken', async (req, res) => {
  try {
    const { sessionToken } = req.params;
    const { clientId } = req.body;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'clientId requis'
      });
    }

    const result = await migrateSimulationToClient(sessionToken, clientId);

    if (result.success) {
      return res.json({
        success: true,
        message: `Migration réussie: ${result.migratedCount} éligibilités migrées`
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Erreur migration:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la migration'
    });
  }
});

export default router; 