const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabaseSchema() {
  console.log('🔍 Analyse complète du schéma de la base de données...\n');

  try {
    // 1. Récupérer toutes les tables
    console.log('1. Récupération de toutes les tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Erreur récupération tables:', tablesError);
      return;
    }

    console.log(`✅ ${tables.length} tables trouvées\n`);

    // 2. Analyser chaque table en détail
    const schemaAnalysis = {};

    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`📋 Analyse de la table: ${tableName}`);
      
      try {
        // Récupérer les colonnes
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select(`
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            ordinal_position
          `)
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position');

        if (columnsError) {
          console.error(`❌ Erreur colonnes ${tableName}:`, columnsError);
          continue;
        }

        // Récupérer les contraintes
        const { data: constraints, error: constraintsError } = await supabase
          .from('information_schema.table_constraints')
          .select(`
            constraint_name,
            constraint_type
          `)
          .eq('table_schema', 'public')
          .eq('table_name', tableName);

        // Récupérer les clés étrangères
        const { data: foreignKeys, error: foreignKeysError } = await supabase
          .from('information_schema.key_column_usage')
          .select(`
            constraint_name,
            column_name,
            referenced_table_name,
            referenced_column_name
          `)
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .not('referenced_table_name', 'is', null);

        // Récupérer les index
        const { data: indexes, error: indexesError } = await supabase
          .rpc('get_table_indexes', { table_name: tableName })
          .catch(() => ({ data: null, error: null })); // Ignorer si la fonction n'existe pas

        // Compter les lignes
        const { count: rowCount, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .catch(() => ({ count: null, error: null }));

        // Analyser la structure
        const tableAnalysis = {
          name: tableName,
          type: table.table_type,
          columns: columns.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default,
            maxLength: col.character_maximum_length,
            precision: col.numeric_precision,
            scale: col.numeric_scale,
            position: col.ordinal_position
          })),
          constraints: constraints?.map(c => ({
            name: c.constraint_name,
            type: c.constraint_type
          })) || [],
          foreignKeys: foreignKeys?.map(fk => ({
            column: fk.column_name,
            references: `${fk.referenced_table_name}.${fk.referenced_column_name}`,
            constraint: fk.constraint_name
          })) || [],
          indexes: indexes || [],
          rowCount: rowCount || 0,
          primaryKey: columns.find(col => 
            constraints?.some(c => 
              c.constraint_type === 'PRIMARY KEY' && 
              c.constraint_name.includes(col.column_name)
            )
          )?.column_name,
          hasTimestamps: columns.some(col => 
            ['created_at', 'updated_at', 'timestamp'].includes(col.column_name)
          ),
          hasSoftDelete: columns.some(col => 
            ['deleted_at', 'is_deleted', 'active'].includes(col.column_name)
          )
        };

        schemaAnalysis[tableName] = tableAnalysis;

        console.log(`   ✅ ${columns.length} colonnes, ${rowCount || 0} lignes`);

      } catch (error) {
        console.error(`❌ Erreur analyse ${tableName}:`, error.message);
        schemaAnalysis[tableName] = { name: tableName, error: error.message };
      }
    }

    // 3. Générer le rapport complet
    console.log('\n📊 Génération du rapport complet...');
    
    const report = {
      generatedAt: new Date().toISOString(),
      totalTables: Object.keys(schemaAnalysis).length,
      tables: schemaAnalysis,
      summary: {
        tablesWithTimestamps: Object.values(schemaAnalysis).filter(t => t.hasTimestamps).length,
        tablesWithSoftDelete: Object.values(schemaAnalysis).filter(t => t.hasSoftDelete).length,
        totalColumns: Object.values(schemaAnalysis).reduce((sum, t) => sum + (t.columns?.length || 0), 0),
        totalRows: Object.values(schemaAnalysis).reduce((sum, t) => sum + (t.rowCount || 0), 0)
      }
    };

    // 4. Sauvegarder le rapport
    const fs = require('fs');
    const reportPath = 'database-schema-analysis.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Rapport sauvegardé: ${reportPath}`);

    // 5. Afficher le résumé
    console.log('\n📋 RÉSUMÉ DE L\'ANALYSE:');
    console.log(`   📊 Tables analysées: ${report.totalTables}`);
    console.log(`   📝 Colonnes totales: ${report.summary.totalColumns}`);
    console.log(`   📈 Lignes totales: ${report.summary.totalRows}`);
    console.log(`   ⏰ Tables avec timestamps: ${report.summary.tablesWithTimestamps}`);
    console.log(`   🗑️ Tables avec soft delete: ${report.summary.tablesWithSoftDelete}`);

    // 6. Afficher les tables par catégorie
    console.log('\n🏷️ CATÉGORISATION DES TABLES:');
    
    const categories = {
      'Utilisateurs & Auth': ['Client', 'Expert', 'Admin', 'User', 'Profile'],
      'Produits & Services': ['ProduitEligible', 'ClientProduitEligible', 'ChartesProduits'],
      'Assignations & Relations': ['ExpertAssignment', 'ExpertSpecialization'],
      'Communication': ['message', 'Conversation', 'Message'],
      'Notifications': ['ExpertNotifications', 'Notification'],
      'Audit & Suivi': ['Audit', 'AuditProgress', 'AuditStep'],
      'Documents': ['Document', 'Documentation'],
      'Système': ['PerformanceMetrics', 'ErrorMetrics', 'SystemMetrics', 'Alerts']
    };

    for (const [category, tableNames] of Object.entries(categories)) {
      const tablesInCategory = Object.keys(schemaAnalysis).filter(name => 
        tableNames.some(pattern => name.includes(pattern))
      );
      
      if (tablesInCategory.length > 0) {
        console.log(`\n   ${category}:`);
        tablesInCategory.forEach(tableName => {
          const table = schemaAnalysis[tableName];
          console.log(`     - ${tableName} (${table.columns?.length || 0} colonnes, ${table.rowCount || 0} lignes)`);
        });
      }
    }

    // 7. Tables non catégorisées
    const categorizedTables = Object.values(categories).flat();
    const uncategorizedTables = Object.keys(schemaAnalysis).filter(name => 
      !categorizedTables.some(pattern => name.includes(pattern))
    );

    if (uncategorizedTables.length > 0) {
      console.log('\n   🔍 Tables non catégorisées:');
      uncategorizedTables.forEach(tableName => {
        const table = schemaAnalysis[tableName];
        console.log(`     - ${tableName} (${table.columns?.length || 0} colonnes, ${table.rowCount || 0} lignes)`);
      });
    }

    // 8. Générer la documentation Markdown
    generateMarkdownDocumentation(report);

    console.log('\n🎉 Analyse terminée avec succès !');
    console.log('\n📁 Fichiers générés:');
    console.log('   - database-schema-analysis.json (données brutes)');
    console.log('   - DATABASE_SCHEMA_DOCUMENTATION.md (documentation)');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

