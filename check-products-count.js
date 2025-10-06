#!/usr/bin/env node

/**
 * Script pour vérifier le nombre de produits dans la base de données
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductsCount() {
  console.log('🔍 Vérification du nombre de produits dans la base de données...\n');
  
  try {
    // 1. Compter tous les produits
    const { count: totalCount, error: countError } = await supabase
      .from('ProduitEligible')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError);
      return;
    }

    console.log(`📊 Nombre total de produits: ${totalCount}`);

    // 2. Récupérer tous les produits avec leurs détails
    const { data: produits, error: dataError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .order('nom');

    if (dataError) {
      console.error('❌ Erreur lors de la récupération:', dataError);
      return;
    }

    console.log(`\n📋 Liste des produits:`);
    console.log('─'.repeat(80));
    
    produits.forEach((produit, index) => {
      console.log(`${index + 1}. ${produit.nom || 'Sans nom'}`);
      console.log(`   ID: ${produit.id}`);
      console.log(`   Description: ${produit.description || 'Aucune description'}`);
      console.log(`   Catégorie: ${produit.categorie || produit.category || 'Non spécifiée'}`);
      console.log(`   Montant: ${produit.montant_min || produit.montantMin || 0}€ - ${produit.montant_max || produit.montantMax || 0}€`);
      console.log(`   Taux: ${(produit.taux_min || produit.tauxMin || 0) * 100}% - ${(produit.taux_max || produit.tauxMax || 0) * 100}%`);
      console.log(`   Durée: ${produit.duree_min || produit.dureeMin || 0} - ${produit.duree_max || produit.dureeMax || 0} mois`);
      console.log(`   Créé: ${produit.created_at || 'Date inconnue'}`);
      console.log('─'.repeat(80));
    });

    // 3. Statistiques par catégorie
    const categories = {};
    produits.forEach(produit => {
      const categorie = produit.categorie || produit.category || 'Non spécifiée';
      categories[categorie] = (categories[categorie] || 0) + 1;
    });

    console.log(`\n📈 Répartition par catégorie:`);
    Object.entries(categories).forEach(([categorie, count]) => {
      console.log(`   ${categorie}: ${count} produit(s)`);
    });

    // 4. Vérifier les colonnes disponibles
    if (produits.length > 0) {
      console.log(`\n🔍 Colonnes disponibles dans la table:`);
      const firstProduct = produits[0];
      Object.keys(firstProduct).forEach(key => {
        console.log(`   - ${key}: ${typeof firstProduct[key]}`);
      });
    }

    console.log(`\n✅ Vérification terminée: ${produits.length} produits trouvés`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter le script
checkProductsCount().catch(console.error);
