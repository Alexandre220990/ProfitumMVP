import { supabaseAdmin } from '../config/supabase';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function checkDatabaseConnection() {
  try {
    // Vérification de la connexion PostgreSQL
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Connexion PostgreSQL réussie');

    // Vérification de la connexion Supabase
    const { data, error } = await supabaseAdmin
      .from('Client')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Connexion Supabase réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
}

export async function checkRLSPolicies() {
  try {
    const client = await pool.connect();
    
    // Vérification des politiques RLS sur la table Client
    const clientPoliciesResult = await client.query(`
      SELECT * FROM pg_policies 
      WHERE tablename = 'Client' 
      AND schemaname = 'public'
    `);

    // Vérification des politiques RLS sur la table Expert
    const expertPoliciesResult = await client.query(`
      SELECT * FROM pg_policies 
      WHERE tablename = 'Expert' 
      AND schemaname = 'public'
    `);

    client.release();

    console.log('✅ Politiques RLS vérifiées avec succès');
    console.log('Politiques Client:', clientPoliciesResult.rows.length);
    console.log('Politiques Expert:', expertPoliciesResult.rows.length);

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des politiques RLS:', error);
    return false;
  }
} 