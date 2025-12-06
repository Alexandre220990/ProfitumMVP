#!/usr/bin/env ts-node
/**
 * ============================================================================
 * SCRIPT D'ANALYSE COMPLÈTE DES TABLES DE NOTIFICATIONS
 * ============================================================================
 * 
 * Ce script analyse en détail toutes les tables de notifications de la BDD
 * pour perfectionner le système existant.
 * 
 * Usage: npx ts-node server/scripts/analyse-tables-notifications.ts
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Charger les variables d'environnement depuis plusieurs emplacements possibles
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

interface TableInfo {
  table_name: string;
  schema_name: string;
  row_count: number;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface IndexInfo {
  index_name: string;
  index_type: string;
  is_unique: boolean;
  columns: string[];
}

interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  columns: string[];
  foreign_table?: string;
  foreign_columns?: string[];
}

interface PolicyInfo {
  policy_name: string;
  policy_cmd: string;
  policy_roles: string[];
  policy_qual: string;
  policy_with_check: string;
}

interface NotificationTableAnalysis {
  table_name: string;
  schema: string;
  row_count: number;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  rls_policies: PolicyInfo[];
  foreign_keys: ConstraintInfo[];
  triggers: any[];
  is_notification_table: boolean;
  confidence_score: number;
  reasons: string[];
}

/**
 * Identifie si une table est liée aux notifications
 */
function isNotificationTable(tableName: string, columns: ColumnInfo[]): { isNotification: boolean; score: number; reasons: string[] } {
  const name = tableName.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  // Critères basés sur le nom
  const notificationKeywords = [
    'notification', 'notif', 'alert', 'reminder', 'message', 
    'push', 'email', 'sms', 'adminnotification', 'expertnotification'
  ];

  const hasNotificationKeyword = notificationKeywords.some(keyword => name.includes(keyword));
  if (hasNotificationKeyword) {
    score += 50;
    reasons.push(`Nom contient un mot-clé de notification`);
  }

  // Critères basés sur les colonnes
  const columnNames = columns.map(c => c.column_name.toLowerCase());
  
  const notificationColumnKeywords = [
    'user_id', 'recipient_id', 'sender_id', 'read', 'is_read', 
    'read_at', 'status', 'priority', 'type', 'notification_type',
    'title', 'message', 'content', 'created_at', 'sent_at',
    'dismissed', 'archived', 'action_url', 'action_data', 'metadata'
  ];

  const matchingColumns = notificationColumnKeywords.filter(keyword => 
    columnNames.some(col => col.includes(keyword))
  );

  if (matchingColumns.length > 0) {
    score += matchingColumns.length * 5;
    reasons.push(`Contient ${matchingColumns.length} colonne(s) typique(s) de notification: ${matchingColumns.join(', ')}`);
  }

  // Critères spécifiques
  if (columnNames.includes('notification_type') || columnNames.includes('type')) {
    score += 20;
    reasons.push('Contient une colonne type/notification_type');
  }

  if (columnNames.some(col => col.includes('read'))) {
    score += 15;
    reasons.push('Contient une colonne de statut de lecture');
  }

  if (columnNames.some(col => col.includes('priority'))) {
    score += 10;
    reasons.push('Contient une colonne de priorité');
  }

  if (columnNames.includes('user_type') || columnNames.includes('recipient_type')) {
    score += 10;
    reasons.push('Contient une colonne de type d\'utilisateur');
  }

  const isNotification = score >= 30;

  return { isNotification, score, reasons };
}

/**
 * Récupère toutes les tables de la base de données
 */
async function getAllTables(): Promise<TableInfo[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        table_name,
        table_schema as schema_name,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_schema = t.table_schema 
         AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    // Compter les lignes pour chaque table
    const tablesWithCounts = await Promise.all(
      result.rows.map(async (row) => {
        try {
          const countResult = await client.query(
            `SELECT COUNT(*) as count FROM "${row.table_name}"`
          );
          return {
            table_name: row.table_name,
            schema_name: row.schema_name,
            row_count: parseInt(countResult.rows[0].count, 10)
          };
        } catch (error) {
          // Si on ne peut pas compter (permissions, etc.), on retourne 0
          return {
            table_name: row.table_name,
            schema_name: row.schema_name,
            row_count: 0
          };
        }
      })
    );

    return tablesWithCounts;
  } finally {
    client.release();
  }
}

