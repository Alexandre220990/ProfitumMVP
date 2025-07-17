const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Application des parties finales de la migration...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour proposer les corrections finales
function proposeFinalCorrections() {
  console.log('\n📋 Parties Finales à Appliquer:');
  console.log('================================');
  console.log('');
  console.log('1. Aller dans Supabase SQL Editor');
  console.log('2. Exécuter les instructions suivantes une par une:');
  console.log('');
  
  console.log('--- PARTIE 1: Créer la vue v_messages_with_users ---');
  console.log(`
CREATE OR REPLACE VIEW public.v_messages_with_users AS
SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.timestamp,
    m.created_at,
    m.updated_at,
    c.title as conversation_title,
    CASE 
        WHEN e.id IS NOT NULL THEN e.name
        WHEN cl.id IS NOT NULL THEN cl.company_name
        ELSE 'Utilisateur inconnu'
    END as sender_name,
    CASE 
        WHEN e.id IS NOT NULL THEN 'expert'
        WHEN cl.id IS NOT NULL THEN 'client'
        ELSE 'unknown'
    END as sender_type
FROM public.message m
LEFT JOIN public."Conversation" c ON m.conversation_id = c.id
LEFT JOIN public."Expert" e ON m.sender_id = e.id
LEFT JOIN public."Client" cl ON m.sender_id = cl.id
ORDER BY m.timestamp DESC;
  `);
  
  console.log('--- PARTIE 2: Créer la vue v_assignment_reports ---');
  console.log(`
CREATE OR REPLACE VIEW public.v_assignment_reports AS
SELECT 
    DATE_TRUNC('month', ea.created_at) as month,
    pe.category,
    ea.statut,
    COUNT(*) as count,
    COUNT(DISTINCT ea.expert_id) as unique_experts,
    COUNT(DISTINCT cpe."clientId") as unique_clients
FROM public.expertassignment ea
LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
LEFT JOIN public."ProduitEligible" pe ON cpe."produitId" = pe.id
GROUP BY DATE_TRUNC('month', ea.created_at), pe.category, ea.statut
ORDER BY month DESC, category, statut;
  `);
  
  console.log('--- PARTIE 3: Créer la fonction get_assignment_statistics ---');
  console.log(`
CREATE OR REPLACE FUNCTION public.get_assignment_statistics()
RETURNS TABLE (
    statut VARCHAR(50),
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            statut,
            COUNT(*) as count,
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
        FROM public.expertassignment
        GROUP BY statut
    )
    SELECT 
        statut,
        count,
        ROUND(percentage, 2) as percentage
    FROM stats
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
  
  console.log('--- PARTIE 4: Créer la fonction get_expert_assignments_by_status ---');
  console.log(`
CREATE OR REPLACE FUNCTION public.get_expert_assignments_by_status(status_filter VARCHAR(50))
RETURNS TABLE (
    assignment_id UUID,
    expert_name TEXT,
    client_name TEXT,
    produit_nom TEXT,
    statut VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id::UUID,
        e.name::TEXT,
        c.company_name::TEXT,
        pe.nom::TEXT,
        ea.statut,
        ea.created_at
    FROM public.expertassignment ea
    LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
    LEFT JOIN public."Client" c ON cpe."clientId" = c.id
    LEFT JOIN public."ProduitEligible" pe ON cpe."produitId" = pe.id
    LEFT JOIN public."Expert" e ON ea.expert_id = e.id
    WHERE ea.statut = status_filter
    ORDER BY ea.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
  
  console.log('--- PARTIE 5: Activer RLS et créer les politiques ---');
  console.log(`
-- Activer RLS
ALTER TABLE public.expertassignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.expertassignment;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.message;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.notification;

-- Créer les nouvelles politiques
CREATE POLICY "Enable read access for authenticated users" ON public.expertassignment
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.message
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.notification
FOR SELECT USING (auth.role() = 'authenticated');
  `);
  
  console.log('');
  console.log('💡 Exécute ces parties une par une');
  console.log('⏱️ Attends 10-15 secondes entre chaque partie');
  console.log('🎯 Objectif: Compléter la migration pour pouvoir démarrer le dashboard admin');
}

// Fonction pour afficher le statut actuel
function displayCurrentStatus() {
  console.log('\n📊 Statut Actuel:');
  console.log('=================');
  console.log('✅ Colonnes ajoutées: client_produit_eligible_id, statut, category, active, timestamp');
  console.log('✅ Vue principale: v_expert_assignments');
  console.log('✅ Jointures: Expert, Client, ProduitEligible, ClientProduitEligible');
  console.log('✅ Données: Jointures fonctionnent avec données réelles');
  console.log('');
  console.log('⏳ En attente:');
  console.log('- Vue v_messages_with_users');
  console.log('- Vue v_assignment_reports');
  console.log('- Fonctions de statistiques');
  console.log('- Politiques RLS');
  console.log('');
  console.log('🎯 Progression: ~75% terminé');
}

// Fonction principale
async function main() {
  try {
    console.log('🔧 Démarrage de l\'application des parties finales...\n');
    
    // 1. Afficher le statut actuel
    displayCurrentStatus();
    
    // 2. Proposer les corrections finales
    proposeFinalCorrections();
    
    console.log('\n🎉 Instructions générées !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. Appliquer les parties finales dans Supabase');
    console.log('2. Tester: node scripts/test-schema-corrections.js');
    console.log('3. Si tout fonctionne: Démarrer le dashboard admin');
    console.log('4. Tester l\'intégration complète');
    
    console.log('');
    console.log('🚀 On est presque au bout ! Plus que quelques vues et fonctions à créer.');
    
  } catch (error) {
    console.error('❌ Erreur lors du processus:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 