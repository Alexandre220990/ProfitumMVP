import { supabase } from '../lib/supabase';

const produitsEligibles = [
  {
    nom: 'Récupération TICPE',
    description: 'Remboursement de la taxe sur les carburants professionnels',
    tauxMin: 0.10,
    tauxMax: 0.20,
    montantMin: 1000,
    montantMax: 100000,
    dureeMin: 12,
    dureeMax: 36
  },
  {
    nom: 'Déduction Forfaitaire Spécifique',
    description: 'Réduction de l\'assiette des cotisations sociales pour métiers techniques',
    tauxMin: 0.05,
    tauxMax: 0.15,
    montantMin: 500,
    montantMax: 50000,
    dureeMin: 12,
    dureeMax: 24
  },
  {
    nom: 'Optimisation URSSAF',
    description: 'Trop-perçus et régularisations de cotisations sociales',
    tauxMin: 0.01,
    tauxMax: 0.05,
    montantMin: 1000,
    montantMax: 100000,
    dureeMin: 6,
    dureeMax: 18
  },
  {
    nom: 'Optimisation Taxe Foncière',
    description: 'Optimisation de la taxe foncière sur les propriétés bâties',
    tauxMin: 0.20,
    tauxMax: 0.40,
    montantMin: 500,
    montantMax: 25000,
    dureeMin: 12,
    dureeMax: 24
  },
  {
    nom: 'Optimisation Énergie',
    description: 'Optimisation des contrats d\'électricité et de gaz',
    tauxMin: 0.05,
    tauxMax: 0.15,
    montantMin: 500,
    montantMax: 20000,
    dureeMin: 12,
    dureeMax: 36
  }
];

async function insertProduitsEligibles() {
  console.log('🚀 Insertion des produits éligibles...');
  
  for (const produit of produitsEligibles) {
    try {
      // Vérifier si le produit existe déjà
      const { data: existing } = await supabase
        .from('ProduitEligible')
        .select('id')
        .eq('nom', produit.nom)
        .single();
      
      if (existing) {
        console.log(`✅ Produit déjà existant: ${produit.nom}`);
        continue;
      }
      
      // Insérer le nouveau produit
      const { data, error } = await supabase
        .from('ProduitEligible')
        .insert({
          nom: produit.nom,
          description: produit.description,
          tauxMin: produit.tauxMin,
          tauxMax: produit.tauxMax,
          montantMin: produit.montantMin,
          montantMax: produit.montantMax,
          dureeMin: produit.dureeMin,
          dureeMax: produit.dureeMax
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Erreur insertion ${produit.nom}:`, error);
      } else {
        console.log(`✅ Produit inséré: ${produit.nom} (ID: ${data.id})`);
      }
      
    } catch (error) {
      console.error(`❌ Erreur pour ${produit.nom}:`, error);
    }
  }
  
  console.log('🎉 Insertion terminée !');
}

// Exécuter le script
insertProduitsEligibles().catch(console.error); 