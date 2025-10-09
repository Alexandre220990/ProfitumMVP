# 📋 INSTRUCTIONS - Exécution Migration SQL

**Date :** 9 Octobre 2025  
**Fichier :** `server/migrations/20250110_unify_rdv_architecture.sql`  
**Durée estimée :** 10-15 minutes

---

## ⚠️ IMPORTANT - À LIRE AVANT DE COMMENCER

### Prérequis
- [ ] Avoir accès à Supabase Dashboard
- [ ] Avoir les droits admin sur la base de données
- [ ] Avoir prévenu les utilisateurs (maintenance)
- [ ] Avoir lu ce document en entier

### Risques
- ⚠️ **La migration renomme des tables** (ClientRDV → RDV)
- ⚠️ Les anciennes routes utilisant `ClientRDV` cesseront de fonctionner
- ⚠️ Migration irréversible (sans backup)

---

## ÉTAPE 1 : BACKUP (OBLIGATOIRE) ⚠️

### Option A : Via Supabase Dashboard (RECOMMANDÉ)

1. Aller sur https://supabase.com
2. Sélectionner votre projet
3. Aller dans **Database** > **Backups**
4. Cliquer sur **"Create backup"**
5. Nommer : `backup_avant_migration_rdv_09_oct_2025`
6. Attendre la fin du backup (quelques minutes)
7. ✅ Vérifier que le backup apparaît dans la liste

### Option B : Via Export SQL

```sql
-- Dans Supabase SQL Editor, exécuter :
-- Ceci créera un export des tables concernées

-- Export ClientRDV
COPY (SELECT * FROM "ClientRDV") TO STDOUT WITH CSV HEADER;

-- Export ClientRDV_Produits  
COPY (SELECT * FROM "ClientRDV_Produits") TO STDOUT WITH CSV HEADER;

-- Sauvegarder les résultats dans un fichier
```

---

## ÉTAPE 2 : VÉRIFICATION PRÉ-MIGRATION

### A. Compter les données existantes

```sql
-- Dans Supabase SQL Editor, exécuter :

-- Nombre de RDV
SELECT COUNT(*) as total_rdv FROM "ClientRDV";

-- Nombre de produits liés
SELECT COUNT(*) as total_produits FROM "ClientRDV_Produits";

-- Nombre d'événements CalendarEvent de type appointment
SELECT COUNT(*) as total_calendar_rdv 
FROM "CalendarEvent" 
WHERE type = 'appointment';
```

**Noter les résultats :**
- Total RDV : ___________
- Total produits : ___________
- Total calendar RDV : ___________

---

## ÉTAPE 3 : EXÉCUTION MIGRATION

### 1. Ouvrir le fichier SQL

- Ouvrir le fichier : `server/migrations/20250110_unify_rdv_architecture.sql`
- Copier TOUT le contenu (468 lignes)

### 2. Aller dans Supabase SQL Editor

1. Dashboard Supabase
2. Cliquer sur **SQL Editor** dans le menu gauche
3. Cliquer sur **"New query"**

### 3. Coller et exécuter

1. Coller le contenu du fichier SQL
2. **VÉRIFIER une dernière fois le backup** ⚠️
3. Cliquer sur **"Run"** (bouton en bas à droite)

### 4. Surveiller l'exécution

La migration va :
- Renommer les tables (quelques secondes)
- Ajouter les champs (quelques secondes)
- Migrer les données (dépend du volume)
- Créer les index (quelques secondes)
- Mettre à jour RLS (quelques secondes)

**Durée totale : 1-3 minutes**

### 5. Vérifier les messages

Vous devriez voir des messages comme :
```
✅ Tables renommées : ClientRDV → RDV, ClientRDV_Produits → RDV_Produits
✅ Nouveaux champs ajoutés à la table RDV
✅ Données existantes mises à jour avec les nouveaux champs
ℹ️ Aucun événement à migrer depuis CalendarEvent (ou X événements migrés)
✅ Index créés/mis à jour pour la table RDV
✅ Politiques RLS mises à jour pour la table RDV
✅ Politiques RLS mises à jour pour la table RDV_Produits
✅ Contraintes ajoutées sur la table RDV
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

### 6. En cas d'erreur

**Si vous voyez une erreur :**

1. **NE PAS PANIQUER** ⚠️
2. Copier le message d'erreur complet
3. Vérifier si des tables ont été modifiées :
   ```sql
   -- Vérifier quelle table existe
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('ClientRDV', 'RDV');
   ```
4. Si `ClientRDV` existe encore → Restaurer backup et corriger le script
5. Si `RDV` existe déjà → Migration peut-être partiellement réussie

**Contacter le support si besoin !**

---

## ÉTAPE 4 : VÉRIFICATION POST-MIGRATION

### A. Exécuter le script de vérification

```bash
cd server
node scripts/verifier-migration-rdv.js
```

**Résultat attendu :**
```
✅ Table RDV : Opérationnelle
✅ Table RDV_Produits : Opérationnelle
✅ Total RDV : X
✅ Total produits liés : X
✅ Nouveaux champs présents
✅ ClientRDV a bien été renommé
```

### B. Vérifier manuellement dans Supabase

```sql
-- Vérifier la table RDV
SELECT * FROM "RDV" LIMIT 5;

