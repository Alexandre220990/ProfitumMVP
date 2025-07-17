const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMarketplaceIntegration() {
    console.log('🧪 Test d\'intégration marketplace...\n');

    try {
        // 1. Vérifier les experts disponibles
        console.log('1️⃣ Vérification des experts:');
        const { data: experts, error: expertsError } = await supabase
            .from('expert')
            .select(`
                id,
                name,
                company_name,
                specializations,
                experience,
                location,
                rating,
                compensation,
                status,
                approval_status
            `)
            .eq('status', 'active')
            .eq('approval_status', 'approved')
            .limit(5);

        if (expertsError) {
            console.log('❌ Erreur experts:', expertsError.message);
        } else {
            console.log(`✅ ${experts?.length || 0} experts actifs trouvés`);
            experts?.forEach(expert => {
                console.log(`   - ${expert.name} (${expert.company_name}) - ${expert.specializations?.join(', ') || 'Aucune spécialisation'}`);
            });
        }

        // 2. Vérifier les clients disponibles
        console.log('\n2️⃣ Vérification des clients:');
        const { data: clients, error: clientsError } = await supabase
            .from('client')
            .select(`
                id,
                name,
                email,
                company_name,
                status
            `)
            .eq('status', 'active')
            .limit(3);

        if (clientsError) {
            console.log('❌ Erreur clients:', clientsError.message);
        } else {
            console.log(`✅ ${clients?.length || 0} clients actifs trouvés`);
            clients?.forEach(client => {
                console.log(`   - ${client.name} (${client.company_name})`);
            });
        }

        // 3. Vérifier les produits éligibles
        console.log('\n3️⃣ Vérification des produits éligibles:');
        const { data: produits, error: produitsError } = await supabase
            .from('produiteligible')
            .select(`
                id,
                nom,
                description,
                status
            `)
            .eq('status', 'active')
            .limit(5);

        if (produitsError) {
            console.log('❌ Erreur produits:', produitsError.message);
        } else {
            console.log(`✅ ${produits?.length || 0} produits éligibles trouvés`);
            produits?.forEach(produit => {
                console.log(`   - ${produit.nom}`);
            });
        }

        // 4. Créer des données de test si possible
        console.log('\n4️⃣ Création de données de test...');
        
        if (experts && experts.length > 0 && clients && clients.length > 0) {
            const expertId = experts[0].id;
            const clientId = clients[0].id;

            // Créer une assignation de test
            const { data: assignment, error: assignmentError } = await supabase
                .from('expertassignment')
                .insert({
                    expert_id: expertId,
                    client_id: clientId,
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
                        sender_id: clientId,
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
                        type: 'assignment',
                        reference_id: assignment.id,
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
        } else {
            console.log('⚠️ Impossible de créer des données de test: experts ou clients manquants');
        }

        // 5. Tester les APIs backend
        console.log('\n5️⃣ Test des APIs backend:');
        
        // Test API experts
        try {
            const response = await fetch('http://localhost:3001/api/experts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API experts fonctionne:', data.success ? 'OK' : 'Erreur');
            } else {
                console.log('❌ API experts erreur:', response.status);
            }
        } catch (error) {
            console.log('❌ API experts inaccessible:', error.message);
        }

        // Test API marketplace
        try {
            const response = await fetch('http://localhost:3001/api/experts/marketplace', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API marketplace fonctionne:', data.success ? 'OK' : 'Erreur');
            } else {
                console.log('❌ API marketplace erreur:', response.status);
            }
        } catch (error) {
            console.log('❌ API marketplace inaccessible:', error.message);
        }

        // 6. Vérifier les données finales
        console.log('\n6️⃣ Vérification finale des données:');
        
        const { data: finalAssignments, error: finalAssignmentsError } = await supabase
            .from('expertassignment')
            .select(`
                id,
                status,
                expert_id,
                client_id,
                compensation_amount,
                assignment_date
            `);

        if (finalAssignmentsError) {
            console.log('❌ Erreur récupération assignations finales:', finalAssignmentsError.message);
        } else {
            console.log(`✅ ${finalAssignments?.length || 0} assignations au total`);
            finalAssignments?.forEach(assignment => {
                console.log(`   - ID: ${assignment.id}, Status: ${assignment.status}, Compensation: ${assignment.compensation_amount}€`);
            });
        }

        const { data: finalMessages, error: finalMessagesError } = await supabase
            .from('message')
            .select(`
                id,
                assignment_id,
                sender_type,
                recipient_type,
                subject,
                message_type
            `);

        if (finalMessagesError) {
            console.log('❌ Erreur récupération messages finaux:', finalMessagesError.message);
        } else {
            console.log(`✅ ${finalMessages?.length || 0} messages au total`);
            finalMessages?.forEach(message => {
                console.log(`   - ID: ${message.id}, Type: ${message.message_type}, Sujet: ${message.subject}`);
            });
        }

        const { data: finalNotifications, error: finalNotificationsError } = await supabase
            .from('notification')
            .select(`
                id,
                user_id,
                title,
                type,
                priority
            `);

        if (finalNotificationsError) {
            console.log('❌ Erreur récupération notifications finales:', finalNotificationsError.message);
        } else {
            console.log(`✅ ${finalNotifications?.length || 0} notifications au total`);
            finalNotifications?.forEach(notification => {
                console.log(`   - ID: ${notification.id}, Type: ${notification.type}, Titre: ${notification.title}`);
            });
        }

        console.log('\n🎉 Test d\'intégration marketplace terminé !');
        console.log('\n📊 Résumé:');
        console.log(`   - Experts actifs: ${experts?.length || 0}`);
        console.log(`   - Clients actifs: ${clients?.length || 0}`);
        console.log(`   - Produits éligibles: ${produits?.length || 0}`);
        console.log(`   - Assignations: ${finalAssignments?.length || 0}`);
        console.log(`   - Messages: ${finalMessages?.length || 0}`);
        console.log(`   - Notifications: ${finalNotifications?.length || 0}`);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}

testMarketplaceIntegration(); 