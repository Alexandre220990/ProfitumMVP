const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
    console.log('🔧 Application de la migration ExpertAssignment...\n');

    try {
        // 1. Vérifier si la colonne estimated_duration_days existe
        console.log('1️⃣ Vérification de la structure de la table...');
        
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'ExpertAssignment')
            .eq('table_schema', 'public');

        if (columnsError) {
            console.log('❌ Erreur vérification colonnes:', columnsError.message);
            return;
        }

        const existingColumns = columns.map(col => col.column_name);
        console.log('📋 Colonnes existantes:', existingColumns);

        // 2. Ajouter les colonnes manquantes
        const migrations = [
            {
                name: 'estimated_duration_days',
                sql: `ALTER TABLE public.ExpertAssignment ADD COLUMN IF NOT EXISTS estimated_duration_days INTEGER;`
            },
            {
                name: 'actual_duration_days', 
                sql: `ALTER TABLE public.ExpertAssignment ADD COLUMN IF NOT EXISTS actual_duration_days INTEGER;`
            },
            {
                name: 'priority',
                sql: `ALTER TABLE public.ExpertAssignment ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));`
            },
            {
                name: 'compensation_percentage',
                sql: `ALTER TABLE public.ExpertAssignment ADD COLUMN IF NOT EXISTS compensation_percentage DECIMAL(5,2);`
            }
        ];

        console.log('\n2️⃣ Application des migrations...');
        
        for (const migration of migrations) {
            if (!existingColumns.includes(migration.name)) {
                console.log(`   ➕ Ajout de la colonne: ${migration.name}`);
                
                // Utiliser une requête SQL directe via l'API REST
                const { error } = await supabase
                    .rpc('exec_sql', { 
                        sql_query: migration.sql 
                    });

                if (error) {
                    console.log(`   ❌ Erreur pour ${migration.name}:`, error.message);
                } else {
                    console.log(`   ✅ Colonne ${migration.name} ajoutée`);
                }
            } else {
                console.log(`   ✅ Colonne ${migration.name} existe déjà`);
            }
        }

        // 3. Mettre à jour les données existantes
        console.log('\n3️⃣ Mise à jour des données existantes...');
        
        const { data: updateResult, error: updateError } = await supabase
            .from('ExpertAssignment')
            .update({
                estimated_duration_days: 30,
                priority: 'normal',
                compensation_percentage: 15.0
            })
            .is('estimated_duration_days', null);

        if (updateError) {
            console.log('❌ Erreur mise à jour données:', updateError.message);
        } else {
            console.log('✅ Données mises à jour');
        }

        // 4. Vérifier la structure finale
        console.log('\n4️⃣ Vérification de la structure finale...');
        
        const { data: finalColumns, error: finalError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'ExpertAssignment')
            .eq('table_schema', 'public')
            .order('ordinal_position');

        if (finalError) {
            console.log('❌ Erreur vérification finale:', finalError.message);
        } else {
            console.log('📋 Structure finale de la table:');
            finalColumns.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type}`);
            });
        }

        console.log('\n🎉 Migration ExpertAssignment terminée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    }
}

applyMigration(); 