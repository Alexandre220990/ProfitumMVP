# ✅ Tests Post-Déploiement - Profitum

## 🎯 Objectif

Ce document liste tous les tests à effectuer après un déploiement pour s'assurer que la correction de l'erreur "Failed to fetch dynamically imported module" fonctionne correctement.

---

## 📋 Checklist Rapide

- [ ] Service Worker mis à jour
- [ ] Gestion d'erreur fonctionne
- [ ] ErrorBoundary affiche correctement
- [ ] Notification de mise à jour apparaît
- [ ] Cache intelligent fonctionne
- [ ] Navigation entre pages OK
- [ ] Tous les rôles fonctionnent (Admin, Expert, Client, Apporteur)

---

## 🧪 Tests Détaillés

### 1. Test du Service Worker

#### 1.1 Vérification de l'enregistrement

**Étapes :**
1. Ouvrir la page en production
2. Ouvrir DevTools (F12)
3. Aller dans l'onglet **Console**
4. Vérifier les logs

**Résultat attendu :**
```
✅ Service Worker enregistré: ServiceWorkerRegistration {...}
🚀 Service Worker Profitum prêt - Version: v1.0.1
```

#### 1.2 Vérification de la version

**Étapes :**
1. Dans DevTools, aller dans **Application** > **Service Workers**
2. Vérifier que le SW est actif
3. Noter la version

**Résultat attendu :**
- Status: **activated and is running**
- Script URL: `https://www.profitum.app/sw.js`
- Version: Dernière version incrémentée

#### 1.3 Test de mise à jour

**Étapes :**
1. Dans **Application** > **Service Workers**
2. Cliquer sur "Update"
3. Vérifier les logs

**Résultat attendu :**
```
🔄 Service Worker mis à jour vers la version: v1.0.1
```

### 2. Test de la Gestion d'Erreur

#### 2.1 Simulation d'erreur de chunk

**Étapes :**
1. Ouvrir DevTools > **Console**
2. Exécuter ce code :
```javascript
window.dispatchEvent(new ErrorEvent('error', {
  message: 'Failed to fetch dynamically imported module: https://www.profitum.app/assets/test-chunk.js'
}));
```

**Résultat attendu :**
- Log: `🔄 Erreur de chargement de module détectée, rechargement de la page...`
- La page se recharge automatiquement

#### 2.2 Test avec promesse rejetée

**Étapes :**
1. Dans la console, exécuter :
```javascript
window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
  reason: new Error('Failed to fetch dynamically imported module: test.js')
}));
```

**Résultat attendu :**
- Log: `🔄 Erreur de promesse détectée (chunk), rechargement de la page...`
- La page se recharge

### 3. Test de l'ErrorBoundary

#### 3.1 Navigation normale

**Étapes :**
1. Se connecter avec un compte Admin
2. Naviguer vers `/admin/apporteurs/[id]`
3. Vérifier que la page charge correctement

**Résultat attendu :**
- Page charge sans erreur
- Aucun message d'erreur affiché

#### 3.2 Test avec navigation rapide

**Étapes :**
1. Cliquer rapidement sur plusieurs liens de navigation
2. Revenir en arrière avec le bouton du navigateur
3. Naviguer à nouveau vers une autre page

**Résultat attendu :**
- Navigation fluide
- Pas d'erreur de chunk
- Si erreur : rechargement automatique

### 4. Test de la Notification de Mise à Jour

#### 4.1 Détecter une nouvelle version

**Note :** Ce test nécessite de déployer une nouvelle version pendant qu'un utilisateur est connecté.

**Étapes :**
1. Un utilisateur est connecté et navigue sur l'application
2. Déployer une nouvelle version en production
3. Attendre jusqu'à 60 secondes (vérification automatique)

**Résultat attendu :**
- Une notification bleue apparaît en bas à droite
- Texte : "Mise à jour disponible"
- Bouton "Mettre à jour"
- Bouton "Plus tard"

#### 4.2 Test du bouton "Mettre à jour"

**Étapes :**
1. Quand la notification apparaît
2. Cliquer sur "Mettre à jour"

**Résultat attendu :**
- La page se recharge immédiatement
- La nouvelle version est chargée
- Notification disparaît

