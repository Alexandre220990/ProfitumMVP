import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'
import { DecisionEngine } from './decisionEngine'
import { RealTimeProcessor } from './realTimeProcessor'

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
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk'
  
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
      .from('Simulation')
      .insert({
        clientId,
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
    
    // 5. Mettre à jour la simulation avec les résultats
    const now = new Date().toISOString()
    
    // 6. Créer une entrée dans SimulationProcessed
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
    
    // 7. Mettre à jour le statut de la simulation
    const { error: updateError } = await supabase
      .from('Simulation')
      .update({
        statut: 'terminée',
        score: eligibleProducts.length > 0 
          ? eligibleProducts.reduce((acc, p) => acc + p.score, 0) / eligibleProducts.length
          : 0,
        updatedAt: now
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