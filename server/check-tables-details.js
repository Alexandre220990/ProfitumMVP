const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTablesDetails() {
    console.log('🔍 Vérification détaillée des tables...\n');

    try {
        // 1. Vérifier la structure de expertassignment
        console.log('1️⃣ Structure de expertassignment:');
        const { data: expertAssignmentStructure, error: structureError1 } = await supabase
            .rpc('exec_sql', {
                sql_query: `
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'expertassignment' 
                    ORDER BY ordinal_position
                `,
                params: []
            });

        if (structureError1) {
            console.log('❌ Erreur structure expertassignment:', structureError1.message);
        } else {
            console.log('✅ Colonnes expertassignment:');
            expertAssignmentStructure?.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`);
            });
        }

        // 2. Vérifier la structure de message
        console.log('\n2️⃣ Structure de message:');
        const { data: messageStructure, error: structureError2 } = await supabase
            .rpc('exec_sql', {
                sql_query: `
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'message' 
                    ORDER BY ordinal_position
                `,
                params: []
            });

        if (structureError2) {
            console.log('❌ Erreur structure message:', structureError2.message);
        } else {
            console.log('✅ Colonnes message:');
            messageStructure?.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`);
            });
        }

        // 3. Vérifier la structure de notification
        console.log('\n3️⃣ Structure de notification:');
        const { data: notificationStructure, error: structureError3 } = await supabase
            .rpc('exec_sql', {
                sql_query: `
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'notification' 
                    ORDER BY ordinal_position
                `,
                params: []
            });

        if (structureError3) {
            console.log('❌ Erreur structure notification:', structureError3.message);
        } else {
            console.log('✅ Colonnes notification:');
            notificationStructure?.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`);
            });
        }

        // 4. Vérifier les contraintes et index
        console.log('\n4️⃣ Contraintes et index:');
        const { data: constraints, error: constraintsError } = await supabase
            .rpc('exec_sql', {
                sql_query: `
                    SELECT 
                        tc.table_name,
                        tc.constraint_name,
                        tc.constraint_type,
                        kcu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.table_name IN ('expertassignment', 'message', 'notification')
                    ORDER BY tc.table_name, tc.constraint_type
                `,
                params: []
            });

        if (constraintsError) {
            console.log('❌ Erreur contraintes:', constraintsError.message);
        } else {
            console.log('✅ Contraintes trouvées:');
            constraints?.forEach(constraint => {
                console.log(`   - ${constraint.table_name}.${constraint.column_name}: ${constraint.constraint_type}`);
            });
        }

        // 5. Ajouter des données de test
        console.log('\n5️⃣ Ajout de données de test...');

        // Récupérer un expert et un client existants
        const { data: experts } = await supabase
            .from('expert')
            .select('id, name')
            .limit(1);

        const { data: clients } = await supabase
            .from('client')
            .select('id, name')
            .limit(1);

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

        // 6. Vérifier les données créées
        console.log('\n6️⃣ Vérification des données:');
        
        const { data: assignments, error: assignmentsError } = await supabase
            .from('expertassignment')
            .select('*');

        if (assignmentsError) {
            console.log('❌ Erreur récupération assignations:', assignmentsError.message);
        } else {
            console.log(`✅ ${assignments?.length || 0} assignations trouvées`);
        }

        const { data: messages, error: messagesError } = await supabase
            .from('message')
            .select('*');

        if (messagesError) {
            console.log('❌ Erreur récupération messages:', messagesError.message);
        } else {
            console.log(`✅ ${messages?.length || 0} messages trouvés`);
        }

        const { data: notifications, error: notificationsError } = await supabase
            .from('notification')
            .select('*');

        if (notificationsError) {
            console.log('❌ Erreur récupération notifications:', notificationsError.message);
        } else {
            console.log(`✅ ${notifications?.length || 0} notifications trouvées`);
        }

        console.log('\n🎉 Vérification détaillée terminée !');

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    }
}

checkTablesDetails(); 