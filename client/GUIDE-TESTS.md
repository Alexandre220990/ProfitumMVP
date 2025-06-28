# Guide d'Utilisation des Tests

## 🚀 Lancement des Tests

### Test Rapide (Recommandé)
```bash
# Dans la console du navigateur, copier-coller :
# Le contenu de quick-test.js
```

### Test Complet
```bash
# Dans la console du navigateur, copier-coller :
# Le contenu de run-all-tests.js
```

### Test Automatique Séquentiel
```bash
# Dans la console du navigateur, copier-coller :
# Le contenu de launch-tests.js
```

## 📋 Tests Disponibles

### 1. Test Rapide (`quick-test.js`)
- ✅ Vérification du token
- ✅ Décodage du token Supabase
- ✅ Redirection automatique
- ⏱️ Durée : ~2 secondes

### 2. Test Complet (`run-all-tests.js`)
- ✅ Vérification des tokens
- ✅ Décodage du token Supabase
- ✅ Vérification dans la base de données
- ✅ Test avec l'ancien ID
- ✅ Test de l'API de signature de charte
- ⏱️ Durée : ~10 secondes

### 3. Test Automatique (`launch-tests.js`)
- ✅ Tous les tests du test complet
- ✅ Exécution séquentielle avec délais
- ✅ Redirection automatique si utilisateur trouvé
- ⏱️ Durée : ~15 secondes

## 🎯 Résultats Attendus

### Succès
```
✅ Token présent
🆔 ID Supabase: e991b465-2e37-45ae-9475-6d7b1e35e391
📧 Email: grandjean.alexandre5@gmail.com
👤 Type: client
📍 Redirection vers: /dashboard/client/e991b465-2e37-45ae-9475-6d7b1e35e391
```

### Échec - Aucun Token
```
❌ Aucun token - reconnectez-vous
```

### Échec - Utilisateur Non Trouvé
```
❌ Utilisateur non trouvé avec l'ID Supabase
🔄 Essai avec l'ancien ID...
✅ Utilisateur trouvé avec l'ancien ID
📍 Redirection vers: /dashboard/client/0538de29-4287-4c28-b76a-b65ef993f393
```

## 🔧 Actions Correctives

### Si aucun token trouvé
1. Aller sur `/connexion-client`
2. Se reconnecter avec Supabase
3. Relancer le test

### Si utilisateur non trouvé avec l'ID Supabase
1. Le test utilisera automatiquement l'ancien ID
2. Si cela fonctionne, l'utilisateur sera redirigé
3. Si cela échoue, vérifier la base de données

### Si l'API de signature échoue
1. Vérifier que le serveur est démarré
2. Vérifier que le token Supabase est valide
3. Vérifier les permissions dans Supabase

## 📝 Notes
- Tous les tests sont non-destructifs
- Les tests peuvent être relancés à tout moment
- Les redirections sont automatiques si l'utilisateur est trouvé
- Les erreurs sont affichées dans la console pour diagnostic 