#### 4.3 Test du bouton "Plus tard"

**Étapes :**
1. Quand la notification apparaît
2. Cliquer sur "Plus tard"

**Résultat attendu :**
- La notification disparaît
- L'utilisateur peut continuer à utiliser l'ancienne version
- La notification peut réapparaître plus tard

### 5. Test du Cache Intelligent

#### 5.1 Test Network First (JS/CSS)

**Étapes :**
1. Ouvrir DevTools > **Network**
2. Recharger la page (Ctrl+R)
3. Observer les requêtes JS/CSS

**Résultat attendu :**
- Requêtes JS/CSS viennent du **réseau** en priorité
- Si réseau échoue : viennent du **cache**
- Status : `200` ou `(from cache)`

#### 5.2 Test Cache First (Images)

**Étapes :**
1. Dans **Network**, filtrer par **Img**
2. Recharger la page
3. Observer les requêtes d'images

**Résultat attendu :**
- Images viennent du **cache** en priorité
- Status : `(from disk cache)` ou `(from memory cache)`
- Si pas en cache : `200` depuis le réseau

#### 5.3 Test de nettoyage du cache

**Étapes :**
1. Ouvrir DevTools > **Application** > **Cache Storage**
2. Noter les caches présents
3. Déployer une nouvelle version
4. Recharger la page
5. Vérifier les caches à nouveau

**Résultat attendu :**
- Ancien cache supprimé automatiquement
- Nouveau cache créé avec la nouvelle version
- Exemple : `profitum-cache-v1.0.1`

### 6. Test de Navigation Entre Pages

#### 6.1 Navigation Admin

**Étapes :**
1. Se connecter en tant qu'Admin
2. Naviguer vers :
   - Dashboard (`/admin/dashboard-optimized`)
   - Prospection (`/admin/prospection`)
   - Clients (`/admin/gestion-clients`)
   - Apporteurs (`/admin/apporteurs/[id]`)
   - Documents (`/admin/documents-ged`)

**Résultat attendu :**
- Toutes les pages chargent correctement
- Pas d'erreur de chunk
- Navigation fluide

#### 6.2 Navigation Apporteur

**Étapes :**
1. Se connecter en tant qu'Apporteur
2. Naviguer vers :
   - Dashboard (`/apporteur/dashboard`)
   - Prospects (`/apporteur/prospects`)
   - Agenda (`/apporteur/agenda`)
   - Commissions (`/apporteur/commissions`)

**Résultat attendu :**
- Toutes les pages chargent correctement
- Pas d'erreur de chunk

#### 6.3 Navigation Expert

**Étapes :**
1. Se connecter en tant qu'Expert
2. Naviguer vers :
   - Dashboard (`/expert/dashboard`)
   - Mes Affaires (`/expert/mes-affaires`)
   - Agenda (`/expert/agenda`)

**Résultat attendu :**
- Toutes les pages chargent correctement

#### 6.4 Navigation Client

**Étapes :**
1. Se connecter en tant que Client
2. Naviguer vers :
   - Dashboard (`/dashboard/client`)
   - Documents (`/documents-client`)
   - Messagerie (`/messagerie-client`)

**Résultat attendu :**
- Toutes les pages chargent correctement

### 7. Test de Rechargement Automatique

#### 7.1 Simulation d'un déploiement pendant l'utilisation

**Scénario :**
Un utilisateur utilise l'application, puis une nouvelle version est déployée.

**Étapes :**
1. Utilisateur A : Ouvrir l'application (ancienne version)
2. Développeur : Déployer une nouvelle version
3. Utilisateur A : Cliquer sur un lien qui charge un nouveau chunk

**Résultat attendu :**
- Le navigateur essaie de charger le chunk avec l'ancien hash
- Erreur 404 détectée
- Page se recharge automatiquement
- Nouvelle version se charge
- Navigation continue normalement

### 8. Test de Compatibilité Navigateur

#### 8.1 Chrome/Edge

**Étapes :**
1. Ouvrir dans Chrome/Edge
2. Effectuer tous les tests ci-dessus

**Résultat attendu :** ✅ Tous les tests passent

#### 8.2 Firefox

**Étapes :**
1. Ouvrir dans Firefox
2. Effectuer tous les tests ci-dessus

