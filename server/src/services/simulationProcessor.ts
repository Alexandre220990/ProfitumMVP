import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'
import { DecisionEngine } from './decisionEngine'
import { RealTimeProcessor } from './realTimeProcessor'
import { ProductAmountCalculator, SimulationAnswers } from './ProductAmountCalculator'

// Types
type Operator = '=' | 'in' | '>' | '>=' | '<' | '<=' | 'contains'

interface Reponse {
  questionId: number
  valeur: string
}

interface RegleEligibilite {
  id: string
  produitId: string
  questionId: number
  operateur: Operator
  valeur: any
  poids: number
}

interface ProduitEvaluation {
  produitId: string | undefined
  score: number
  reglesSatisfaites: number
  poidsTotal: number
}

interface SimulationResult {
  success: boolean;
  data?: {
    simulation: {
      id: number;
      clientId: string;
      status: string;
    };
  };
  message?: string;
  error?: string;
}

// Configuration
const SEUIL_ELIGIBILITE = 0.6 // 60% des règles doivent être satisfaites

// Créer le client Supabase
function createSupabaseClient() {
  // Utiliser les informations exactes fournies
  const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co'
  // Toujours utiliser la clé ANON pour les opérations client
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk'
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variables d'environnement Supabase manquantes")
  }
  
  console.log(`🔌 Création d'un client Supabase pour ${supabaseUrl}`)
  console.log(`🔑 Utilisation de la clé ANON: ${supabaseKey.substring(0, 20)}...`)
  
  try {
    return createClient<Database>(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error('❌ Erreur lors de la création du client Supabase:', error)
    throw error
  }
}

// Fonction utilitaire pour évaluer une règle
function evaluerRegle(regle: RegleEligibilite, reponse?: string): boolean {
  if (!reponse) return false
  
  const valeurReponse = reponse
  const valeurRegle = regle.valeur

  switch (regle.operateur) {
    case '=':
      return valeurReponse === valeurRegle
    case 'in':
      return Array.isArray(valeurRegle) && valeurRegle.includes(valeurReponse)
    case '>':
      return Number(valeurReponse) > Number(valeurRegle)
    case '>=':
      return Number(valeurReponse) >= Number(valeurRegle)
    case '<':
      return Number(valeurReponse) < Number(valeurRegle)
    case '<=':
      return Number(valeurReponse) <= Number(valeurRegle)
    case 'contains':
      return typeof valeurRegle === 'string' && 
             typeof valeurReponse === 'string' && 
             valeurReponse.toLowerCase().includes(valeurRegle.toLowerCase())
    default:
      return false
  }
}

// Fonction pour évaluer l'éligibilité d'un produit
function evaluerProduit(
  regles: RegleEligibilite[],
  reponses: Reponse[]
): ProduitEvaluation {
  let reglesSatisfaites = 0
  let poidsTotal = 0

  for (const regle of regles) {
    const reponse = reponses.find(r => r.questionId === regle.questionId)
    poidsTotal += regle.poids

    if (evaluerRegle(regle, reponse?.valeur)) {
      reglesSatisfaites += regle.poids
    }
  }

  const score = poidsTotal > 0 ? reglesSatisfaites / poidsTotal : 0

  return {
    produitId: regles[0]?.produitId,
    score,
    reglesSatisfaites,
    poidsTotal
  }
}

/**
 * Fonction principale pour lancer une simulation pour un client
 * @param clientId UUID du client connecté
 * @returns Résultat de l'opération avec l'ID de simulation
 */
