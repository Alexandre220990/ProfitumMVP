const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExpertAssignmentStructure() {
    console.log('🔍 Vérification de la structure de expertassignment...\n');

    try {
        // 1. Récupérer un enregistrement pour voir la structure
        const { data: assignment, error: assignmentError } = await supabase
            .from('expertassignment')
            .select('*')
            .limit(1);

        if (assignmentError) {
            console.log('❌ Erreur récupération expertassignment:', assignmentError.message);
        } else {
            console.log('✅ Structure de la table expertassignment:');
            if (assignment && assignment.length > 0) {
                const columns = Object.keys(assignment[0]);
                columns.forEach(col => {
                    console.log(`   - ${col}: ${typeof assignment[0][col]}`);
                });
            } else {
                console.log('   Table vide');
            }
        }

        // 2. Créer un enregistrement de test avec les colonnes existantes
        console.log('\n2️⃣ Création d\'un enregistrement de test...');
        
        // Récupérer un expert et un client
        const { data: expert } = await supabase
            .from('Expert')
            .select('id')
            .limit(1);

        const { data: client } = await supabase
            .from('Client')
            .select('id')
            .limit(1);

        if (expert && expert.length > 0 && client && client.length > 0) {
            const expertId = expert[0].id;
            const clientId = client[0].id;

            // Créer une assignation avec les colonnes de base
            const { data: testAssignment, error: createError } = await supabase
                .from('expertassignment')
                .insert({
                    expert_id: expertId,
                    client_id: clientId,
                    status: 'pending',
                    compensation_amount: 1500.00,
                    estimated_duration_days: 30,
                    priority: 'normal',
                    notes: 'Assignation de test pour la marketplace'
                })
                .select()
                .single();

            if (createError) {
                console.log('❌ Erreur création assignation de test:', createError.message);
                
                // Essayer avec moins de colonnes
                console.log('\n3️⃣ Tentative avec colonnes minimales...');
                const { data: minimalAssignment, error: minimalError } = await supabase
                    .from('expertassignment')
                    .insert({
                        expert_id: expertId,
                        client_id: clientId,
                        status: 'pending'
                    })
                    .select()
                    .single();

                if (minimalError) {
                    console.log('❌ Erreur création assignation minimale:', minimalError.message);
                } else {
                    console.log('✅ Assignation minimale créée:', minimalAssignment.id);
                }
            } else {
                console.log('✅ Assignation de test créée:', testAssignment.id);
            }
        } else {
            console.log('⚠️ Impossible de créer une assignation: expert ou client manquant');
        }

        // 3. Vérifier les données finales
        console.log('\n4️⃣ Vérification finale:');
        
        const { data: finalAssignments, error: finalError } = await supabase
            .from('expertassignment')
            .select('*');

        if (finalError) {
            console.log('❌ Erreur récupération assignations finales:', finalError.message);
        } else {
            console.log(`✅ ${finalAssignments?.length || 0} assignations au total`);
            if (finalAssignments && finalAssignments.length > 0) {
                console.log('   Colonnes disponibles dans le premier enregistrement:');
                Object.keys(finalAssignments[0]).forEach(col => {
                    console.log(`     - ${col}: ${finalAssignments[0][col]}`);
                });
            }
        }

        console.log('\n🎉 Vérification de la structure expertassignment terminée !');

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    }
}

checkExpertAssignmentStructure(); 