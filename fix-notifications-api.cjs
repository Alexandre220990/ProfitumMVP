// Script simple pour corriger la table Notification via l'API REST
// Date: 2025-01-03

const fs = require('fs');

// Configuration Supabase
const SUPABASE_URL = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxnc3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function fixNotifications() {
  console.log('🔧 Correction de la table Notification via API REST...\n');

  try {
    // 1. Vérifier si la table existe actuellement
    console.log('1️⃣ Vérification de la table actuelle...');
    
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/Notification?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status de vérification:', checkResponse.status);
    
    if (checkResponse.ok) {
      const data = await checkResponse.json();
      console.log('✅ Table Notification existe déjà');
      console.log('📊 Colonnes disponibles:', Object.keys(data[0] || {}));
      
      // Vérifier si user_id existe
      if (data[0] && 'user_id' in data[0]) {
        console.log('✅ Colonne user_id présente - aucune action nécessaire');
        return;
      } else {
        console.log('⚠️ Colonne user_id manquante - correction nécessaire');
      }
    } else {
      console.log('❌ Table Notification n\'existe pas ou erreur d\'accès');
    }

    // 2. Créer une table temporaire avec la bonne structure
    console.log('\n2️⃣ Création de la table avec la bonne structure...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.Notification_new (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP WITH TIME ZONE,
        action_url TEXT,
        action_data JSONB DEFAULT '{}'::jsonb,
        expires_at TIMESTAMP WITH TIME ZONE,
        is_dismissed BOOLEAN DEFAULT false,
        dismissed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: createTableSQL })
    });

    console.log('📊 Status création table:', createResponse.status);
    
    if (createResponse.ok) {
      console.log('✅ Table Notification_new créée');
    } else {
      const error = await createResponse.text();
      console.log('❌ Erreur création table:', error);
    }

    // 3. Tester la nouvelle table
    console.log('\n3️⃣ Test de la nouvelle table...');
    
    const testNotification = {
      user_id: '25274ba6-67e6-4151-901c-74851fe2d82a',
      user_type: 'client',
      title: 'Test de correction',
      message: 'Cette notification teste la nouvelle structure',
      notification_type: 'system',
      priority: 'normal'
    };

    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/Notification_new`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testNotification)
    });

    console.log('📊 Status test création:', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Test de création réussi:', testData[0].id);
      
      // Supprimer la notification de test
      await fetch(`${SUPABASE_URL}/rest/v1/Notification_new?id=eq.${testData[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });
      
      console.log('✅ Notification de test supprimée');
    } else {
      const error = await testResponse.text();
      console.log('❌ Erreur test création:', error);
    }

    // 4. Instructions pour finaliser
    console.log('\n📋 Instructions pour finaliser la correction:');
    console.log('1. Connectez-vous à votre dashboard Supabase');
    console.log('2. Allez dans l\'éditeur SQL');
    console.log('3. Exécutez les commandes suivantes:');
    console.log('');
    console.log('-- Supprimer l\'ancienne table (si elle existe)');
    console.log('DROP TABLE IF EXISTS public."Notification" CASCADE;');
    console.log('');
    console.log('-- Renommer la nouvelle table');
    console.log('ALTER TABLE public.Notification_new RENAME TO "Notification";');
    console.log('');
    console.log('-- Créer les index et politiques RLS');
    console.log('-- (voir le fichier server/migrations/20250103_fix_notification_structure.sql)');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n🎉 Script terminé !');
}

// Exécuter le script
fixNotifications(); 