function generateMarkdownDocumentation(report) {
  const fs = require('fs');
  
  let markdown = `# Documentation du Schéma de Base de Données

**Généré le:** ${new Date(report.generatedAt).toLocaleString('fr-FR')}
**Version:** 1.0
**Base de données:** Supabase

## 📊 Vue d'ensemble

- **Tables totales:** ${report.totalTables}
- **Colonnes totales:** ${report.summary.totalColumns}
- **Lignes totales:** ${report.summary.totalRows}
- **Tables avec timestamps:** ${report.summary.tablesWithTimestamps}
- **Tables avec soft delete:** ${report.summary.tablesWithSoftDelete}

## 🏗️ Structure des Tables

`;

  // Trier les tables par catégorie
  const categories = {
    'Utilisateurs & Authentification': ['Client', 'Expert', 'Admin', 'User', 'Profile'],
    'Produits & Services': ['ProduitEligible', 'ClientProduitEligible', 'ChartesProduits'],
    'Assignations & Relations': ['ExpertAssignment', 'ExpertSpecialization'],
    'Communication': ['message', 'Conversation', 'Message'],
    'Notifications': ['ExpertNotifications', 'Notification'],
    'Audit & Suivi': ['Audit', 'AuditProgress', 'AuditStep'],
    'Documents': ['Document', 'Documentation'],
    'Système & Monitoring': ['PerformanceMetrics', 'ErrorMetrics', 'SystemMetrics', 'Alerts']
  };

  for (const [category, patterns] of Object.entries(categories)) {
    const tablesInCategory = Object.keys(report.tables).filter(name => 
      patterns.some(pattern => name.includes(pattern))
    );

    if (tablesInCategory.length > 0) {
      markdown += `\n### ${category}\n\n`;
      
      tablesInCategory.forEach(tableName => {
        const table = report.tables[tableName];
        if (table.error) {
          markdown += `#### ${tableName}\n\n*Erreur d'accès: ${table.error}*\n\n`;
          return;
        }

        markdown += `#### ${tableName}\n\n`;
        markdown += `**Type:** ${table.type} | **Lignes:** ${table.rowCount} | **Colonnes:** ${table.columns.length}\n\n`;

        if (table.primaryKey) {
          markdown += `**Clé primaire:** \`${table.primaryKey}\`\n\n`;
        }

        if (table.hasTimestamps) {
          markdown += `**Timestamps:** ✅\n\n`;
        }

        if (table.hasSoftDelete) {
          markdown += `**Soft Delete:** ✅\n\n`;
        }

        // Colonnes
        markdown += `**Colonnes:**\n\n`;
        markdown += `| Nom | Type | Nullable | Défaut | Description |\n`;
        markdown += `|-----|------|----------|--------|-------------|\n`;

        table.columns.forEach(col => {
          const type = col.maxLength ? `${col.type}(${col.maxLength})` : 
                      col.precision ? `${col.type}(${col.precision},${col.scale})` : 
                      col.type;
          
          markdown += `| \`${col.name}\` | \`${type}\` | ${col.nullable ? 'Oui' : 'Non'} | ${col.default || '-'} | - |\n`;
        });

        // Clés étrangères
        if (table.foreignKeys.length > 0) {
          markdown += `\n**Clés étrangères:**\n\n`;
          markdown += `| Colonne | Référence |\n`;
          markdown += `|---------|-----------|\n`;
          table.foreignKeys.forEach(fk => {
            markdown += `| \`${fk.column}\` | \`${fk.references}\` |\n`;
          });
        }

        markdown += `\n---\n\n`;
      });
    }
  }

  // Tables non catégorisées
  const categorizedTables = Object.values(categories).flat();
  const uncategorizedTables = Object.keys(report.tables).filter(name => 
    !categorizedTables.some(pattern => name.includes(pattern))
  );

  if (uncategorizedTables.length > 0) {
    markdown += `\n### Tables Non Catégorisées\n\n`;
    uncategorizedTables.forEach(tableName => {
      const table = report.tables[tableName];
      markdown += `#### ${tableName}\n\n`;
      markdown += `**Type:** ${table.type} | **Lignes:** ${table.rowCount} | **Colonnes:** ${table.columns?.length || 0}\n\n`;
      
      if (table.columns) {
        markdown += `**Colonnes:** ${table.columns.map(col => `\`${col.name}\``).join(', ')}\n\n`;
      }
    });
  }

  markdown += `\n## 📝 Notes

- Cette documentation est générée automatiquement
- Les descriptions des colonnes doivent être ajoutées manuellement
- Vérifiez les contraintes et index selon vos besoins
- Les tables avec timestamps incluent généralement \`created_at\` et \`updated_at\`

## 🔄 Mise à jour

Pour mettre à jour cette documentation, exécutez:
\`\`\`bash
node analyze-database-schema.js
\`\`\`
`;

  fs.writeFileSync('DATABASE_SCHEMA_DOCUMENTATION.md', markdown);
  console.log('✅ Documentation Markdown générée');
}

// Exécuter l'analyse
analyzeDatabaseSchema(); 