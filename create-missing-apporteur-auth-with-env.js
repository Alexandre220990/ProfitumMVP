// ============================================================================
// SCRIPT POUR CRÉER LE COMPTE AUTH MANQUANT (AVEC CHARGEMENT .env)
// ============================================================================
// Ce script crée le compte auth pour l'apporteur "Test Apporteur"

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement depuis .env
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
        
        console.log('✅ Variables d\'environnement chargées');
    } catch (error) {
        console.error('❌ Erreur lors du chargement du fichier .env:', error);
        process.exit(1);
    }
}

// Charger les variables d'environnement
loadEnv();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuration Supabase:');
console.log(`   URL: ${supabaseUrl ? '✅ Définie' : '❌ Manquante'}`);
console.log(`   Service Key: ${supabaseServiceKey ? '✅ Définie' : '❌ Manquante'}`);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.log('Veuillez définir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fonction pour générer un mot de passe temporaire
function generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Fonction principale
async function createMissingApporteurAuth() {
    try {
        console.log('🔍 Recherche de l\'apporteur sans auth_id...');
        
        // 1. Récupérer l'apporteur sans auth_id
        const { data: apporteurs, error: fetchError } = await supabase
            .from('ApporteurAffaires')
            .select('*')
            .is('auth_id', null)
            .eq('status', 'active');

        if (fetchError) {
            console.error('❌ Erreur lors de la récupération des apporteurs:', fetchError);
            return;
        }

        if (apporteurs.length === 0) {
            console.log('✅ Tous les apporteurs ont déjà un compte auth');
            return;
        }

        console.log(`📊 ${apporteurs.length} apporteur(s) sans auth_id trouvé(s)`);

        for (const apporteur of apporteurs) {
            try {
                console.log(`\n👤 Traitement de ${apporteur.first_name} ${apporteur.last_name} (${apporteur.email})`);

                // 2. Générer un mot de passe temporaire
                const temporaryPassword = generateTemporaryPassword();
                console.log(`🔑 Mot de passe temporaire généré: ${temporaryPassword}`);

                // 3. Créer le compte auth
                console.log('🔄 Création du compte auth...');
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: apporteur.email,
                    password: temporaryPassword,
                    email_confirm: true,
                    user_metadata: {
                        first_name: apporteur.first_name,
                        last_name: apporteur.last_name,
                        company_name: apporteur.company_name,
                        company_type: apporteur.company_type,
                        role: 'apporteur_affaires',
                        type: 'apporteur_affaires'
                    }
                });

                if (authError) {
                    console.error(`❌ Erreur création compte auth pour ${apporteur.email}:`, authError);
                    continue;
                }

                console.log('✅ Compte auth créé avec succès');

                // 4. Mettre à jour l'apporteur avec l'auth_id
                console.log('🔄 Mise à jour de l\'auth_id...');
                const { error: updateError } = await supabase
                    .from('ApporteurAffaires')
                    .update({ 
                        auth_id: authData.user.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', apporteur.id);

                if (updateError) {
                    console.error(`❌ Erreur mise à jour auth_id pour ${apporteur.email}:`, updateError);
                    continue;
                }

                console.log('✅ Auth_id mis à jour avec succès');

                // 5. Afficher les identifiants
                console.log(`\n📧 IDENTIFIANTS POUR ${apporteur.first_name} ${apporteur.last_name}:`);
                console.log(`   Email: ${apporteur.email}`);
                console.log(`   Mot de passe temporaire: ${temporaryPassword}`);
                console.log(`   URL de connexion: https://www.profitum.app/apporteur/login`);
                console.log(`   Auth ID: ${authData.user.id}`);
                console.log(`   ID Apporteur: ${apporteur.id}`);

                // 6. Vérifier la création
                console.log('\n🔍 Vérification...');
                const { data: updatedApporteur, error: verifyError } = await supabase
                    .from('ApporteurAffaires')
                    .select('id, first_name, last_name, email, auth_id, status')
                    .eq('id', apporteur.id)
                    .single();

                if (verifyError) {
                    console.error('❌ Erreur lors de la vérification:', verifyError);
                } else {
                    console.log('✅ Vérification réussie:', updatedApporteur);
                }

            } catch (error) {
                console.error(`❌ Erreur pour ${apporteur.email}:`, error);
            }
        }

        console.log('\n✅ Traitement terminé');

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

// Exécuter le script
console.log('🚀 Démarrage de la création du compte auth manquant...');
createMissingApporteurAuth();
