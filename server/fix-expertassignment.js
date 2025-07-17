const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixExpertAssignment() {
    console.log('🔧 Correction de la table expertassignment...\n');

    try {
        // 1. Tester la structure actuelle
        console.log('1️⃣ Test de la structure actuelle...');
        
        const { data: testData, error: testError } = await supabase
            .from('expertassignment')
            .select('*')
            .limit(1);

        if (testError) {
            console.log('❌ Erreur test structure:', testError.message);
            return;
        }

        console.log('✅ Structure de base OK');
        console.log('📋 Colonnes disponibles:', Object.keys(testData[0] || {}));

        // 2. Tenter d'ajouter les colonnes manquantes
        console.log('\n2️⃣ Ajout des colonnes manquantes...');
        
        const columnsToAdd = [
            'estimated_duration_days',
            'actual_duration_days', 
            'priority',
            'compensation_percentage'
        ];

        for (const column of columnsToAdd) {
            try {
                console.log(`   ➕ Test ajout: ${column}`);
                
                // Tenter d'insérer avec la nouvelle colonne
                const { data: insertTest, error: insertError } = await supabase
                    .from('expertassignment')
                    .insert({
                        expert_id: '00000000-0000-0000-0000-000000000000',
                        client_id: '00000000-0000-0000-0000-000000000000',
                        [column]: column === 'priority' ? 'normal' : 
                                 column.includes('duration') ? 30 : 
                                 column.includes('percentage') ? 15.0 : null
                    })
                    .select();

                if (insertError && insertError.message.includes('column') && insertError.message.includes('does not exist')) {
                    console.log(`   ❌ Colonne ${column} manquante - nécessite migration DB`);
                } else if (insertError) {
                    console.log(`   ⚠️ Erreur test ${column}:`, insertError.message);
                } else {
                    console.log(`   ✅ Colonne ${column} disponible`);
                    // Supprimer l'enregistrement de test
                    await supabase
                        .from('expertassignment')
                        .delete()
                        .eq('id', insertTest[0].id);
                }
            } catch (error) {
                console.log(`   ❌ Erreur test ${column}:`, error.message);
            }
        }

        // 3. Test complet avec toutes les colonnes
        console.log('\n3️⃣ Test complet de création d\'assignation...');
        
        try {
            const { data: assignment, error: assignmentError } = await supabase
                .from('expertassignment')
                .insert({
                    expert_id: '00000000-0000-0000-0000-000000000000',
                    client_id: '00000000-0000-0000-0000-000000000000',
                    status: 'pending',
                    compensation_amount: 1500.00,
                    compensation_percentage: 15.0,
                    estimated_duration_days: 30,
                    priority: 'normal',
                    notes: 'Test de correction expertassignment'
                })
                .select()
                .single();

            if (assignmentError) {
                console.log('❌ Erreur création assignation:', assignmentError.message);
            } else {
                console.log('✅ Création assignation réussie !');
                console.log('📋 Assignation créée:', assignment);
                
                // Nettoyer l'enregistrement de test
                await supabase
                    .from('expertassignment')
                    .delete()
                    .eq('id', assignment.id);
                console.log('🧹 Enregistrement de test supprimé');
            }
        } catch (error) {
            console.log('❌ Erreur test complet:', error.message);
        }

        console.log('\n🎉 Test de correction terminé !');

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

fixExpertAssignment(); 