**Résultat attendu :** ✅ Tous les tests passent

#### 8.3 Safari

**Étapes :**
1. Ouvrir dans Safari
2. Effectuer tous les tests ci-dessus

**Résultat attendu :** ✅ Tous les tests passent

#### 8.4 Mobile (iOS/Android)

**Étapes :**
1. Ouvrir sur mobile
2. Effectuer les tests de navigation
3. Tester le PWA (ajouter à l'écran d'accueil)

**Résultat attendu :** ✅ Tous les tests passent

### 9. Test de Performance

#### 9.1 Temps de chargement initial

**Étapes :**
1. Ouvrir DevTools > **Network**
2. Désactiver le cache
3. Recharger la page
4. Noter le temps de chargement

**Résultat attendu :**
- First Contentful Paint (FCP) : < 2s
- Largest Contentful Paint (LCP) : < 3s
- Time to Interactive (TTI) : < 5s

#### 9.2 Temps de chargement avec cache

**Étapes :**
1. Activer le cache
2. Recharger la page
3. Noter le temps de chargement

**Résultat attendu :**
- FCP : < 1s
- LCP : < 1.5s
- TTI : < 2s

### 10. Test de Résilience

#### 10.1 Test hors ligne

**Étapes :**
1. Ouvrir l'application
2. Ouvrir DevTools > **Network**
3. Activer "Offline"
4. Recharger la page

**Résultat attendu :**
- Page principale charge depuis le cache
- Message approprié si des données ne peuvent être chargées

#### 10.2 Test connexion lente

**Étapes :**
1. Dans **Network**, sélectionner "Slow 3G"
2. Naviguer dans l'application

**Résultat attendu :**
- Application reste utilisable
- Indicateurs de chargement visibles
- Pas de timeout d'erreur

---

## 📊 Rapport de Test

### Template de Rapport

```markdown
## Rapport de Test Post-Déploiement

**Date :** [Date]
**Version déployée :** v1.0.1
**Testeur :** [Nom]

### Résultats

| Test | Statut | Commentaires |
|------|--------|--------------|
| Service Worker | ✅ | Version correcte |
| Gestion d'erreur | ✅ | Rechargement automatique fonctionne |
| ErrorBoundary | ✅ | Interface conviviale |
| Notification MAJ | ✅ | Apparaît correctement |
| Cache intelligent | ✅ | Network/Cache First OK |
| Navigation Admin | ✅ | Toutes pages OK |
| Navigation Apporteur | ✅ | Toutes pages OK |
| Navigation Expert | ✅ | Toutes pages OK |
| Navigation Client | ✅ | Toutes pages OK |
| Chrome/Edge | ✅ | Compatible |
| Firefox | ✅ | Compatible |
| Safari | ✅ | Compatible |
| Mobile | ✅ | Compatible |
| Performance | ✅ | Temps acceptables |
| Hors ligne | ✅ | Cache fonctionne |

### Problèmes Détectés

- Aucun

### Recommandations

- Surveiller les logs pendant 24h
- Vérifier les métriques utilisateurs
```

---

## 🚨 Procédure en Cas de Problème

Si un test échoue :

1. **Noter les détails** :
   - Quel test a échoué
   - Message d'erreur exact
   - Navigateur et version
   - Steps to reproduce

2. **Vérifier les logs** :
   - Console navigateur
   - Service Worker logs
   - Network tab

3. **Solutions rapides** :
   - Vider le cache : `npm run clear-cache` puis redéployer
   - Forcer l'update du SW : Dans DevTools > Application > Update
   - Rollback si critique : Déployer la version précédente

4. **Contacter l'équipe** si problème persiste

---

## ✅ Validation Finale

**Tous les tests sont passés ?**
- [ ] Oui → Déploiement validé ✅
- [ ] Non → Identifier et corriger les problèmes

**Actions post-validation :**
- [ ] Documenter les résultats
- [ ] Notifier l'équipe
- [ ] Surveiller les métriques pendant 24h
- [ ] Mettre à jour ce document si nécessaire

---

**Date de création :** 4 Décembre 2025  
**Dernière mise à jour :** 4 Décembre 2025  
**Version :** 1.0.0

