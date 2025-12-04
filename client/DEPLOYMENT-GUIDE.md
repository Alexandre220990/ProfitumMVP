# 🚀 Guide de Déploiement - Profitum

## Solution Immédiate (Pour l'erreur actuelle)

Si vous voyez l'erreur `Failed to fetch dynamically imported module`, suivez ces étapes :

### Pour les utilisateurs

1. **Recharger la page** : 
   - Windows/Linux : `Ctrl + R`
   - Mac : `Cmd + R`

2. **Si l'erreur persiste, forcer le rechargement** :
   - Windows/Linux : `Ctrl + Shift + R`
   - Mac : `Cmd + Shift + R`

3. **En dernier recours, vider le cache** :
   - Chrome : `Paramètres` → `Confidentialité et sécurité` → `Effacer les données de navigation`
   - Firefox : `Paramètres` → `Vie privée et sécurité` → `Effacer les données`
   - Safari : `Safari` → `Préférences` → `Confidentialité` → `Gérer les données des sites web`

### Pour les développeurs

Déployez simplement la nouvelle version avec les corrections :

```bash
cd /Users/alex/Desktop/FinancialTracker/client
npm run deploy
```

Les utilisateurs seront automatiquement redirigés vers la nouvelle version.

---

## 📦 Déploiement Automatisé

### Méthode Recommandée

```bash
# Se placer dans le dossier client
cd client

# Lancer le déploiement automatisé
npm run deploy
```

Ce script va automatiquement :
1. ✅ Incrémenter la version du Service Worker
2. ✅ Afficher un résumé des changements
3. ✅ Lancer le build de production

### Étapes Manuelles

Si vous préférez plus de contrôle :

```bash
# 1. Mettre à jour la version du SW
npm run pre-deploy

# 2. Vérifier les changements
git diff public/sw.js

# 3. Commiter si nécessaire
git add public/sw.js
git commit -m "chore: bump service worker version"

# 4. Lancer le build
npm run build

# 5. Déployer vers votre plateforme
# (Vercel, Netlify, etc.)
```

---

## 🔧 Scripts Disponibles

### `npm run dev`
Lance le serveur de développement

### `npm run build`
Build de production (sans incrémentation de version)

### `npm run preview`
Prévisualiser le build de production localement

### `npm run pre-deploy`
⭐ **Nouveau** - Incrémente automatiquement la version du Service Worker

### `npm run deploy`
⭐ **Nouveau** - Déploiement automatisé complet (pre-deploy + build)

### `npm run clear-cache`
Nettoie le cache Vite et le dossier dist

---

## 📋 Checklist de Déploiement

Avant chaque déploiement, vérifiez :

- [ ] Les tests passent (`npm run test`)
- [ ] Pas d'erreurs de linting (`npm run lint`)
- [ ] La version du SW sera incrémentée (automatique avec `npm run deploy`)
- [ ] Les changements sont commités
- [ ] Le build local fonctionne (`npm run preview`)

---

## 🔄 Workflow de Déploiement

### Déploiement Standard

```bash
# 1. Développement
npm run dev

# 2. Tests
npm run test
npm run lint

# 3. Déploiement
npm run deploy

# 4. Commit et push
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# 5. Le CI/CD déploie automatiquement
```

### Déploiement d'Urgence (Hotfix)

```bash
# 1. Créer une branche hotfix
git checkout -b hotfix/nom-du-fix

# 2. Faire les corrections

# 3. Déploiement rapide
npm run deploy

# 4. Commit et merge
git add .
git commit -m "fix: correction urgente"
git push origin hotfix/nom-du-fix

# 5. Créer une PR et merger
```

---

## 🎯 Bonnes Pratiques

### Pendant le Développement

1. **Toujours tester en mode production** avant de déployer :
   ```bash
   npm run build
   npm run preview
   ```

2. **Vérifier les erreurs de console** dans le navigateur

3. **Tester sur plusieurs navigateurs** (Chrome, Firefox, Safari)

### Lors du Déploiement

1. **Déployer en dehors des heures de pointe** si possible

2. **Surveiller les logs** après le déploiement

3. **Vérifier que la notification de mise à jour** apparaît pour les utilisateurs connectés

4. **Tester immédiatement** la version en production

### Après le Déploiement

1. **Vérifier les métriques** (temps de chargement, erreurs)

2. **Surveiller les retours utilisateurs**

3. **Vérifier que le Service Worker** se met à jour correctement :
   ```javascript
   // Dans la console du navigateur
   navigator.serviceWorker.getRegistration().then(reg => {
     console.log('SW Version:', reg.active);
   });
   ```

---

## 🐛 Résolution de Problèmes

### Erreur : "Failed to fetch dynamically imported module"

**Solution :** Les corrections sont déjà en place. Redéployer avec `npm run deploy`.

### Le Service Worker ne se met pas à jour

**Solution :**
1. Vérifier que `CACHE_VERSION` a été incrémenté dans `public/sw.js`
2. Forcer l'update dans la console :
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => reg.update());
   ```

### Le cache n'est pas vidé

**Solution :**
```bash
# Nettoyer le cache local
npm run clear-cache

# Nettoyer le cache du navigateur
# Chrome DevTools > Application > Clear storage
```

### Build qui échoue

**Solution :**
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install

# Nettoyer et rebuild
npm run clear-cache
npm run build
```

---

## 📊 Monitoring en Production

### Vérifier la Version du SW

```javascript
// Dans la console du navigateur en production
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Active SW:', reg.active?.scriptURL);
  console.log('Waiting SW:', reg.waiting?.scriptURL);
});
```

### Vérifier le Cache

```javascript
// Lister tous les caches
caches.keys().then(keys => console.log('Caches:', keys));
```

### Forcer une Mise à Jour

```javascript
// Forcer la mise à jour du SW
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
  console.log('Update forcée');
});
```

---

## 🔗 Ressources

- [Documentation Vite](https://vitejs.dev/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

## ✅ Résumé

**Commande la plus simple pour déployer :**
```bash
npm run deploy
```

**Que fait cette commande ?**
- ✅ Incrémente automatiquement la version du Service Worker
- ✅ Lance le build de production
- ✅ Prêt à déployer sur votre plateforme

**Résultat pour les utilisateurs :**
- ✅ Détection automatique des nouvelles versions
- ✅ Rechargement automatique en cas d'erreur de chunk
- ✅ Notification conviviale pour mettre à jour
- ✅ Expérience utilisateur fluide

---

**Date de création :** 4 Décembre 2025  
**Dernière mise à jour :** 4 Décembre 2025  
**Version :** 1.0.0

