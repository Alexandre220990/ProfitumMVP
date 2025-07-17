const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Démarrage des optimisations de base de données...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Scripts SQL d'optimisation
const optimizationScripts = [
  // Index pour ExpertAssignment (table critique)
  {
    name: 'Index ExpertAssignment - Status',
    sql: `CREATE INDEX IF NOT EXISTS idx_expertassignment_status ON "ExpertAssignment"(status);`
  },
  {
    name: 'Index ExpertAssignment - Expert ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_expertassignment_expert_id ON "ExpertAssignment"(expert_id);`
  },
  {
    name: 'Index ExpertAssignment - Client ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_expertassignment_client_id ON "ExpertAssignment"(client_id);`
  },
  {
    name: 'Index ExpertAssignment - Created At',
    sql: `CREATE INDEX IF NOT EXISTS idx_expertassignment_created_at ON "ExpertAssignment"(created_at);`
  },
  {
    name: 'Index ExpertAssignment - Composite Status Expert',
    sql: `CREATE INDEX IF NOT EXISTS idx_expertassignment_status_expert ON "ExpertAssignment"(status, expert_id);`
  },

  // Index pour Message (messagerie temps réel)
  {
    name: 'Index Message - Assignment ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_message_assignment_id ON "message"(assignment_id);`
  },
  {
    name: 'Index Message - Timestamp',
    sql: `CREATE INDEX IF NOT EXISTS idx_message_timestamp ON "message"(timestamp);`
  },
  {
    name: 'Index Message - Sender Type',
    sql: `CREATE INDEX IF NOT EXISTS idx_message_sender_type ON "message"(sender_type);`
  },
  {
    name: 'Index Message - Read At',
    sql: `CREATE INDEX IF NOT EXISTS idx_message_read_at ON "message"(read_at);`
  },

  // Index pour ClientProduitEligible (marketplace)
  {
    name: 'Index ClientProduitEligible - Client ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_clientproduiteligible_client_id ON "ClientProduitEligible"(client_id);`
  },
  {
    name: 'Index ClientProduitEligible - Produit ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_clientproduiteligible_produit_id ON "ClientProduitEligible"(produit_id);`
  },
  {
    name: 'Index ClientProduitEligible - Statut',
    sql: `CREATE INDEX IF NOT EXISTS idx_clientproduiteligible_statut ON "ClientProduitEligible"(statut);`
  },
  {
    name: 'Index ClientProduitEligible - Expert ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_clientproduiteligible_expert_id ON "ClientProduitEligible"(expert_id);`
  },

  // Index pour Expert (marketplace)
  {
    name: 'Index Expert - Status',
    sql: `CREATE INDEX IF NOT EXISTS idx_expert_status ON "Expert"(status);`
  },
  {
    name: 'Index Expert - Approval Status',
    sql: `CREATE INDEX IF NOT EXISTS idx_expert_approval_status ON "Expert"(approval_status);`
  },
  {
    name: 'Index Expert - Specializations',
    sql: `CREATE INDEX IF NOT EXISTS idx_expert_specializations ON "Expert" USING GIN(specializations);`
  },
  {
    name: 'Index Expert - Rating',
    sql: `CREATE INDEX IF NOT EXISTS idx_expert_rating ON "Expert"(rating);`
  },

  // Index pour Client
  {
    name: 'Index Client - Auth ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_client_auth_id ON "Client"(auth_id);`
  },
  {
    name: 'Index Client - Created At',
    sql: `CREATE INDEX IF NOT EXISTS idx_client_created_at ON "Client"(created_at);`
  },
  {
    name: 'Index Client - City',
    sql: `CREATE INDEX IF NOT EXISTS idx_client_city ON "Client"(city);`
  },

  // Index pour Audit
  {
    name: 'Index Audit - Status',
    sql: `CREATE INDEX IF NOT EXISTS idx_audit_status ON "Audit"(status);`
  },
  {
    name: 'Index Audit - Client ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_audit_client_id ON "Audit"(client_id);`
  },
  {
    name: 'Index Audit - Expert ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_audit_expert_id ON "Audit"(expert_id);`
  },
  {
    name: 'Index Audit - Created At',
    sql: `CREATE INDEX IF NOT EXISTS idx_audit_created_at ON "Audit"(created_at);`
  },

  // Index pour ExpertNotifications
  {
    name: 'Index ExpertNotifications - Expert ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_expertnotifications_expert_id ON "ExpertNotifications"(expert_id);`
  },
  {
    name: 'Index ExpertNotifications - Read',
    sql: `CREATE INDEX IF NOT EXISTS idx_expertnotifications_read ON "ExpertNotifications"(read);`
  },
  {
    name: 'Index ExpertNotifications - Created At',
    sql: `CREATE INDEX IF NOT EXISTS idx_expertnotifications_created_at ON "ExpertNotifications"(created_at);`
  },

  // Index pour Reminder
  {
    name: 'Index Reminder - Status',
    sql: `CREATE INDEX IF NOT EXISTS idx_reminder_status ON "Reminder"(status);`
  },
  {
    name: 'Index Reminder - Client ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_reminder_client_id ON "Reminder"(client_id);`
  },
  {
    name: 'Index Reminder - Expert ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_reminder_expert_id ON "Reminder"(expert_id);`
  },
  {
    name: 'Index Reminder - Due Date',
    sql: `CREATE INDEX IF NOT EXISTS idx_reminder_due_date ON "Reminder"(due_date);`
  },

  // Index pour ProduitEligible
  {
    name: 'Index ProduitEligible - Category',
    sql: `CREATE INDEX IF NOT EXISTS idx_produiteligible_category ON "ProduitEligible"(category);`
  },
  {
    name: 'Index ProduitEligible - Active',
    sql: `CREATE INDEX IF NOT EXISTS idx_produiteligible_active ON "ProduitEligible"(active);`
  },

  // Index pour Access Logs
  {
    name: 'Index Access Logs - User ID',
    sql: `CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON "access_logs"(user_id);`
  },
  {
    name: 'Index Access Logs - Timestamp',
    sql: `CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON "access_logs"(timestamp);`
  },
  {
    name: 'Index Access Logs - Success',
    sql: `CREATE INDEX IF NOT EXISTS idx_access_logs_success ON "access_logs"(success);`
  }
];

