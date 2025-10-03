const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeCleanup() {
    try {
        console.log('🚀 EXÉCUTION DU NETTOYAGE DES TABLES PROSPECT');
        console.log('');

        // Lire le script SQL
        const sqlScript = fs.readFileSync('cleanup-prospect-tables.sql', 'utf8');
        
        // Exécuter le script
        const { data, error } = await supabase.rpc('exec_sql', { 
            sql: sqlScript 
        });

        if (error) {
            console.error('❌ Erreur lors de l\'exécution:', error);
            return;
        }

        console.log('✅ NETTOYAGE TERMINÉ AVEC SUCCÈS !');
        console.log('✅ Tables Prospect supprimées');
        console.log('✅ Architecture simplifiée');
        console.log('✅ Table Client conservée avec status = "prospect"');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

executeCleanup();
