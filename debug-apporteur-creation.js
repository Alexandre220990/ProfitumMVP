// Script de debug pour tester la création d'apporteur
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes:');
    console.error('SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugApporteurCreation() {
    console.log('🔍 DEBUG CRÉATION APPORTEUR - DÉMARRAGE');
    console.log('=====================================');

    try {
        // 1. Tester la connexion à Supabase
        console.log('\n1. Test connexion Supabase...');
        const { data: testData, error: testError } = await supabase
            .from('ApporteurAffaires')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.error('❌ Erreur connexion Supabase:', testError);
            return;
        }
        console.log('✅ Connexion Supabase OK');

        // 2. Vérifier la structure de la table ApporteurAffaires
        console.log('\n2. Vérification structure table ApporteurAffaires...');
        const { data: structureData, error: structureError } = await supabase
            .from('ApporteurAffaires')
            .select('*')
            .limit(1);
        
        if (structureError) {
            console.error('❌ Erreur structure table:', structureError);
            return;
        }
        console.log('✅ Table ApporteurAffaires accessible');

        // 3. Créer d'abord un utilisateur Auth pour le test
        console.log('\n3. Test création utilisateur Auth...');
        const testEmail = `test.apporteur.${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: {
                first_name: 'Test',
                last_name: 'Apporteur',
                role: 'apporteur_affaires'
            }
        });

        if (authError) {
            console.error('❌ Erreur création Auth:', authError);
            return;
        }

        console.log('✅ Création Auth réussie:', {
            id: authData.user.id,
            email: authData.user.email
        });

        // 4. Maintenant tester l'insertion dans ApporteurAffaires
        console.log('\n4. Test insertion avec données minimales...');
        const testApporteurData = {
            auth_id: authData.user.id, // Utiliser l'ID de l'utilisateur Auth créé
            first_name: 'Test',
            last_name: 'Apporteur',
            email: testEmail,
            phone: '0123456789',
            company_name: 'Test Company',
            company_type: 'expert', // Tester un des nouveaux types
            commission_rate: 5.00,
            status: 'candidature' // Statut valide selon la contrainte
        };

        console.log('📝 Données de test:', testApporteurData);

        const { data: insertData, error: insertError } = await supabase
            .from('ApporteurAffaires')
            .insert(testApporteurData)
            .select();

        if (insertError) {
            console.error('❌ Erreur insertion test:', insertError);
            console.error('Détails erreur:', {
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint,
                code: insertError.code
            });
            return;
        }

        console.log('✅ Insertion test réussie:', insertData);

        // 5. Nettoyer le test
        console.log('\n5. Nettoyage test...');
        const { error: deleteError } = await supabase
            .from('ApporteurAffaires')
            .delete()
            .eq('id', insertData[0].id);

        if (deleteError) {
            console.error('⚠️ Erreur nettoyage ApporteurAffaires:', deleteError);
        } else {
            console.log('✅ Nettoyage ApporteurAffaires OK');
        }

        // Nettoyer l'utilisateur Auth
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authData.user.id);
        if (deleteAuthError) {
            console.error('⚠️ Erreur suppression Auth:', deleteAuthError);
        } else {
            console.log('✅ Nettoyage Auth OK');
        }


        console.log('\n🎉 DEBUG TERMINÉ - Tous les tests sont OK !');

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

debugApporteurCreation();