export async function lancerSimulation(clientId: string): Promise<SimulationResult> {
  const supabase = createSupabaseClient()
  
  try {
    // 1. Vérifier si une simulation en cours existe déjà
    const simulationEnCours = await verifierSimulationEnCours(supabase, clientId)
    
    if (simulationEnCours) {
      console.log(`Simulation en cours trouvée pour le client ${clientId}:`, simulationEnCours)
      return {
        success: true,
        data: {
          simulation: {
            id: simulationEnCours.id,
            clientId: simulationEnCours.clientId,
            status: simulationEnCours.statut
          }
        },
        message: "Simulation en cours trouvée. Redirection..."
      }
    }
    
    // 2. Créer une nouvelle simulation
    console.log(`Création d'une nouvelle simulation pour le client ${clientId}`)
    const { data: simulation, error } = await supabase
      .from('simulations')
      .insert({
        client_id: clientId,
        statut: 'en_cours',
        dateCreation: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error || !simulation) {
      console.error("Erreur lors de la création de la simulation:", error)
      return {
        success: false,
        error: error?.message || "Erreur lors de la création de la simulation"
      }
    }
    
    return {
      success: true,
      data: {
        simulation: {
          id: simulation.id,
          clientId: simulation.clientId,
          status: simulation.statut
        }
      },
      message: "Nouvelle simulation créée avec succès"
    }
  } catch (error) {
    console.error("Erreur inattendue lors du lancement de la simulation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inattendue"
    }
  }
}

/**
 * Vérifie si le client a déjà une simulation en cours
 * @param supabase Client Supabase
 * @param clientId UUID du client
 * @returns La simulation en cours ou null
 */
async function verifierSimulationEnCours(
  supabase: ReturnType<typeof createSupabaseClient>,
  clientId: string
) {
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'en_cours')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    // Pas de simulation en cours trouvée (PGSQL error code 406)
    if (error.code === '406') {
      return null
    }
    
    console.error("Erreur lors de la vérification de la simulation en cours:", error)
    throw error
  }
  
  return data
}

/**
 * 🆕 Transformer les réponses de la BDD vers le format SimulationAnswers
 */
function transformReponsesToAnswers(reponses: any[]): SimulationAnswers {
  const answers: SimulationAnswers = {};
  
  // Mapping question_order → propriété
  const questionMapping: Record<number, keyof SimulationAnswers> = {
    1: 'secteur',
    2: 'ca_tranche',
    3: 'nb_employes_tranche',
    4: 'proprietaire_locaux',
    5: 'contrats_energie',
    6: 'possede_vehicules',
    7: 'types_vehicules',
    8: 'niveau_impayes',
    9: 'depenses_rd',
    10: 'montant_rd_tranche',
    11: 'litres_carburant_mois',
    12: 'nb_chauffeurs',
    13: 'montant_taxe_fonciere',
    14: 'montant_factures_energie_mois',
    15: 'export_annuel'
  };
  
  for (const reponse of reponses) {
    const questionOrder = reponse.questionId;
    const propertyName = questionMapping[questionOrder];
    
    if (propertyName) {
      // Conversion selon le type
      if (propertyName === 'types_vehicules') {
        // Choix multiple → array
        (answers as any)[propertyName] = Array.isArray(reponse.valeur) ? reponse.valeur : [reponse.valeur];
      } else if (['litres_carburant_mois', 'nb_chauffeurs', 'montant_taxe_fonciere', 'montant_factures_energie_mois'].includes(propertyName)) {
        // Nombre → number
        (answers as any)[propertyName] = typeof reponse.valeur === 'number' 
          ? reponse.valeur 
          : parseInt(reponse.valeur || '0', 10);
      } else {
        // String → string
        (answers as any)[propertyName] = reponse.valeur;
      }
    }
  }
  
  return answers;
}

/**
 * Traite une simulation terminée et identifie les produits éligibles
 * @param simulationId ID de la simulation à traiter
 * @returns Résultat du traitement
 */
