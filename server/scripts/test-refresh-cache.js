const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables d\'environnement DATABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
    process.exit(1);
}

console.log('🔄 Test avec rafraîchissement du cache de schéma...\n');

async function testWithCacheRefresh() {
    try {
        // Créer un nouveau client pour forcer le rafraîchissement
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        console.log('🔌 Test de connexion...');
        
        // Test de connexion basique
        const { data: clientData, error: clientError } = await supabase
            .from('Client')
            .select('id, email, name')
            .limit(1);

        if (clientError) {
            console.error('❌ Erreur de connexion:', clientError.message);
            return;
        }

        console.log('✅ Connexion réussie');
        console.log('📊 Données client:', clientData);

        // Test des tables principales
        const tables = ['Client', 'Expert', 'DocumentFile', 'WorkflowTemplate', 'ComplianceControl'];
        
        for (const table of tables) {
            console.log(`\n🔍 Test table ${table}...`);
            
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    console.error(`❌ Erreur table ${table}:`, error.message);
                } else {
                    console.log(`✅ Table ${table} accessible (${data.length} enregistrements)`);
                }
            } catch (err) {
                console.error(`❌ Exception table ${table}:`, err.message);
            }
        }

        // Test des données de test spécifiques
        console.log('\n🔍 Test des données de test...');
        
        const testClient = await supabase
            .from('Client')
            .select('id, email, name, company_name')
            .eq('id', '550e8400-e29b-41d4-a716-446655440001')
            .single();

        if (testClient.error) {
            console.error('❌ Client de test non trouvé:', testClient.error.message);
        } else {
            console.log('✅ Client de test trouvé:', testClient.data.email);
        }

        const testExpert = await supabase
            .from('Expert')
            .select('id, email, name, company_name')
            .eq('id', '550e8400-e29b-41d4-a716-446655440003')
            .single();

        if (testExpert.error) {
            console.error('❌ Expert de test non trouvé:', testExpert.error.message);
        } else {
            console.log('✅ Expert de test trouvé:', testExpert.data.email);
        }

        // Test d'insertion simple
        console.log('\n➕ Test d\'insertion...');
        
        const testInsert = await supabase
            .from('Client')
            .insert({
                email: 'test-cache@example.com',
                name: 'Test Cache',
                company_name: 'Test Company',
                password: 'test-password',
                siren: '873420964',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select();

        if (testInsert.error) {
            console.error('❌ Erreur insertion:', testInsert.error.message);
        } else {
            console.log('✅ Insertion réussie:', testInsert.data[0].id);
            
            // Nettoyer
            await supabase
                .from('Client')
                .delete()
                .eq('email', 'test-cache@example.com');
        }

        console.log('\n🎉 Tests terminés avec succès !');

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

testWithCacheRefresh(); 