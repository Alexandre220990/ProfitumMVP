// ============================================================================
// SCRIPT POUR ENVOYER LES IDENTIFIANTS AUX APPORTEURS
// ============================================================================
// Ce script génère et envoie les identifiants aux apporteurs existants

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
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

// Fonction pour envoyer les identifiants
async function sendCredentialsToApporteurs() {
    try {
        console.log('🔍 Recherche des apporteurs actifs...');
        
        // 1. Récupérer tous les apporteurs actifs
        const { data: apporteurs, error: fetchError } = await supabase
            .from('ApporteurAffaires')
            .select('*')
            .eq('status', 'active');

        if (fetchError) {
            console.error('❌ Erreur lors de la récupération des apporteurs:', fetchError);
            return;
        }

        console.log(`📊 ${apporteurs.length} apporteurs trouvés`);

        for (const apporteur of apporteurs) {
            try {
                console.log(`\n👤 Traitement de ${apporteur.first_name} ${apporteur.last_name} (${apporteur.email})`);

                // 2. Vérifier si l'apporteur a déjà un auth_id
                if (apporteur.auth_id) {
                    console.log('✅ Compte auth déjà existant');
                    continue;
                }

                // 3. Générer un mot de passe temporaire
                const temporaryPassword = generateTemporaryPassword();
                console.log(`🔑 Mot de passe temporaire généré: ${temporaryPassword}`);

                // 4. Créer le compte auth
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: apporteur.email,
                    password: temporaryPassword,
                    email_confirm: true,
                    user_metadata: {
                        first_name: apporteur.first_name,
                        last_name: apporteur.last_name,
                        company_name: apporteur.company_name,
                        role: 'apporteur_affaires',
                        type: 'apporteur_affaires'
                    }
                });

                if (authError) {
                    console.error(`❌ Erreur création compte auth pour ${apporteur.email}:`, authError);
                    continue;
                }

                // 5. Mettre à jour l'apporteur avec l'auth_id
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

                // 6. Afficher les identifiants (à envoyer par email)
                console.log(`\n📧 IDENTIFIANTS POUR ${apporteur.first_name} ${apporteur.last_name}:`);
                console.log(`   Email: ${apporteur.email}`);
                console.log(`   Mot de passe temporaire: ${temporaryPassword}`);
                console.log(`   URL de connexion: https://www.profitum.app/apporteur/login`);
                console.log(`   Auth ID: ${authData.user.id}`);

                // TODO: Ici vous pouvez ajouter l'envoi d'email réel
                // await sendEmail(apporteur.email, temporaryPassword, apporteur.first_name);

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
sendCredentialsToApporteurs();
