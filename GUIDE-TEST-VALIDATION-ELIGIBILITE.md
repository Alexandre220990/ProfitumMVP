# 🧪 Guide de Test : Système de Validation d'Éligibilité

## 🎯 Objectif
Tester le workflow complet de validation d'éligibilité depuis le client jusqu'à l'admin et retour au client.

---

## 📋 Prérequis

### 1. Déploiements
- ✅ Backend déployé sur Railway (auto-deploy)
- ✅ Frontend déployé sur Vercel (auto-deploy)
- ⏱️ Attendre 2-3 minutes après le dernier push

### 2. Comptes de Test
- **Client** : grandjean.laporte@gmail.com
- **Admin** : Votre compte admin
- **Dossier** : https://www.profitum.app/produits/ticpe/93374842-cca6-4873-b16e-0ada92e97004

---

## 🔄 Workflow de Test Complet

### 📱 PARTIE 1 : CLIENT - Upload Documents (5 min)

**Étape 1.1 : Accéder au Dossier**
1. Ouvrir : https://www.profitum.app/produits/ticpe/93374842-cca6-4873-b16e-0ada92e97004
2. Se connecter en tant que **client**
3. Vérifier que l'étape 1 "Confirmer l'éligibilité" est affichée

**Étape 1.2 : Upload des 3 Documents**
1. **Upload KBIS** :
   - Cliquer sur "Choisir un fichier" pour KBIS
   - Sélectionner un PDF
   - Vérifier : ✅ apparaît + bouton "Visualiser"

2. **Upload Certificat Immatriculation** :
   - Cliquer sur "Choisir un fichier" pour Immatriculation
   - Sélectionner un PDF (même avec accents/espaces dans le nom)
   - Vérifier : ✅ apparaît

3. **Upload Facture Carburant** :
   - Cliquer sur "Choisir un fichier" pour Facture
   - Sélectionner un PDF
   - Vérifier : ✅ apparaît

**Étape 1.3 : Tester Visualisation**
1. Cliquer sur "👁️" (Visualiser) pour chaque document
2. ✅ **Attendu** : Document s'ouvre dans nouvel onglet (pas d'erreur "Bucket not found")

**Étape 1.4 : Valider l'Étape**
1. Cliquer sur **"Valider l'étape"** (bouton vert)
2. ✅ **Attendu** : 
   - Toast : "Documents envoyés avec succès ! Nos équipes vérifient votre éligibilité."
   - Description : "Vous recevrez une notification sous 24-48h"

**Étape 1.5 : Vérifier l'État d'Attente**
1. La page doit afficher un **grand encadré gris/ardoise** :
   ```
   ⏳ En attente de validation par nos équipes
   
   Vos documents d'éligibilité ont bien été transmis à nos équipes. 
   Nous vérifions actuellement votre dossier.
   
   📋 Délai habituel de traitement
   Vous recevrez une notification sous 24 à 48 heures ouvrées.
   
   [Modifier ou ajouter des documents]
   ```

2. **L'étape 2** "Sélection de l'expert" doit être **verrouillée** (grisée/En attente)

3. Bouton "Modifier ou ajouter des documents" doit être visible

**Étape 1.6 : Vérifier Console Navigateur**
Ouvrir la console (F12) et vérifier :
- 🔑 Token disponible : OUI
- 📤 Appel PUT vers `/produits-eligibles/...`
- Body contient : `statut: 'documents_uploaded', current_step: 1, progress: 15`
- 📥 Réponse : 200 OK

---

### 👑 PARTIE 2 : ADMIN - Validation (5 min)

**Étape 2.1 : Accéder au Dashboard Admin**
1. Ouvrir : https://www.profitum.app/admin/dashboard-optimized
2. Se connecter en tant que **admin**
3. Vérifier l'authentification

**Étape 2.2 : Voir les Dossiers en Attente**
1. Cliquer sur l'onglet **"Dossiers"** dans le menu
2. Attendre le chargement
3. ✅ **Attendu** : Voir le dossier avec :
   - Badge : `documents_uploaded`
   - Boutons : **"✅ Valider éligibilité"** (vert) + **"❌ Refuser"** (rouge)

**Étape 2.3 : Valider l'Éligibilité**
1. Cliquer sur **"✅ Valider éligibilité"**
2. Popup de confirmation : "Confirmer la validation d'éligibilité pour..."
3. Cliquer **OK**
4. ✅ **Attendu** :
   - Toast : "✅ Éligibilité validée avec succès !"
   - Description : "Le client peut maintenant sélectionner un expert"
   - Le dossier disparaît de la liste OU badge passe à "✅ Éligibilité validée"

**Étape 2.4 : Vérifier les Logs Backend (Railway)**
Dans Railway Dashboard → Logs, chercher :
- `📝 Validation éligibilité:`
- `✅ Éligibilité validée pour le dossier...`

---

