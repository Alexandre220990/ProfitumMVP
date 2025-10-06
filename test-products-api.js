#!/usr/bin/env node

/**
 * Script de test pour vérifier l'API des produits
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testProductsAPI() {
  console.log('🧪 Test de l\'API des produits...\n');
  
  try {
    // Test de l'endpoint des produits
    console.log('1️⃣ Test de l\'endpoint /api/apporteur/produits...');
    
    const response = await fetch(`${API_URL}/api/apporteur/produits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: En production, vous devriez avoir un token d'authentification
      }
    });

    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Détails:', errorText);
      return;
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ API fonctionne: ${result.data?.length || 0} produits récupérés`);
      
      if (result.data && result.data.length > 0) {
        console.log('\n📋 Premiers produits:');
        result.data.slice(0, 3).forEach((produit, index) => {
          console.log(`${index + 1}. ${produit.nom}`);
          console.log(`   Catégorie: ${produit.categorie}`);
          console.log(`   Montant: ${produit.montant_min}€ - ${produit.montant_max}€`);
          console.log(`   Taux: ${produit.taux_min}% - ${produit.taux_max}%`);
        });
        
        if (result.data.length > 3) {
          console.log(`   ... et ${result.data.length - 3} autres produits`);
        }
      }
    } else {
      console.error('❌ API retourne une erreur:', result.error);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testProductsAPI().catch(console.error);
