# 🎯 Guide d'Unification de la Nomenclature des Tables

## 📋 Problème Identifié

Votre base de données contient des tables avec une double nomenclature :
- **Tables en MAJUSCULES** (à conserver) : `Client`, `Expert`, `DocumentFile`, etc.
- **Tables en minuscules** (à supprimer) : `client`, `expert`, `documentfile`, etc.

## 🎯 Objectif

Unifier la nomenclature en gardant uniquement les tables en **MAJUSCULES** et migrer les données des tables en minuscules.

## 📊 État Actuel

### Tables avec Double Nomenclature
| Table Majuscule | Lignes | Taille | Table Minuscule | Lignes | Taille |
|-----------------|--------|--------|-----------------|--------|--------|
| `Client` | 5 | 224 kB | `client` | 2 | 80 kB |
| `Expert` | 13 | 216 kB | `expert` | 2 | 88 kB |
| `DocumentFile` | 4 | 248 kB | `documentfile` | 2 | 80 kB |

### Tables Uniques (OK)
- ✅ `ProduitEligible` (10 lignes, 64 kB)
- ✅ `ClientProduitEligible` (6 lignes, 208 kB)
- ✅ `Admin` (1 ligne, 80 kB)

## 🚀 Plan d'Exécution Étape par Étape

### **Étape 1 : Vérification Pré-Migration**

1. **Accéder à Supabase**
   ```
   https://supabase.com → Votre projet → SQL Editor
   ```

2. **Exécuter le script de vérification**
   ```bash
   cd server/scripts
   node verify-table-nomenclature.js
   ```

3. **Vérifier les résultats**
   - Confirmer les tables en double
   - Noter le nombre de lignes à migrer

### **Étape 2 : Sauvegarde (Recommandée)**

1. **Créer une sauvegarde manuelle**
   ```sql
   -- Dans Supabase SQL Editor
   -- Exporter les données importantes
   SELECT * FROM client;
   SELECT * FROM expert;
   SELECT * FROM documentfile;
   ```

2. **Ou utiliser la sauvegarde automatique Supabase**
   - Aller dans Settings → Database
   - Cliquer sur "Create backup"

### **Étape 3 : Migration des Données**

1. **Exécuter le script de migration**
   ```sql
   -- Copier le contenu de server/migrations/20250103_unify_table_nomenclature.sql
   -- Dans Supabase SQL Editor
   -- Cliquer sur "Run"
   ```

2. **Vérifier l'exécution**
   - Attendre 2-3 minutes
   - Vérifier les messages de confirmation

### **Étape 4 : Vérification Post-Migration**

1. **Vérifier les tables restantes**
   ```sql
   -- Vérifier que les tables en minuscules n'existent plus
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('client', 'expert', 'documentfile');
   ```

2. **Vérifier les données migrées**
   ```sql
   -- Compter les lignes dans les tables en majuscules
   SELECT 'Client' as table_name, COUNT(*) as total_rows FROM "Client"
   UNION ALL
   SELECT 'Expert' as table_name, COUNT(*) as total_rows FROM "Expert"
   UNION ALL
   SELECT 'DocumentFile' as table_name, COUNT(*) as total_rows FROM "DocumentFile";
   ```

### **Étape 5 : Test de l'Application**

1. **Tester les fonctionnalités principales**
   - Connexion client/expert
   - Affichage des données
   - Création de nouveaux enregistrements

2. **Vérifier les logs d'erreur**
   - Surveiller les erreurs de base de données
   - Vérifier les requêtes qui échouent

## ⚠️ Points d'Attention

### **Avant la Migration**
- ✅ Faire une sauvegarde complète
- ✅ Tester sur un environnement de développement
- ✅ Vérifier les dépendances (clés étrangères)
- ✅ Noter les heures de faible trafic

### **Pendant la Migration**
- ⏸️ Arrêter temporairement l'application si possible
- 🔍 Surveiller les logs d'erreur
- ⏱️ La migration prend 2-3 minutes

### **Après la Migration**
- ✅ Vérifier l'intégrité des données
- ✅ Tester toutes les fonctionnalités
- ✅ Mettre à jour la documentation
- ✅ Informer l'équipe du changement

## 🔧 Scripts Disponibles

### **1. Script de Vérification**
```bash
# Vérifier l'état actuel
cd server/scripts
node verify-table-nomenclature.js
```

### **2. Script de Migration**
```sql
-- Fichier: server/migrations/20250103_unify_table_nomenclature.sql
-- À exécuter dans Supabase SQL Editor
```

### **3. Script de Nettoyage (Optionnel)**
```bash
# Nettoyer les tables temporaires si nécessaire
cd server/scripts
./cleanup-minuscule-tables.sh
```

## 📈 Résultats Attendus

### **Après Migration**
- ✅ Plus de tables en minuscules
- ✅ Toutes les données conservées
- ✅ Nomenclature unifiée
- ✅ Performance améliorée
- ✅ Maintenance simplifiée

### **Tables Finales**
| Table | Lignes | Statut |
|-------|--------|--------|
| `Client` | 7 | ✅ Unifiée |
| `Expert` | 15 | ✅ Unifiée |
| `DocumentFile` | 6 | ✅ Unifiée |
| `ProduitEligible` | 10 | ✅ Inchangée |
| `ClientProduitEligible` | 6 | ✅ Inchangée |

## 🆘 En Cas de Problème

### **Erreur de Migration**
1. **Arrêter immédiatement** l'exécution
2. **Vérifier les logs** d'erreur
3. **Restaurer** la sauvegarde si nécessaire
4. **Analyser** la cause de l'erreur
5. **Corriger** le script de migration

### **Données Manquantes**
1. **Vérifier** les tables temporaires
2. **Récupérer** les données depuis la sauvegarde
3. **Insérer manuellement** si nécessaire
4. **Vérifier** l'intégrité des relations

### **Application Cassée**
1. **Vérifier** les requêtes dans le code
2. **Mettre à jour** les noms de tables
3. **Redéployer** l'application
4. **Tester** toutes les fonctionnalités

## 📞 Support

En cas de problème :
- **Documentation** : Vérifier ce guide
- **Logs** : Consulter les logs Supabase
- **Sauvegarde** : Utiliser la sauvegarde automatique
- **Équipe** : Contacter l'équipe technique

---

**Date de création :** 3 Janvier 2025  
**Version :** 1.0  
**Statut :** Prêt pour exécution 