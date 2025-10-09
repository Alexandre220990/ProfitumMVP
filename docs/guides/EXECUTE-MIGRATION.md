# 🚀 EXÉCUTION MIGRATION RDV - Guide Rapide

**Script corrigé :** `server/migrations/20250110_unify_rdv_architecture_FIXED.sql`

---

## ⚠️ AVANT DE COMMENCER

### 1. BACKUP OBLIGATOIRE ⚠️

**Dans Supabase Dashboard :**
1. Database > Backups
2. "Create backup"
3. Nom : `backup_avant_migration_rdv_09_oct_2025`
4. ✅ Attendre confirmation

---

## 🎯 EXÉCUTION (5 MINUTES)

### Étape 1 : Ouvrir le script corrigé

Fichier : `server/migrations/20250110_unify_rdv_architecture_FIXED.sql`

### Étape 2 : Copier TOUT le contenu

- Sélectionner tout (Cmd+A ou Ctrl+A)
- Copier (Cmd+C ou Ctrl+C)

### Étape 3 : Supabase SQL Editor

1. Aller sur https://supabase.com
2. Sélectionner votre projet
3. Cliquer sur **SQL Editor**
4. Cliquer sur **"New query"**

### Étape 4 : Coller et Exécuter

1. Coller le script complet
2. Cliquer sur **"Run"** (en bas à droite)
3. ⏱️ Attendre ~1-2 minutes

---

## ✅ VÉRIFICATION SUCCÈS

### Messages attendus :

```
✅ Table ClientRDV renommée en RDV
✅ Table ClientRDV_Produits renommée en RDV_Produits
✅ Colonne client_rdv_id renommée en rdv_id
✅ Nouveaux champs ajoutés à la table RDV
✅ Données existantes mises à jour
✅ Index créés/mis à jour
✅ Politiques RLS mises à jour
✅ Contraintes ajoutées
✅ Fonctions utilitaires créées
✅ Trigger updated_at créé
📊 Nombre total de RDV : X
📊 Nombre total de produits liés : X
✅ Tous les RDV ont un titre
✅ Tous les RDV ont une catégorie
╔════════════════════════════════════════════════════════════╗
║  ✅ MIGRATION TERMINÉE AVEC SUCCÈS                        ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🧪 TEST POST-MIGRATION

### Test 1 : Script de vérification

```bash
cd /Users/alex/Desktop/FinancialTracker/server
node scripts/verifier-migration-rdv.js
```

**Résultat attendu :**
```
✅ Table RDV : Opérationnelle
✅ Table RDV_Produits : Opérationnelle
✅ Total RDV : X
✅ Total produits liés : X
```

### Test 2 : Vérification manuelle dans Supabase

```sql
-- Vérifier que RDV existe
SELECT COUNT(*) FROM "RDV";

-- Vérifier les nouveaux champs
SELECT id, title, category, source, created_by 
FROM "RDV" 
LIMIT 3;

-- Vérifier que ClientRDV n'existe plus
SELECT * FROM "ClientRDV";
-- Doit retourner : relation "ClientRDV" does not exist ✅
```

---

## 🎯 REDÉMARRER LE SERVEUR

```bash
cd /Users/alex/Desktop/FinancialTracker/server
npm run dev
```

**Vérifier les logs :**
```
🎯 Routes RDV unifiées montées sur /api/rdv
```

---

## 🎉 SI TOUT EST ✅

**Migration réussie !** Passez à l'étape suivante :

**Prochaine étape :** Tester l'API

```bash
# Obtenir votre token d'authentification
# Puis lancer le test :
./TEST-RDV-API.sh YOUR_TOKEN_HERE
```

---

## 🚨 EN CAS D'ERREUR

### Si erreur "column does not exist"

**C'est normal !** Le script corrigé ajoute d'abord les colonnes avant de les utiliser.

### Si erreur "relation does not exist"

Vérifier que les tables `ClientRDV` et `ClientRDV_Produits` existent bien avant migration.

### Si migration bloquée

1. Restaurer le backup (Database > Backups > Restore)
2. Vérifier les logs d'erreur
3. Contacter le support avec les logs

---

## 📋 CHECKLIST RAPIDE

- [ ] Backup créé ✅
- [ ] Script corrigé copié ✅
- [ ] Exécuté dans SQL Editor ✅
- [ ] Messages de succès affichés ✅
- [ ] Script de vérification passé ✅
- [ ] Serveur redémarré ✅
- [ ] Routes `/api/rdv` accessible ✅

---

**Durée totale : 5-10 minutes**  
**Fichier SQL : `20250110_unify_rdv_architecture_FIXED.sql`**

🎯 **Prêt ? Exécutez le script maintenant !**