-- Vérifier les champs ajoutés
SELECT title, category, source, priority 
FROM "RDV" 
LIMIT 5;

-- Vérifier RDV_Produits
SELECT * FROM "RDV_Produits" LIMIT 5;

-- Vérifier que ClientRDV n'existe plus
SELECT * FROM "ClientRDV" LIMIT 1;
-- Doit retourner : relation "ClientRDV" does not exist
```

### C. Comparer les comptes

**Comparer avec les chiffres de l'ÉTAPE 2 :**

```sql
-- Recompter
SELECT COUNT(*) as total_rdv_apres FROM "RDV";
SELECT COUNT(*) as total_produits_apres FROM "RDV_Produits";
```

**Vérification :**
- Total RDV avant : ___________
- Total RDV après : ___________ (devrait être identique ou +X si migration CalendarEvent)
- Total produits avant : ___________
- Total produits après : ___________ (devrait être identique)

---

## ÉTAPE 5 : REDÉMARRER LE SERVEUR

```bash
cd server
npm run dev
```

**Vérifier les logs :**
```
🎯 Routes RDV unifiées montées sur /api/rdv
```

---

## ÉTAPE 6 : TEST API

### Test 1 : Récupérer les RDV

```bash
# Remplacer $TOKEN par votre token d'authentification
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/rdv
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": [...],
  "count": X
}
```

### Test 2 : Créer un RDV

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test RDV Migration",
    "scheduled_date": "2025-10-15",
    "scheduled_time": "10:00",
    "duration_minutes": 60,
    "meeting_type": "video",
    "expert_id": "expert-id-here",
    "client_id": "client-id-here",
    "notes": "Test de migration"
  }' \
  https://your-domain.com/api/rdv
```

---

## ÉTAPE 7 : TESTS FRONTEND

### Test 1 : Agenda Expert

1. Se connecter en tant qu'expert
2. Aller dans **Agenda**
3. Vérifier que les RDV s'affichent
4. Vérifier que les détails sont corrects

### Test 2 : Agenda Client

1. Se connecter en tant que client
2. Aller dans **Mon Calendrier**
3. Vérifier que ses RDV s'affichent

### Test 3 : Créer un RDV (Apporteur)

1. Se connecter en tant qu'apporteur
2. Créer un prospect
3. Planifier un RDV
4. Vérifier que le RDV apparaît dans l'agenda

---

## ✅ CHECKLIST FINALE

- [ ] Backup créé et vérifié
- [ ] Données comptées avant migration
- [ ] Migration SQL exécutée sans erreur
- [ ] Messages de succès affichés
- [ ] Script de vérification passé
- [ ] Données recomptées après migration
- [ ] Serveur redémarré sans erreur
- [ ] Route `/api/rdv` accessible
- [ ] Test API GET réussi
- [ ] Test API POST réussi
- [ ] Agenda expert fonctionnel
- [ ] Agenda client fonctionnel
- [ ] Agenda apporteur fonctionnel

---

## 🚨 EN CAS DE PROBLÈME

### Rollback (Restauration)

**Si la migration a échoué :**

1. Aller dans **Database** > **Backups**
2. Trouver le backup créé avant migration
3. Cliquer sur **"Restore"**
4. Attendre la restauration (5-10 min)
5. Vérifier que `ClientRDV` est de retour
6. Analyser l'erreur
7. Corriger le script SQL
8. Réessayer

### Support

**Logs à fournir en cas de problème :**
1. Message d'erreur SQL complet
2. Résultat du script de vérification
3. Logs du serveur Node.js
4. Capture d'écran de l'erreur

---

## 📞 CONTACT

**Documentation de référence :**
- `GUIDE-FINALISATION-ARCHITECTURE-RDV-UNIQUE.md`
- `PROPOSITION-ARCHITECTURE-UNIQUE-RDV.md`
- `RECAP-ARCHITECTURE-RDV-UNIQUE.md`

---

## 🎉 SUCCÈS !

**Si toutes les étapes sont ✅ :**

**Félicitations ! Votre architecture RDV est maintenant unifiée !** 🎊

**Vous avez :**
- ✅ 1 table RDV unique et propre
- ✅ Tous les agendas synchronisés
- ✅ Une architecture évolutive
- ✅ Un code maintenable

**Prochaine étape :** Adapter les composants frontend (1h)

---

*Instructions créées le 9 octobre 2025 - Migration sécurisée*

