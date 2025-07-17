const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMarketplaceComplete() {
    console.log('🏪 Test complet de la marketplace et messagerie...\n');

    try {
        // 1. Vérifier les tables principales
        console.log('1. Vérification des tables principales...');
        
        const tablesToCheck = [
            'Expert',
            'Client',
            'ClientProduitEligible',
            'ProduitEligible',
            'ExpertAssignment',
            'message',
            'ExpertNotifications',
            'ChartesProduits'
        ];

        for (const table of tablesToCheck) {
            const { data, error } = await supabase
                .from(table)
                .select('count')
                .limit(1);
            
            if (error) {
                console.error(`❌ Table ${table} non accessible:`, error.message);
            } else {
                console.log(`✅ Table ${table} accessible`);
            }
        }

        // 2. Vérifier les experts actifs
        console.log('\n2. Vérification des experts actifs...');
        const { data: experts, error: expertsError } = await supabase
            .from('Expert')
            .select('id, name, specializations, status, approval_status')
            .eq('status', 'active')
            .eq('approval_status', 'approved');

        if (expertsError) {
            console.error('❌ Erreur récupération experts:', expertsError.message);
        } else {
            console.log(`✅ ${experts?.length || 0} experts actifs trouvés`);
            if (experts && experts.length > 0) {
                console.log('   Exemples d\'experts:');
                experts.slice(0, 3).forEach(expert => {
                    console.log(`   - ${expert.name} (${expert.specializations?.join(', ') || 'Aucune spécialisation'})`);
                });
            }
        }

        // 3. Vérifier les produits éligibles
        console.log('\n3. Vérification des produits éligibles...');
        const { data: produits, error: produitsError } = await supabase
            .from('ProduitEligible')
            .select('id, nom, category, description');

        if (produitsError) {
            console.error('❌ Erreur récupération produits:', produitsError.message);
        } else {
            console.log(`✅ ${produits?.length || 0} produits éligibles trouvés`);
            if (produits && produits.length > 0) {
                console.log('   Exemples de produits:');
                produits.slice(0, 3).forEach(produit => {
                    console.log(`   - ${produit.nom} (${produit.category})`);
                });
            }
        }

        // 4. Vérifier les assignations existantes
        console.log('\n4. Vérification des assignations...');
        const { data: assignments, error: assignmentsError } = await supabase
            .from('ExpertAssignment')
            .select(`
                id,
                client_id,
                expert_id,
                produit_id,
                statut,
                created_at,
                Client!inner(company_name),
                Expert!inner(name)
            `)
            .limit(10);

        if (assignmentsError) {
            console.error('❌ Erreur récupération assignations:', assignmentsError.message);
        } else {
            console.log(`✅ ${assignments?.length || 0} assignations trouvées`);
            if (assignments && assignments.length > 0) {
                console.log('   Exemples d\'assignations:');
                assignments.slice(0, 3).forEach(assignment => {
                    console.log(`   - ${assignment.Client?.company_name} → ${assignment.Expert?.name} (${assignment.statut})`);
                });
            }
        }

        // 5. Vérifier les messages
        console.log('\n5. Vérification des messages...');
        const { data: messages, error: messagesError } = await supabase
            .from('message')
            .select('id, content, sender_id, sender_type, timestamp')
            .order('timestamp', { ascending: false })
            .limit(10);

        if (messagesError) {
            console.error('❌ Erreur récupération messages:', messagesError.message);
        } else {
            console.log(`✅ ${messages?.length || 0} messages trouvés`);
            if (messages && messages.length > 0) {
                console.log('   Derniers messages:');
                messages.slice(0, 3).forEach(message => {
                    console.log(`   - [${message.sender_type}] ${message.content.substring(0, 50)}...`);
                });
            }
        }

        // 6. Vérifier les notifications
        console.log('\n6. Vérification des notifications...');
        const { data: notifications, error: notificationsError } = await supabase
            .from('ExpertNotifications')
            .select('id, type, title, message, read')
            .order('created_at', { ascending: false })
            .limit(10);

        if (notificationsError) {
            console.error('❌ Erreur récupération notifications:', notificationsError.message);
        } else {
            console.log(`✅ ${notifications?.length || 0} notifications trouvées`);
            if (notifications && notifications.length > 0) {
                console.log('   Dernières notifications:');
                notifications.slice(0, 3).forEach(notification => {
                    console.log(`   - [${notification.type}] ${notification.title}`);
                });
            }
        }

        // 7. Vérifier les signatures de charte
        console.log('\n7. Vérification des signatures de charte...');
        const { data: chartes, error: chartesError } = await supabase
            .from('ClientProduitEligible')
            .select('id, charte_signed, charte_signed_at, ProduitEligible!inner(nom)')
            .eq('charte_signed', true);

        if (chartesError) {
            console.error('❌ Erreur récupération chartes:', chartesError.message);
        } else {
            console.log(`✅ ${chartes?.length || 0} chartes signées trouvées`);
            if (chartes && chartes.length > 0) {
                console.log('   Chartes signées:');
                chartes.slice(0, 3).forEach(charte => {
                    console.log(`   - ${charte.ProduitEligible?.nom} (${charte.charte_signed_at})`);
                });
            }
        }

        // 8. Test de correspondance expert-produit
        console.log('\n8. Test de correspondance expert-produit...');
        if (experts && produits && experts.length > 0 && produits.length > 0) {
            const expert = experts[0];
            const produit = produits[0];
            
            console.log(`   Test avec expert: ${expert.name}`);
            console.log(`   Test avec produit: ${produit.nom} (${produit.category})`);
            
            const expertSpecs = expert.specializations || [];
            const produitTerms = [
                produit.nom.toLowerCase(),
                produit.category.toLowerCase(),
                ...produit.nom.toLowerCase().split(' '),
                ...produit.category.toLowerCase().split(' ')
            ].filter(term => term.length > 2);

            const matches = expertSpecs.filter(spec => {
                const specLower = spec.toLowerCase();
                return produitTerms.some(term => 
                    specLower.includes(term) || term.includes(specLower)
                );
            });

            console.log(`   Spécialisations expert: ${expertSpecs.join(', ')}`);
            console.log(`   Termes produit: ${produitTerms.join(', ')}`);
            console.log(`   Correspondances trouvées: ${matches.length}`);
        }

        // 9. Vérifier les index et performances
        console.log('\n9. Vérification des index...');
        const indexQueries = [
            { table: 'Expert', condition: 'status = active AND approval_status = approved' },
            { table: 'ClientProduitEligible', condition: 'charte_signed = true' },
            { table: 'message', condition: 'sender_type = expert' },
            { table: 'ExpertNotifications', condition: 'read = false' }
        ];

        for (const query of indexQueries) {
            const startTime = Date.now();
            const { data, error } = await supabase
                .from(query.table)
                .select('count')
                .limit(1);
            const endTime = Date.now();
            
            if (error) {
                console.error(`❌ Erreur requête ${query.table}:`, error.message);
            } else {
                console.log(`✅ ${query.table}: ${endTime - startTime}ms`);
            }
        }

        console.log('\n🎉 Test complet terminé avec succès !');
        console.log('\n📋 Résumé:');
        console.log(`   - Experts actifs: ${experts?.length || 0}`);
        console.log(`   - Produits éligibles: ${produits?.length || 0}`);
        console.log(`   - Assignations: ${assignments?.length || 0}`);
        console.log(`   - Messages: ${messages?.length || 0}`);
        console.log(`   - Notifications: ${notifications?.length || 0}`);
        console.log(`   - Chartes signées: ${chartes?.length || 0}`);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}

// Exécuter le test
testMarketplaceComplete(); 