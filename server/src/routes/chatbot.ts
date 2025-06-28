import express from 'express';
import { Pool } from 'pg';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import ProductValidationOrchestrator from '../services/productValidationOrchestrator';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';

dotenv.config();

const router = express.Router();

// Pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

// OpenAI (optionnel)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Instance du service de validation des produits
const productValidationOrchestrator = new ProductValidationOrchestrator();

// Fonction de mapping des noms de produits
const mapProductName = (chatbotName: string): string => {
  const mapping: { [key: string]: string } = {
    'Récupération TICPE': 'TICPE',
    'Optimisation Taxe Foncière': 'Foncier',
    'Optimisation URSSAF': 'URSSAF',
    'Déduction Forfaitaire Spécifique': 'DFS',
    'Optimisation Énergie': 'Optimisation Énergie',
    'Aides CEE': 'CEE',
    'Optimisation MSA': 'MSA'
  };
  
  return mapping[chatbotName] || chatbotName;
};

// Route principale pour la conversation
router.post('/message', async (req, res) => {
  try {
    const { client_id, message, history, simulation_id } = req.body;
    if (!client_id || !message) {
      return res.status(400).json({ success: false, error: 'client_id et message sont requis.' });
    }

    console.log('Message reçu:', { client_id, message, simulation_id });

    // Utiliser le ProductValidationOrchestrator pour traiter le message
    const effectiveSimulationId = simulation_id || client_id;
    
    try {
      console.log('🎯 Utilisation du ProductValidationOrchestrator');
      
      // Convertir l'historique au format attendu
      const conversationHistory = (history || []).map((msg: any) => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text || msg.content,
        timestamp: new Date(msg.time || msg.timestamp || Date.now())
      }));

      // Traiter le message avec l'orchestrateur
      const result = await productValidationOrchestrator.processUserMessage(
        effectiveSimulationId,
        client_id,
        message,
        conversationHistory
      );

      // Formater la réponse avec les produits éligibles
      const response = {
        success: true,
        reply: result.response,
        source: 'product_validation_orchestrator',
        conversation_complete: result.isComplete,
        phase: result.phase,
        client_profile: result.profileData,
        produits_eligibles: result.eligibleProducts.map(p => ({
          id: p.id,
          nom: p.nom,
          description: p.description,
          priority: 'high',
          score: 100,
          reasons: p.reasons,
          missingRequirements: [],
          gainPotentiel: p.estimatedGain,
          tauxMin: 0,
          tauxMax: 100,
          montantMin: 1000,
          montantMax: p.estimatedGain,
          dureeMin: 12,
          dureeMax: 36
        })),
        recommendations: result.eligibleProducts.map(p => ({
          id: p.id,
          nom: p.nom,
          description: p.description,
          priority: 'high',
          gain_potentiel: p.estimatedGain
        }))
      };

      return res.json(response);

    } catch (orchestratorError) {
      console.error('❌ Erreur ProductValidationOrchestrator:', orchestratorError);
      
      // Fallback intelligent minimal en cas d'erreur technique
      return res.json({
        success: true,
        reply: "🤖 **Assistant Profitum intelligent**\n\nJe vais vous accompagner pour identifier vos opportunités d'optimisation fiscale.\n\n❓ **Commençons par votre profil :**\nDans quel secteur d'activité évoluez-vous ?\n\n💡 *Exemples : transport, industrie, commerce, services, agriculture...*",
        source: 'smart_fallback',
        conversation_complete: false,
        phase: 'collecting_profile',
        client_profile: { besoinsSpecifiques: [] },
        produits_eligibles: [],
        recommendations: []
      });
    }

  } catch (error) {
    console.error('❌ Erreur route chatbot:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur système',
      reply: "🤖 **Désolé, je rencontre un problème technique.**\n\nPouvez-vous réessayer dans quelques instants ?",
      source: 'error_fallback'
    });
  }
});

// Route pour sauvegarder les résultats du chatbot (SANS AUTHENTIFICATION)
router.post('/save-results', async (req, res) => {
  try {
    const { clientId, eligibleProducts, profileData } = req.body;
    
    console.log('💾 Sauvegarde des résultats du chatbot pour le client:', clientId);
    console.log('📦 Produits éligibles:', eligibleProducts);
    
    if (!clientId || !eligibleProducts || !Array.isArray(eligibleProducts)) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes ou invalides'
      });
    }

    // 1. Créer une nouvelle simulation dans la table Simulation
    const { data: newSimulation, error: simulationError } = await supabase
      .from('Simulation')
      .insert({
        clientId: clientId,
        dateCreation: new Date().toISOString(),
        statut: 'termine',
        type: 'chatbot',
        source: 'profitum',
        score: 100,
        tempsCompletion: 0,
        Answers: {
          source: 'chatbot',
          profileData: profileData,
          eligibleProducts: eligibleProducts
        },
        metadata: {}
      })
      .select()
      .single();
      
    if (simulationError) {
      console.error('❌ Erreur création simulation:', simulationError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la simulation'
      });
    }
    
    console.log('✅ Simulation créée avec ID:', newSimulation.id);
    
    const savedProducts = [];
    
    for (const product of eligibleProducts) {
      try {
        // Mapper le nom du produit du chatbot vers le nom de la base de données
        const mappedProductName = mapProductName(product.nom);
        console.log(`🔄 Mapping: "${product.nom}" -> "${mappedProductName}"`);
        
        // 2. Trouver le produit correspondant dans la table ProduitEligible
        const { data: produitEligible, error: produitError } = await supabase
          .from('ProduitEligible')
          .select('*')
          .eq('nom', mappedProductName)
          .single();
          
        if (produitError || !produitEligible) {
          console.warn(`⚠️ Produit non trouvé: ${mappedProductName} (original: ${product.nom})`);
          continue;
        }
        
        // 3. Vérifier s'il existe déjà un ClientProduitEligible pour ce client et ce produit
        const { data: existingProduct, error: checkError } = await supabase
          .from('ClientProduitEligible')
          .select('*')
          .eq('clientId', clientId)
          .eq('produitId', produitEligible.id)
          .single();
          
        if (existingProduct) {
          console.log(`⚠️ Produit déjà existant pour ce client: ${mappedProductName}`);
          savedProducts.push(existingProduct);
          continue;
        }
        
        // 4. Sauvegarder en ClientProduitEligible avec le bon simulationId
        const { data: savedProduct, error: saveError } = await supabase
          .from('ClientProduitEligible')
          .insert({
            clientId: clientId,
            produitId: produitEligible.id,
            simulationId: newSimulation.id, // Utiliser l'ID de la simulation créée
            statut: 'eligible',
            tauxFinal: 0.85, // Taux par défaut
            montantFinal: product.estimatedGain || product.gainPotentiel || 0,
            dureeFinale: 12, // Durée par défaut en mois
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (saveError) {
          console.error(`❌ Erreur sauvegarde produit ${mappedProductName}:`, saveError);
          continue;
        }
        
        savedProducts.push(savedProduct);
        console.log(`✅ Produit sauvegardé: ${mappedProductName} (original: ${product.nom})`);
        
      } catch (error) {
        console.error(`❌ Erreur pour le produit ${product.nom}:`, error);
      }
    }
    
    console.log(`✅ ${savedProducts.length} produits sauvegardés sur ${eligibleProducts.length}`);
    
    res.json({
      success: true,
      message: `${savedProducts.length} produits éligibles sauvegardés`,
      data: {
        savedProducts,
        simulationId: newSimulation.id
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde résultats chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde des résultats'
    });
  }
});

export default router;