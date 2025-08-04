import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Route de diagnostic pour vérifier l'état des tables
router.get('/tables', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Début du diagnostic des tables');
    
    const results: any = {};
    
    // Tables à vérifier
    const tables = ['Client', 'ClientProduitEligible', 'ProduitEligible', 'simulations', 'DossierStep'];
    
    for (const table of tables) {
      console.log(`🔍 Vérification de la table ${table}`);
      
      try {
        // Vérifier l'existence de la table
        const { data: tableExists, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError) {
          results[table] = {
            status: 'error',
            message: tableError.message,
            code: tableError.code
          };
          console.error(`❌ Erreur pour ${table}:`, tableError);
        } else {
          // Vérifier la structure de la table
          const { data: columns, error: columnsError } = await supabase
            .rpc('get_table_columns', { table_name: table });
          
          if (columnsError) {
            // Fallback: essayer de récupérer un échantillon
            const { data: sample, error: sampleError } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            results[table] = {
              status: 'exists',
              count: sample?.length || 0,
              sample: sample?.[0] || null,
              columnsError: columnsError.message
            };
          } else {
            results[table] = {
              status: 'exists',
              columns: columns,
              count: tableExists?.length || 0
            };
          }
          
          console.log(`✅ Table ${table} OK`);
        }
      } catch (error) {
        results[table] = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Erreur inconnue'
        };
        console.error(`❌ Erreur globale pour ${table}:`, error);
      }
    }
    
    // Test spécifique pour ClientProduitEligible
    console.log('🔍 Test spécifique ClientProduitEligible');
    try {
      const { data: clientProduits, error: cpeError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          produitId,
          statut,
          expert_id,
          montantFinal,
          tauxFinal,
          dureeFinale,
          current_step,
          progress,
          created_at,
          updated_at,
          ProduitEligible!inner (
            id,
            nom,
            description,
            category
          )
        `)
        .limit(1);
      
      if (cpeError) {
        results.ClientProduitEligibleTest = {
          status: 'error',
          message: cpeError.message,
          code: cpeError.code,
          details: cpeError.details
        };
        console.error('❌ Erreur test ClientProduitEligible:', cpeError);
      } else {
        results.ClientProduitEligibleTest = {
          status: 'success',
          count: clientProduits?.length || 0,
          sample: clientProduits?.[0] || null
        };
        console.log('✅ Test ClientProduitEligible OK');
      }
    } catch (error) {
      results.ClientProduitEligibleTest = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      console.error('❌ Erreur test ClientProduitEligible:', error);
    }
    
    return res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du diagnostic',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router; 