/**
 * Récupère les colonnes d'une table
 */
async function getTableColumns(tableName: string, schema: string = 'public'): Promise<ColumnInfo[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
      ORDER BY ordinal_position;
    `, [schema, tableName]);

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Récupère les index d'une table
 */
async function getTableIndexes(tableName: string, schema: string = 'public'): Promise<IndexInfo[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        i.relname as index_name,
        am.amname as index_type,
        idx.indisunique as is_unique,
        array_agg(a.attname ORDER BY array_position(idx.indkey, a.attnum)) as columns
      FROM pg_index idx
      JOIN pg_class t ON t.oid = idx.indrelid
      JOIN pg_class i ON i.oid = idx.indexrelid
      JOIN pg_am am ON i.relam = am.oid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
      WHERE n.nspname = $1
        AND t.relname = $2
        AND NOT idx.indisprimary
      GROUP BY i.relname, am.amname, idx.indisunique
      ORDER BY i.relname;
    `, [schema, tableName]);

    return result.rows.map(row => ({
      index_name: row.index_name,
      index_type: row.index_type,
      is_unique: row.is_unique,
      columns: Array.isArray(row.columns) ? row.columns : (row.columns ? [row.columns] : [])
    }));
  } catch (error) {
    console.error(`Erreur lors de la récupération des index pour ${tableName}:`, error);
    return [];
  } finally {
    client.release();
  }
}

/**
 * Récupère les contraintes d'une table
 */
async function getTableConstraints(tableName: string, schema: string = 'public'): Promise<ConstraintInfo[]> {
  const client = await pool.connect();
  try {
    // Contraintes générales
    const constraintsResult = await client.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = $1
        AND tc.table_name = $2
      GROUP BY tc.constraint_name, tc.constraint_type
      ORDER BY tc.constraint_type, tc.constraint_name;
    `, [schema, tableName]);

    // Clés étrangères avec détails
    const fkResult = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2;
    `, [schema, tableName]);

    const constraints = constraintsResult.rows.map(row => ({
      constraint_name: row.constraint_name,
      constraint_type: row.constraint_type,
      columns: Array.isArray(row.columns) ? row.columns : (row.columns ? [row.columns] : [])
    }));

    // Ajouter les détails des clés étrangères
    const fkMap = new Map<string, { foreign_table: string; foreign_columns: string[] }>();
    fkResult.rows.forEach(row => {
      if (!fkMap.has(row.constraint_name)) {
        fkMap.set(row.constraint_name, {
          foreign_table: `${row.foreign_table_schema}.${row.foreign_table_name}`,
          foreign_columns: []
        });
      }
      fkMap.get(row.constraint_name)!.foreign_columns.push(row.foreign_column_name);
    });

    return constraints.map(constraint => {
      const fkInfo = fkMap.get(constraint.constraint_name);
      return {
        ...constraint,
        foreign_table: fkInfo?.foreign_table,
        foreign_columns: fkInfo?.foreign_columns
      };
    });
  } finally {
    client.release();
  }
}

/**
 * Récupère les politiques RLS d'une table
 */
async function getTableRLSPolicies(tableName: string, schema: string = 'public'): Promise<PolicyInfo[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        pol.polname as policy_name,
        CASE pol.polcmd
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          WHEN '*' THEN 'ALL'
        END as policy_cmd,
        array_agg(rol.rolname) as policy_roles,
        pg_get_expr(pol.polqual, pol.polrelid) as policy_qual,
        pg_get_expr(pol.polwithcheck, pol.polrelid) as policy_with_check
      FROM pg_policy pol
      JOIN pg_class pc ON pc.oid = pol.polrelid
      JOIN pg_namespace pn ON pn.oid = pc.relnamespace
      LEFT JOIN pg_roles rol ON rol.oid = ANY(pol.polroles)
      WHERE pn.nspname = $1
        AND pc.relname = $2
      GROUP BY pol.polname, pol.polcmd, pol.polqual, pol.polrelid, pol.polwithcheck
      ORDER BY pol.polname;
    `, [schema, tableName]);

    return result.rows.map(row => ({
      policy_name: row.policy_name,
      policy_cmd: row.policy_cmd,
      policy_roles: Array.isArray(row.policy_roles) ? row.policy_roles : (row.policy_roles ? [row.policy_roles] : []),
      policy_qual: row.policy_qual || '',
      policy_with_check: row.policy_with_check || ''
    }));
  } catch (error) {
    // Si RLS n'est pas activé ou pas de politiques, retourner tableau vide
    return [];
  } finally {
    client.release();
  }
}

/**
 * Récupère les triggers d'une table
 */
async function getTableTriggers(tableName: string, schema: string = 'public'): Promise<any[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing
      FROM information_schema.triggers
      WHERE event_object_schema = $1
        AND event_object_table = $2
      ORDER BY trigger_name;
    `, [schema, tableName]);

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Analyse complète d'une table
 */
