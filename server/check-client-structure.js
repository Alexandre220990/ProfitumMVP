const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkClientStructure() {
    console.log('🔍 Vérification de la structure de la table Client...\n');

    try {
        // 1. Récupérer un client pour voir sa structure
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('*')
            .limit(1);

        if (clientError) {
            console.log('❌ Erreur récupération client:', clientError.message);
        } else {
            console.log('✅ Structure de la table Client:');
            if (client && client.length > 0) {
                const columns = Object.keys(client[0]);
                columns.forEach(col => {
                    console.log(`   - ${col}: ${typeof client[0][col]}`);
                });
            } else {
                console.log('   Table vide');
            }
        }

        // 2. Vérifier les clients avec différentes colonnes possibles
        console.log('\n2️⃣ Test avec différentes colonnes:');
        
        // Test avec statut
        const { data: clientsWithStatut, error: statutError } = await supabase
            .from('Client')
            .select('id, name, company_name, statut')
            .limit(3);

        if (statutError) {
            console.log('❌ Erreur avec colonne statut:', statutError.message);
        } else {
            console.log(`✅ ${clientsWithStatut?.length || 0} clients trouvés avec statut`);
            clientsWithStatut?.forEach(client => {
                console.log(`   - ${client.name} (${client.company_name}) - Statut: ${client.statut}`);
            });
        }

        // Test avec type
        const { data: clientsWithType, error: typeError } = await supabase
            .from('Client')
            .select('id, name, company_name, type')
            .limit(3);

        if (typeError) {
            console.log('❌ Erreur avec colonne type:', typeError.message);
        } else {
            console.log(`✅ ${clientsWithType?.length || 0} clients trouvés avec type`);
            clientsWithType?.forEach(client => {
                console.log(`   - ${client.name} (${client.company_name}) - Type: ${client.type}`);
            });
        }

        // 3. Créer un client de test si nécessaire
        console.log('\n3️⃣ Création d\'un client de test...');
        
        const { data: testClient, error: createError } = await supabase
            .from('Client')
            .insert({
                name: 'Client Test Marketplace',
                email: 'test-marketplace@example.com',
                company_name: 'Entreprise Test',
                phone_number: '0123456789',
                revenuAnnuel: 500000,
                secteurActivite: 'Services',
                nombreEmployes: 10,
                ancienneteEntreprise: 5,
                typeProjet: 'Optimisation',
                type: 'client',
                statut: 'active'
            })
            .select()
            .single();

        if (createError) {
            console.log('❌ Erreur création client test:', createError.message);
        } else {
            console.log('✅ Client de test créé:', testClient.id);

            // 4. Créer des données de test avec ce client
            console.log('\n4️⃣ Création de données de test...');
            
            // Récupérer un expert
            const { data: expert } = await supabase
                .from('Expert')
                .select('id, name')
                .limit(1);

            if (expert && expert.length > 0) {
                const expertId = expert[0].id;

                // Créer une assignation de test
                const { data: assignment, error: assignmentError } = await supabase
                    .from('expertassignment')
                    .insert({
                        expert_id: expertId,
                        client_id: testClient.id,
                        status: 'pending',
                        compensation_amount: 1500.00,
                        compensation_percentage: 15.0,
                        estimated_duration_days: 30,
                        priority: 'normal',
                        notes: 'Assignation de test pour la marketplace'
                    })
                    .select()
                    .single();

                if (assignmentError) {
                    console.log('❌ Erreur création assignation:', assignmentError.message);
                } else {
                    console.log('✅ Assignation de test créée:', assignment.id);

                    // Créer un message de test
                    const { data: message, error: messageError } = await supabase
                        .from('message')
                        .insert({
                            assignment_id: assignment.id,
                            sender_id: testClient.id,
                            sender_type: 'client',
                            recipient_id: expertId,
                            recipient_type: 'expert',
                            subject: 'Premier contact',
                            content: 'Bonjour, je souhaite vous contacter pour une prestation.',
                            message_type: 'text',
                            priority: 'normal'
                        })
                        .select()
                        .single();

                    if (messageError) {
                        console.log('❌ Erreur création message:', messageError.message);
                    } else {
                        console.log('✅ Message de test créé:', message.id);
                    }

                    // Créer une notification de test
                    const { data: notification, error: notificationError } = await supabase
                        .from('notification')
                        .insert({
                            user_id: expertId,
                            title: 'Nouvelle assignation',
                            message: 'Vous avez reçu une nouvelle assignation de test.',
                            priority: 'normal'
                        })
                        .select()
                        .single();

                    if (notificationError) {
                        console.log('❌ Erreur création notification:', notificationError.message);
                    } else {
                        console.log('✅ Notification de test créée:', notification.id);
                    }
                }
            }
        }

        // 5. Vérification finale
        console.log('\n5️⃣ Vérification finale:');
        
        const { data: finalClients } = await supabase
            .from('Client')
            .select('id, name, company_name, statut, type')
            .limit(5);

        console.log(`✅ ${finalClients?.length || 0} clients au total`);
        finalClients?.forEach(client => {
            console.log(`   - ${client.name} (${client.company_name}) - Statut: ${client.statut}, Type: ${client.type}`);
        });

        const { data: finalAssignments } = await supabase
            .from('expertassignment')
            .select('id, status, expert_id, client_id');

        console.log(`✅ ${finalAssignments?.length || 0} assignations au total`);

        const { data: finalMessages } = await supabase
            .from('message')
            .select('id, assignment_id, sender_type, recipient_type');

        console.log(`✅ ${finalMessages?.length || 0} messages au total`);

        const { data: finalNotifications } = await supabase
            .from('notification')
            .select('id, user_id, title');

        console.log(`✅ ${finalNotifications?.length || 0} notifications au total`);

        console.log('\n🎉 Vérification de la structure Client terminée !');

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    }
}

checkClientStructure(); 