### 📱 PARTIE 3 : CLIENT - Vérifier Déverrouillage (2 min)

**Étape 3.1 : Recharger la Page Client**
1. Retourner sur : https://www.profitum.app/produits/ticpe/93374842-cca6-4873-b16e-0ada92e97004
2. Rafraîchir la page (F5)

**Étape 3.2 : Vérifier le Message Vert**
✅ **Attendu** : Voir un **grand encadré VERT** :
```
✅ Pré-éligibilité confirmée

Félicitations ! Votre dossier a été validé par nos équipes le 15 octobre 2025.
Vous pouvez maintenant passer à l'étape suivante.
```

**Étape 3.3 : Vérifier Déverrouillage Étape 2**
1. L'étape 2 **"Sélection de l'expert"** doit être **déverrouillée**
2. Badge doit indiquer "En cours" (bleu) au lieu de "En attente"
3. Le contenu de l'étape 2 doit être visible/interactif

**Étape 3.4 : Vérifier Masquage Upload**
Le formulaire d'upload des documents doit être **masqué** (puisque éligibilité validée).
Seul le message vert est visible dans l'étape 1.

---

## 🧪 Test Scénario Rejet (Optionnel)

### Test Admin Rejette

**Sur Dashboard Admin** :
1. Trouver un autre dossier avec `documents_uploaded`
2. Cliquer **"❌ Refuser"**
3. Dans le prompt, écrire : "KBIS obsolète - doit avoir moins de 3 mois"
4. Valider

**Sur Page Client** :
1. Recharger
2. ✅ **Attendu** : Voir un **encadré ROUGE** :
   ```
   ❌ Éligibilité non confirmée
   
   Votre dossier n'a pas pu être validé en l'état.
   Merci de compléter ou corriger vos documents.
   
   Raison du refus :
   KBIS obsolète - doit avoir moins de 3 mois
   
   [Mettre à jour les documents]
   ```

3. Le client peut réuploader des documents
4. Après réupload, le cycle recommence

---

## ✅ Checklist de Validation

### Client
- [ ] Upload 3 documents fonctionne
- [ ] Visualisation documents fonctionne (URL signée)
- [ ] Validation étape affiche message d'attente (gris)
- [ ] Étape 2 reste verrouillée après validation
- [ ] Toast correct : "Nos équipes vérifient..."

### Admin
- [ ] Dossiers avec `documents_uploaded` visibles
- [ ] Boutons "Valider éligibilité" et "Refuser" fonctionnels
- [ ] Confirmation popup affichée
- [ ] Toast de succès après validation
- [ ] Dossier mis à jour dans la liste

### Client (après validation admin)
- [ ] Message vert "Pré-éligibilité confirmée" affiché
- [ ] Étape 2 déverrouillée et accessible
- [ ] Upload masqué dans étape 1
- [ ] Date de validation affichée
- [ ] Bouton "Sélectionner un expert" accessible

---

## 🐛 Problèmes Possibles et Solutions

### Problème : Documents uploadés non visibles après refresh
**Solution** : Déjà corrigé - filtre par `metadata.client_produit_id`

### Problème : Bouton "Valider éligibilité" ne fait rien
**Causes possibles** :
1. Token admin manquant
2. Route backend non montée
3. CORS bloqué

**Debug** :
- Console navigateur (F12)
- Logs Railway
- Vérifier `config.API_URL` dans le code

### Problème : Étape 2 ne se déverrouille pas
**Causes possibles** :
1. `statut` != 'eligibility_validated' en BDD
2. `TICPEWorkflow` ne recharge pas le clientProduit

**Debug SQL** :
```sql
SELECT id, statut, current_step, progress, metadata
FROM "ClientProduitEligible"
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';
```

### Problème : Message d'attente ne s'affiche pas
**Cause** : `statut` != 'documents_uploaded'

**Debug** : Vérifier que `ProductDocumentUpload` met bien `statut: 'documents_uploaded'`

---

## 📊 Commandes SQL de Vérification

### Voir l'état actuel du dossier
```sql
SELECT 
  id,
  statut,
  current_step,
  progress,
  metadata->>'eligibility_validation' as validation_info,
  updated_at
FROM "ClientProduitEligible"
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';
```

### Voir les documents uploadés
```sql
SELECT 
  id,
  filename,
  document_type,
  status,
  metadata->>'client_produit_id' as dossier_id,
  created_at
FROM "ClientProcessDocument"
WHERE metadata->>'client_produit_id' = '93374842-cca6-4873-b16e-0ada92e97004'
ORDER BY created_at DESC;
```

### Forcer un statut pour test
```sql
-- Forcer retour à documents_uploaded (pour retester)
UPDATE "ClientProduitEligible"
SET 
  statut = 'documents_uploaded',
  current_step = 1,
  progress = 15
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';

-- Forcer validation (pour tester l'étape 2)
UPDATE "ClientProduitEligible"
SET 
  statut = 'eligibility_validated',
  current_step = 2,
  progress = 25,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{eligibility_validation}',
    '{"status": "validated", "validated_at": "2025-10-15T12:00:00Z", "notes": "Test validation"}'
  )
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';
```