export async function traiterSimulation(simulationId: number): Promise<SimulationResult> {
  const supabase = createSupabaseClient()
  const decisionEngine = new DecisionEngine()
  const realTimeProcessor = new RealTimeProcessor()
  
  try {
    console.log(`Début du traitement de la simulation ${simulationId}`)
    
    // 1. Récupérer la simulation et vérifier son existence
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('*, client_id')
      .eq('id', simulationId)
      .single()
    
    if (simError || !simulation) {
      throw new Error(`Simulation ${simulationId} non trouvée`)
    }
    
    // 2. Récupérer toutes les réponses de la simulation
    const { data: reponses, error: repError } = await supabase
      .from('Reponse')
      .select('questionId, valeur')
      .eq('simulationId', simulationId)
    
    if (repError || !reponses) {
      throw new Error('Erreur lors de la récupération des réponses')
    }
    
    // 3. Convertir les réponses au format attendu par le moteur de décision
    const answers = reponses.map(r => ({
      questionId: r.questionId,
      value: r.valeur,
      timestamp: new Date()
    }))
    
    // 4. Évaluer l'éligibilité avec le nouveau moteur de décision
    const eligibleProducts = await decisionEngine.evaluateEligibility(
      simulationId.toString(),
      answers
    )
    
    console.log(`✅ ${eligibleProducts.length} produits éligibles identifiés pour la simulation ${simulationId}`)
    
    // 5. **NOUVEAU** : Créer les ClientProduitEligible (liaison Client ↔ Produits)
    if (simulation.client_id && eligibleProducts.length > 0) {
      console.log(`📦 Création des ClientProduitEligible pour le client ${simulation.client_id}`)
      
      // Récupérer TOUS les produits actifs
      const { data: allProducts, error: productsError } = await supabase
        .from('ProduitEligible')
        .select('id, nom')
        .eq('active', true)
        .order('nom')
      
      if (productsError || !allProducts) {
        console.error('⚠️ Erreur récupération produits:', productsError)
      } else {
        // 🆕 Transformer les réponses pour le nouveau calculateur
        const simulationAnswers = transformReponsesToAnswers(reponses);
        
        // 🆕 Calculer les montants précis avec ProductAmountCalculator
        const calculatedProducts = ProductAmountCalculator.calculateAllProducts(simulationAnswers);
        console.log(`💰 Calcul précis effectué pour ${calculatedProducts.length} produits`);
        
        // Créer les entrées pour TOUS les produits (éligibles ET non éligibles)
        const produitsToInsert = allProducts.map((produit, index) => {
          const eligibility = eligibleProducts.find(ep => ep.productId === produit.id)
          const isEligible = !!eligibility
          
          // 🆕 Récupérer le résultat calculé précisément
          const calculatedResult = calculatedProducts.find(
            cp => cp.produit_id === produit.nom || cp.produit_nom.includes(produit.nom)
          );
          
          // 🆕 Utiliser le montant calculé au lieu de score * 1000
          const montantFinal = calculatedResult?.estimated_savings || 
                              (isEligible ? (eligibility.score * 1000) : null);
          
          return {
            clientId: simulation.client_id,
            produitId: produit.id,
            simulationId: simulationId,
            statut: isEligible ? 'eligible' : 'non_eligible',
            tauxFinal: isEligible ? (eligibility.score / 100) : null,
            montantFinal: montantFinal,
            dureeFinale: isEligible ? 12 : null,
            priorite: isEligible ? (eligibleProducts.indexOf(eligibility) + 1) : (index + 10),
            notes: isEligible 
              ? `Produit éligible via simulation - Score: ${eligibility.score.toFixed(2)}% - Calcul: ${calculatedResult?.calculation_details?.formula || 'N/A'}` 
              : 'Produit non éligible selon simulation',
            metadata: {
              source: 'simulation_processor',
              simulation_id: simulationId,
              detected_at: new Date().toISOString(),
              is_eligible: isEligible,
              score: isEligible ? eligibility.score : 0,
              satisfied_rules: isEligible ? eligibility.satisfiedRules : 0,
              total_rules: isEligible ? eligibility.totalRules : 0,
              details: isEligible ? eligibility.details : [],
              calculation_method: calculatedResult?.calculation_details?.formula,
              calculation_inputs: calculatedResult?.calculation_details?.inputs,
              product_type: calculatedResult?.type
            },
            dateEligibilite: isEligible ? new Date().toISOString() : null,
            current_step: isEligible ? 0 : 0,
            progress: isEligible ? 0 : 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })
        
        // Insérer TOUS les produits
        const { error: insertError } = await supabase
          .from('ClientProduitEligible')
          .insert(produitsToInsert)
        
        if (insertError) {
          console.error('❌ Erreur lors de la création des ClientProduitEligible:', insertError)
          // Ne pas faire échouer la simulation pour autant
        } else {
          const nbEligibles = produitsToInsert.filter(p => p.statut === 'eligible').length
          const nbNonEligibles = produitsToInsert.filter(p => p.statut === 'non_eligible').length
          console.log(`✅ ${produitsToInsert.length} ClientProduitEligible créés (${nbEligibles} éligibles, ${nbNonEligibles} non éligibles)`)
          
          // Générer automatiquement les étapes pour les produits éligibles
          for (const produit of produitsToInsert.filter(p => p.statut === 'eligible')) {
            try {
              // Récupérer l'ID du ClientProduitEligible juste créé
              const { data: cpe } = await supabase
                .from('ClientProduitEligible')
                .select('id')
                .eq('clientId', simulation.client_id)
                .eq('produitId', produit.produitId)
                .eq('simulationId', simulationId)
                .single()
              
              if (cpe) {
                const { DossierStepGenerator } = require('./dossierStepGenerator')
                await DossierStepGenerator.generateStepsForDossier(cpe.id)
                console.log(`  ✅ Étapes générées pour ${produit.produitId}`)
              }
            } catch (stepError) {
              const errorMessage = stepError instanceof Error ? stepError.message : String(stepError)
              console.warn(`  ⚠️ Erreur génération étapes:`, errorMessage)
            }
          }
        }
      }
    }
    
    // 6. Mettre à jour la simulation avec les résultats
    const now = new Date().toISOString()
    
    // 7. Créer une entrée dans SimulationProcessed
    const { error: archiveError } = await supabase
      .from('SimulationProcessed')
      .insert({
        clientid: simulation.client_id,
        simulationid: simulationId,
        dateprocessed: now,
        produitseligiblesids: eligibleProducts.map(p => p.productId),
        produitsdetails: eligibleProducts,
        rawanswers: reponses,
        score: eligibleProducts.length > 0 
          ? eligibleProducts.reduce((acc, p) => acc + p.score, 0) / eligibleProducts.length
          : 0,
        dureeanalysems: 0,
        statut: 'traité',
        createdat: now,
        updatedat: now
      })
    
    if (archiveError) {
      console.error("Erreur lors de l'archivage de la simulation:", archiveError)
    }
    
    // 8. Mettre à jour le statut de la simulation
    const { error: updateError } = await supabase
      .from('simulations')
      .update({
        status: 'completed',
        results: {
          eligible_products: eligibleProducts,
          processed_at: now,
          score: eligibleProducts.length > 0 
            ? eligibleProducts.reduce((acc, p) => acc + p.score, 0) / eligibleProducts.length
            : 0
        },
        updated_at: now
      })
      .eq('id', simulationId)
    
    if (updateError) {
      throw new Error('Erreur lors de la mise à jour du statut de la simulation')
    }
    
    console.log(`Traitement de la simulation ${simulationId} terminé avec succès`)
    
    return {
      success: true,
      data: {
        simulation: {
          id: simulationId,
          clientId: simulation.clientId,
          status: 'terminée'
        }
      },
      message: `Simulation ${simulationId} traitée avec ${eligibleProducts.length} produits éligibles identifiés`
    }
    
  } catch (error) {
    console.error('Erreur lors du traitement de la simulation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inattendue lors du traitement"
    }
  }
}