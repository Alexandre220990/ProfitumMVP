# 🌐 Guide d'Hébergement Temporaire - FinancialTracker

## 🚀 **Solution Recommandée : Hébergement Local WiFi**

### **Avantages**
- ✅ **Sécurisé** : Accès uniquement sur votre réseau local
- ✅ **Rapide** : Pas de latence internet
- ✅ **Gratuit** : Aucun coût d'hébergement
- ✅ **Simple** : Configuration automatique

---

## 📋 **Instructions de Démarrage**

### **Étape 1 : Préparation**
```bash
# Dans le terminal, à la racine du projet
cd /Users/alex/Desktop/FinancialTracker

# Rendre le script exécutable (si pas déjà fait)
chmod +x start-network.sh
```

### **Étape 2 : Démarrer l'Application**
```bash
# Lancer le script de démarrage réseau
./start-network.sh
```

### **Étape 3 : Obtenir l'Adresse IP**
Le script affichera automatiquement :
```
📡 Adresse IP locale détectée: 192.168.1.XX
🌐 L'application sera accessible sur:
   Frontend: http://192.168.1.XX:3000
   Backend:  http://192.168.1.XX:5001
```

---

## 📱 **Instructions pour l'Utilisateur**

### **1. Connexion WiFi**
- Se connecter à votre réseau WiFi
- Noter l'adresse IP affichée (ex: `192.168.1.XX`)

### **2. Accès à l'Application**
- Ouvrir un navigateur (Chrome, Safari, Firefox)
- Aller sur : `http://192.168.1.XX:3000`
- L'application se chargera automatiquement

### **3. Connexion**
- **Email** : `grandjean.alexandre5@gmail.com`
- **Mot de passe** : `test123`
- Cliquer sur "Se connecter"

### **4. Navigation**
- **Dashboard Admin** : Accès complet aux fonctionnalités
- **Pilotage des Tests** : `/admin/tests`
- **Monitoring** : `/admin/monitoring`
- **Gestion des Clients** : `/admin/gestion-clients`

---

## 🔧 **Configuration Technique**

### **Frontend (Vite)**
- **Port** : 3000
- **Host** : 0.0.0.0 (accessible depuis le réseau)
- **CORS** : Configuré pour le réseau local

### **Backend (Express)**
- **Port** : 5001
- **Host** : 0.0.0.0 (accessible depuis le réseau)
- **CORS** : Autorise les requêtes du frontend

### **Base de Données**
- **Supabase** : Hébergée en cloud (pas de configuration locale nécessaire)
- **Authentification** : Fonctionnelle

---

## 🛡️ **Sécurité**

### **Mesures Implémentées**
- ✅ **Authentification Supabase** : Sécurisée
- ✅ **CORS Configuré** : Limité au réseau local
- ✅ **Rate Limiting** : 100 requêtes/15min par IP
- ✅ **Validation des Entrées** : Protection contre les injections
- ✅ **Logs d'Accès** : Traçabilité complète

### **Recommandations**
- 🔒 **WiFi Sécurisé** : Utiliser un mot de passe fort
- 🔒 **Session Limitée** : Tester pendant une durée limitée
- 🔒 **Surveillance** : Vérifier les logs d'accès

---

## 🚨 **Dépannage**

### **Problème : L'utilisateur ne peut pas accéder**
**Solution** :
1. Vérifier que l'utilisateur est sur le même WiFi
2. Vérifier l'adresse IP affichée
3. Tester avec `ping 192.168.1.XX`

### **Problème : Erreur de connexion**
**Solution** :
1. Vérifier que les deux serveurs sont démarrés
2. Vérifier les logs dans le terminal
3. Redémarrer avec `./start-network.sh`

### **Problème : Page blanche**
**Solution** :
1. Vider le cache du navigateur
2. Essayer un autre navigateur
3. Vérifier la console du navigateur (F12)

---

## 📊 **Fonctionnalités Disponibles**

### **Dashboard Admin**
- ✅ **Vue d'ensemble** : Statistiques et KPIs
- ✅ **Gestion des clients** : CRUD complet
- ✅ **Gestion des experts** : CRUD complet
- ✅ **Monitoring système** : CPU, mémoire, logs
- ✅ **Pilotage des tests** : Tests automatisés

### **Tests Disponibles**
- 🔒 **Sécurité** : Audit ISO 27001, vulnérabilités
- ⚡ **Performance** : Charge, métriques système
- 🗄️ **Base de données** : Intégrité, sauvegardes
- 🌐 **API** : Endpoints, authentification
- 💻 **Système** : Ressources, processus

---

## 🎯 **Scénarios de Test**

### **Test Complet (Recommandé)**
1. **Connexion** : Vérifier l'authentification
2. **Dashboard** : Explorer les fonctionnalités
3. **Tests** : Lancer quelques tests de catégories
4. **Monitoring** : Vérifier les métriques système
5. **Gestion** : Tester l'ajout/modification de données

### **Test Rapide**
1. **Connexion** : Se connecter
2. **Tests** : Lancer "Tous les tests"
3. **Résultats** : Vérifier les logs et résultats

---

## 🛑 **Arrêt de l'Application**

### **Arrêt Propre**
```bash
# Dans le terminal où l'application tourne
Ctrl + C
```

### **Arrêt Forcé (si nécessaire)**
```bash
# Arrêter tous les processus Node.js
pkill -f "node"
```

---

## 📞 **Support**

### **En Cas de Problème**
1. **Vérifier les logs** dans le terminal
2. **Redémarrer** l'application
3. **Vérifier la connexion WiFi**
4. **Tester avec un autre appareil**

### **Informations Utiles**
- **Adresse IP** : Affichée au démarrage
- **Ports** : 3000 (frontend), 5001 (backend)
- **Logs** : Visibles dans le terminal
- **Base de données** : Supabase (cloud)

---

**🎉 L'application est maintenant prête pour les tests !** 