---

## 🎉 Résultat Final Attendu

### Vue Client (Avant Validation)
```
┌─────────────────────────────────────────────────────┐
│ Étape 1 : Confirmer l'éligibilité         [En cours]│
├─────────────────────────────────────────────────────┤
│                                                      │
│  ⏳ EN ATTENTE DE VALIDATION PAR NOS ÉQUIPES        │
│                                                      │
│  Vos documents d'éligibilité ont bien été transmis. │
│  Délai : 24-48 heures ouvrées.                      │
│                                                      │
│  [Modifier ou ajouter des documents]                │
│                                                      │
├─────────────────────────────────────────────────────┤
│ Étape 2 : Sélection de l'expert        [En attente]│ ← VERROUILLÉE
└─────────────────────────────────────────────────────┘
```

### Vue Admin
```
┌─────────────────────────────────────────────────────┐
│ Dossier #93374842...                                │
│ Client: La société DFS                              │
│ Produit: TICPE                                       │
│ Statut: [documents_uploaded]                        │
│ Montant: 15 000 €                                   │
│                                                      │
│ [Voir détails] [✅ Valider éligibilité] [❌ Refuser] │
└─────────────────────────────────────────────────────┘
```

### Vue Client (Après Validation)
```
┌─────────────────────────────────────────────────────┐
│ Étape 1 : Confirmer l'éligibilité         [Terminé]│
├─────────────────────────────────────────────────────┤
│                                                      │
│  ✅ PRÉ-ÉLIGIBILITÉ CONFIRMÉE                        │
│                                                      │
│  Félicitations ! Votre dossier a été validé par     │
│  nos équipes le 15 octobre 2025.                    │
│  Vous pouvez maintenant passer à l'étape suivante.  │
│                                                      │
├─────────────────────────────────────────────────────┤
│ Étape 2 : Sélection de l'expert        [En cours] │ ← DÉVERROUILLÉE
│                                                      │
│  Choisir l'expert qui vous accompagnera             │
│  [Liste des experts disponibles]                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📸 Captures d'Écran à Faire

Pour validation :
1. **Client - État d'attente** (encadré gris)
2. **Admin - Liste dossiers** (avec boutons)
3. **Admin - Popup confirmation**
4. **Client - Encadré vert** (éligibilité confirmée)
5. **Client - Étape 2 déverrouillée**

---

## 🔍 Points de Contrôle Techniques

### Logs Backend à Vérifier
```
✅ Fichier uploadé vers Storage
✅ Document enregistré en BDD
📝 Mise à jour produit éligible: { statut: 'documents_uploaded', ... }
📝 Validation éligibilité: { action: 'approve', ... }
✅ Éligibilité validée pour le dossier ...
```

### Console Frontend à Vérifier
```
🔑 Token disponible: OUI
📥 Chargement documents existants pour dossier: ...
📄 Documents trouvés: 3
✅ Documents du dossier chargés: 3
📤 Appel PUT /produits-eligibles avec: { statut: 'documents_uploaded', ... }
```

### BDD à Vérifier
```sql
-- Le dossier doit avoir :
statut = 'eligibility_validated'
current_step = 2
progress = 25
metadata.eligibility_validation.status = 'validated'
```

---

## ⚡ Scénarios de Test Rapides

### Test 1 : Happy Path (5 min)
Upload 3 docs → Valider → Admin valide → Étape 2 déverrouillée ✅

### Test 2 : Rejet (5 min)
Upload 3 docs → Valider → Admin refuse avec raison → Message rouge + réupload possible ✅

### Test 3 : Modification (3 min)
Après upload, cliquer "Modifier documents" → Peut supprimer et réuploader ✅

### Test 4 : Rechargement Page (2 min)
Après validation, F5 → Documents et statut persistent ✅

---

## 🎯 Critères de Succès

✅ **Fonctionnel** :
- Upload 3 documents fonctionne
- Visualisation fonctionne (URL signée)
- Message d'attente s'affiche correctement
- Admin peut valider/refuser
- Message vert après validation
- Étape 2 se déverrouille automatiquement

✅ **UX** :
- Messages clairs et professionnels
- Design cohérent et moderne
- Pas d'erreurs dans la console
- Transitions fluides
- Feedback immédiat (toasts)

✅ **Données** :
- Documents persistés en BDD
- Statut correctement mis à jour
- Métadonnées de validation stockées
- Progression synchronisée

---

## 📞 Support

En cas de problème :
1. Console navigateur (F12)
2. Logs Railway
3. Requêtes SQL de vérification
4. Vérifier variables d'environnement

**Tout est prêt pour les tests !** 🚀