async function analyzeTable(table: TableInfo): Promise<NotificationTableAnalysis> {
  console.log(`\n📊 Analyse de la table: ${table.table_name}...`);

  const columns = await getTableColumns(table.table_name, table.schema_name);
  const indexes = await getTableIndexes(table.table_name, table.schema_name);
  const constraints = await getTableConstraints(table.table_name, table.schema_name);
  const rlsPolicies = await getTableRLSPolicies(table.table_name, table.schema_name);
  const triggers = await getTableTriggers(table.table_name, table.schema_name);

  const { isNotification, score, reasons } = isNotificationTable(table.table_name, columns);
  const foreignKeys = constraints.filter(c => c.constraint_type === 'FOREIGN KEY');

  return {
    table_name: table.table_name,
    schema: table.schema_name,
    row_count: table.row_count,
    columns,
    indexes,
    constraints,
    rls_policies: rlsPolicies,
    foreign_keys: foreignKeys,
    triggers,
    is_notification_table: isNotification,
    confidence_score: score,
    reasons
  };
}

/**
 * Génère un rapport détaillé
 */
function generateReport(analyses: NotificationTableAnalysis[]): string {
  const notificationTables = analyses.filter(a => a.is_notification_table);
  const otherTables = analyses.filter(a => !a.is_notification_table);

  let report = `
# 📊 RAPPORT D'ANALYSE DES TABLES DE NOTIFICATIONS
**Date:** ${new Date().toLocaleString('fr-FR')}
**Total de tables analysées:** ${analyses.length}
**Tables de notifications identifiées:** ${notificationTables.length}

---

## 🎯 TABLES DE NOTIFICATIONS IDENTIFIÉES (${notificationTables.length})

`;

  // Trier par score de confiance décroissant
  notificationTables.sort((a, b) => b.confidence_score - a.confidence_score);

  notificationTables.forEach((analysis, index) => {
    report += `\n### ${index + 1}. **${analysis.table_name}** (Score: ${analysis.confidence_score}/100)\n\n`;
    report += `**Raisons d'identification:**\n`;
    analysis.reasons.forEach(reason => {
      report += `- ${reason}\n`;
    });
    report += `\n**Statistiques:**\n`;
    report += `- Nombre de lignes: ${analysis.row_count.toLocaleString('fr-FR')}\n`;
    report += `- Nombre de colonnes: ${analysis.columns.length}\n`;
    report += `- Nombre d'index: ${analysis.indexes.length}\n`;
    report += `- Nombre de contraintes: ${analysis.constraints.length}\n`;
    report += `- Nombre de clés étrangères: ${analysis.foreign_keys.length}\n`;
    report += `- Nombre de politiques RLS: ${analysis.rls_policies.length}\n`;
    report += `- Nombre de triggers: ${analysis.triggers.length}\n`;

    report += `\n**Colonnes (${analysis.columns.length}):**\n`;
    report += `\`\`\`\n`;
    analysis.columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      report += `  ${col.column_name.padEnd(30)} ${col.data_type}${length} ${nullable}${defaultVal}\n`;
    });
    report += `\`\`\`\n`;

    if (analysis.indexes.length > 0) {
      report += `\n**Index (${analysis.indexes.length}):**\n`;
      analysis.indexes.forEach(idx => {
        const unique = idx.is_unique ? 'UNIQUE' : '';
        const columnsStr = Array.isArray(idx.columns) ? idx.columns.join(', ') : (idx.columns || 'N/A');
        report += `- ${idx.index_name} (${unique} ${idx.index_type}): [${columnsStr}]\n`;
      });
    }

    if (analysis.foreign_keys.length > 0) {
      report += `\n**Clés étrangères (${analysis.foreign_keys.length}):**\n`;
      analysis.foreign_keys.forEach(fk => {
        const fkColumns = Array.isArray(fk.columns) ? fk.columns.join(', ') : (fk.columns || 'N/A');
        const foreignColumns = Array.isArray(fk.foreign_columns) ? fk.foreign_columns.join(', ') : (fk.foreign_columns || '');
        report += `- ${fk.constraint_name}: ${fkColumns} → ${fk.foreign_table}(${foreignColumns})\n`;
      });
    }

    if (analysis.rls_policies.length > 0) {
      report += `\n**Politiques RLS (${analysis.rls_policies.length}):**\n`;
      analysis.rls_policies.forEach(policy => {
        const roles = Array.isArray(policy.policy_roles) ? policy.policy_roles.join(', ') : (policy.policy_roles || 'N/A');
        report += `- ${policy.policy_name} (${policy.policy_cmd}): ${roles}\n`;
        if (policy.policy_qual) {
          report += `  Condition: ${policy.policy_qual}\n`;
        }
      });
    }

    if (analysis.triggers.length > 0) {
      report += `\n**Triggers (${analysis.triggers.length}):**\n`;
      analysis.triggers.forEach(trigger => {
        report += `- ${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})\n`;
      });
    }

    report += `\n---\n`;
  });

  report += `\n\n## 📋 AUTRES TABLES ANALYSÉES (${otherTables.length})\n\n`;
  report += `Ces tables ne semblent pas être des tables de notifications principales, mais peuvent être liées:\n\n`;
  otherTables.forEach(table => {
    if (table.confidence_score > 0) {
      report += `- **${table.table_name}** (Score: ${table.confidence_score}) - ${table.reasons.join(', ')}\n`;
    }
  });

  report += `\n\n## 📈 STATISTIQUES GLOBALES\n\n`;
  const totalRows = notificationTables.reduce((sum, t) => sum + t.row_count, 0);
  const totalColumns = notificationTables.reduce((sum, t) => sum + t.columns.length, 0);
  const totalIndexes = notificationTables.reduce((sum, t) => sum + t.indexes.length, 0);
  
  report += `- **Total de lignes dans les tables de notifications:** ${totalRows.toLocaleString('fr-FR')}\n`;
  report += `- **Total de colonnes:** ${totalColumns}\n`;
  report += `- **Total d'index:** ${totalIndexes}\n`;
  report += `- **Tables avec RLS activé:** ${notificationTables.filter(t => t.rls_policies.length > 0).length}\n`;
  report += `- **Tables avec triggers:** ${notificationTables.filter(t => t.triggers.length > 0).length}\n`;

  return report;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de l\'analyse des tables de notifications...\n');

  try {
    // Test de connexion
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Connexion à la base de données réussie\n');

    // Récupérer toutes les tables
    console.log('📋 Récupération de la liste des tables...');
    const tables = await getAllTables();
    console.log(`✅ ${tables.length} tables trouvées\n`);

    // Analyser chaque table
    console.log('🔍 Analyse des tables en cours...');
    const analyses: NotificationTableAnalysis[] = [];
    
    for (const table of tables) {
      try {
        const analysis = await analyzeTable(table);
        analyses.push(analysis);
      } catch (error) {
        console.error(`❌ Erreur lors de l'analyse de ${table.table_name}:`, error);
      }
    }

    // Générer le rapport
    console.log('\n📝 Génération du rapport...');
    const report = generateReport(analyses);

    // Sauvegarder le rapport
    const reportPath = path.resolve(__dirname, '../../ANALYSE-TABLES-NOTIFICATIONS.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`✅ Rapport sauvegardé dans: ${reportPath}`);

    // Afficher un résumé
    const notificationTables = analyses.filter(a => a.is_notification_table);
    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   - Tables analysées: ${analyses.length}`);
    console.log(`   - Tables de notifications identifiées: ${notificationTables.length}`);
    console.log(`   - Score moyen de confiance: ${Math.round(notificationTables.reduce((sum, t) => sum + t.confidence_score, 0) / notificationTables.length || 0)}/100`);

    // Afficher les tables identifiées
    console.log(`\n🎯 TABLES DE NOTIFICATIONS IDENTIFIÉES:`);
    notificationTables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name} (${table.row_count.toLocaleString('fr-FR')} lignes, score: ${table.confidence_score})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

export { analyzeTable, getAllTables, isNotificationTable };