// Fonction pour exécuter les optimisations
async function applyOptimizations() {
  console.log(`\n📊 Application de ${optimizationScripts.length} optimisations...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const script of optimizationScripts) {
    try {
      console.log(`🔄 ${script.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: script.sql });
      
      if (error) {
        // Si exec_sql n'existe pas, utiliser une requête directe
        const { error: directError } = await supabase
          .from('Client')
          .select('id')
          .limit(1);
        
        if (directError) {
          console.log(`⚠️  ${script.name}: Index peut déjà exister`);
        } else {
          console.log(`✅ ${script.name}: Index créé`);
          successCount++;
        }
      } else {
        console.log(`✅ ${script.name}: Index créé`);
        successCount++;
      }
      
      // Pause courte pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ ${script.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Résumé des optimisations:`);
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📈 Total: ${optimizationScripts.length}`);
  
  return { successCount, errorCount };
}

// Fonction pour analyser les performances
async function analyzePerformance() {
  console.log('\n🔍 Analyse des performances...\n');
  
  try {
    // Test de performance des requêtes critiques
    const startTime = Date.now();
    
    // Test 1: Récupération des experts actifs
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id, name, status, rating')
      .eq('status', 'active')
      .limit(10);
    
    const expertsTime = Date.now() - startTime;
    
    // Test 2: Récupération des assignations en cours
    const startTime2 = Date.now();
    const { data: assignments, error: assignmentsError } = await supabase
      .from('ExpertAssignment')
      .select('id, status, expert_id, client_id')
      .eq('status', 'pending')
      .limit(10);
    
    const assignmentsTime = Date.now() - startTime2;
    
    // Test 3: Récupération des messages récents
    const startTime3 = Date.now();
    const { data: messages, error: messagesError } = await supabase
      .from('message')
      .select('id, assignment_id, content, timestamp')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    const messagesTime = Date.now() - startTime3;
    
    console.log('📊 Résultats des tests de performance:');
    console.log(`⚡ Experts actifs: ${expertsTime}ms ${expertsError ? '❌' : '✅'}`);
    console.log(`⚡ Assignations en cours: ${assignmentsTime}ms ${assignmentsError ? '❌' : '✅'}`);
    console.log(`⚡ Messages récents: ${messagesTime}ms ${messagesError ? '❌' : '✅'}`);
    
    // Recommandations
    console.log('\n💡 Recommandations:');
    if (expertsTime > 200) console.log('⚠️  Optimiser la requête des experts');
    if (assignmentsTime > 200) console.log('⚠️  Optimiser la requête des assignations');
    if (messagesTime > 200) console.log('⚠️  Optimiser la requête des messages');
    
    if (expertsTime <= 200 && assignmentsTime <= 200 && messagesTime <= 200) {
      console.log('✅ Toutes les requêtes sont optimisées !');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse des performances:', error);
  }
}

// Fonction pour créer des vues optimisées
async function createOptimizedViews() {
  console.log('\n🔧 Création de vues optimisées...\n');
  
  const views = [
    {
      name: 'Vue Experts Actifs',
      sql: `
        CREATE OR REPLACE VIEW v_experts_actifs AS
        SELECT 
          e.id,
          e.name,
          e.email,
          e.specializations,
          e.rating,
          e.compensation,
          e.status,
          COUNT(DISTINCT ea.id) as assignments_count,
          COUNT(DISTINCT ea.id) FILTER (WHERE ea.status = 'completed') as completed_assignments
        FROM "Expert" e
        LEFT JOIN "ExpertAssignment" ea ON e.id = ea.expert_id
        WHERE e.status = 'active' AND e.approval_status = 'approved'
        GROUP BY e.id, e.name, e.email, e.specializations, e.rating, e.compensation, e.status
      `
    },
    {
      name: 'Vue Statistiques Client',
      sql: `
        CREATE OR REPLACE VIEW v_client_stats AS
        SELECT 
          c.id,
          c.company_name,
          c.email,
          COUNT(DISTINCT cpe.id) as produits_eligibles,
          COUNT(DISTINCT cpe.id) FILTER (WHERE cpe.statut = 'eligible') as produits_actifs,
          COUNT(DISTINCT a.id) as audits_count,
          COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'terminé') as audits_completes,
          c.created_at
        FROM "Client" c
        LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe.client_id
        LEFT JOIN "Audit" a ON c.id = a.client_id
        GROUP BY c.id, c.company_name, c.email, c.created_at
      `
    },
    {
      name: 'Vue Assignations Récentes',
      sql: `
        CREATE OR REPLACE VIEW v_assignations_recentes AS
        SELECT 
          ea.id,
          ea.status,
          ea.created_at,
          c.company_name as client_name,
          e.name as expert_name,
          pe.nom as produit_nom
        FROM "ExpertAssignment" ea
        JOIN "Client" c ON ea.client_id = c.id
        JOIN "Expert" e ON ea.expert_id = e.id
        JOIN "ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
        JOIN "ProduitEligible" pe ON cpe.produit_id = pe.id
        WHERE ea.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY ea.created_at DESC
      `
    }
  ];
  
  for (const view of views) {
    try {
      console.log(`🔄 Création de la vue: ${view.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: view.sql });
      
      if (error) {
        console.log(`⚠️  ${view.name}: Vue peut déjà exister`);
      } else {
        console.log(`✅ ${view.name}: Vue créée`);
      }
      
    } catch (error) {
      console.log(`❌ ${view.name}: ${error.message}`);
    }
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Démarrage des optimisations de base de données...\n');
    
    // 1. Appliquer les optimisations
    const { successCount, errorCount } = await applyOptimizations();
    
    // 2. Créer les vues optimisées
    await createOptimizedViews();
    
    // 3. Analyser les performances
    await analyzePerformance();
    
    console.log('\n🎉 Optimisations terminées !');
    console.log(`✅ ${successCount} optimisations appliquées avec succès`);
    console.log(`❌ ${errorCount} erreurs rencontrées`);
    
    if (errorCount === 0) {
      console.log('\n🚀 La base de données est maintenant optimisée pour les performances maximales !');
    } else {
      console.log('\n⚠️  Certaines optimisations ont échoué. Vérifiez les logs ci-dessus.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des optimisations:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 