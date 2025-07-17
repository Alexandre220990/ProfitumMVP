#!/usr/bin/env node

/**
 * Script pour mettre à jour le mot de passe de l'utilisateur admin
 * Email: grandjean.alexandre5@gmail.com
 * Nouveau mot de passe: Adminprofitum
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAdminPassword() {
    try {
        console.log('🔐 Mise à jour du mot de passe admin...');
        console.log('📧 Email: grandjean.alexandre5@gmail.com');
        console.log('🔑 Nouveau mot de passe: Adminprofitum');
        console.log('');

        // Mettre à jour le mot de passe via l'API Supabase Auth
        const { data, error } = await supabase.auth.admin.updateUserById(
            '61797a61-edde-4816-b818-00015b627fe1', // ID de l'utilisateur
            {
                password: 'Adminprofitum'
            }
        );

        if (error) {
            console.error('❌ Erreur lors de la mise à jour:', error.message);
            return;
        }

        console.log('✅ Mot de passe mis à jour avec succès !');
        console.log('');
        console.log('📋 Informations de connexion mises à jour:');
        console.log('   Email: grandjean.alexandre5@gmail.com');
        console.log('   Mot de passe: Adminprofitum');
        console.log('');
        console.log('🔗 L\'utilisateur peut maintenant se connecter avec ces identifiants');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Exécuter le script
updateAdminPassword(); 