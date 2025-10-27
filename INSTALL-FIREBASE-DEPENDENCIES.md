# 📦 Installation des dépendances Firebase

## Commandes à exécuter

### **1. Frontend (Client)**
```bash
cd /Users/alex/Desktop/FinancialTracker/client
npm install firebase
```

### **2. Backend (Server)**
```bash
cd /Users/alex/Desktop/FinancialTracker/server
npm install firebase-admin
```

---

## Variables d'environnement à configurer

### **Frontend (.env)**
Ajouter dans `/client/.env` :

```env
# Firebase Configuration (à obtenir depuis Firebase Console)
VITE_FIREBASE_API_KEY=votre-api-key
VITE_FIREBASE_AUTH_DOMAIN=profitum-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=profitum-app
VITE_FIREBASE_STORAGE_BUCKET=profitum-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_VAPID_KEY=votre-vapid-key-publique
```

### **Backend (.env)**
Ajouter dans `/server/.env` :

```env
# Firebase Admin SDK (Service Account)
FIREBASE_PROJECT_ID=profitum-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@profitum-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVotre clé privée ici\n-----END PRIVATE KEY-----\n"

# OU en JSON complet
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"profitum-app",...}
```

---

## Comment obtenir les clés Firebase ?

### **Étape 1 : Créer un projet Firebase**
1. Aller sur https://console.firebase.google.com/
2. Cliquer "Ajouter un projet"
3. Nom du projet : **Profitum**
4. Activer Google Analytics (optionnel)

### **Étape 2 : Obtenir les clés Frontend (Web App)**
1. Dans Firebase Console → Paramètres du projet (⚙️)
2. Descendre à "Vos applications"
3. Cliquer sur l'icône Web (</>) "Ajouter une application"
4. Nom de l'app : **Profitum Web**
5. Cocher "Configurer aussi Firebase Hosting" (optionnel)
6. Copier la configuration affichée → Variables VITE_FIREBASE_*

### **Étape 3 : Obtenir la clé VAPID**
1. Firebase Console → Cloud Messaging
2. Onglet "Web Push certificates"
3. Cliquer "Générer une nouvelle paire de clés"
4. Copier la clé publique → VITE_FIREBASE_VAPID_KEY

### **Étape 4 : Obtenir les clés Backend (Service Account)**
1. Firebase Console → Paramètres du projet (⚙️)
2. Onglet "Comptes de service"
3. Cliquer "Générer une nouvelle clé privée"
4. Télécharger le fichier JSON
5. Option A : Copier tout le JSON → FIREBASE_SERVICE_ACCOUNT_JSON
6. Option B : Extraire project_id, client_email, private_key → Variables séparées

### **Étape 5 : Activer Cloud Messaging**
1. Firebase Console → Build → Cloud Messaging
2. Cliquer "Activer"
3. Accepter les conditions

---

## Vérification de l'installation

### **Frontend**
```bash
cd client
npm list firebase
# Doit afficher : firebase@X.X.X
```

### **Backend**
```bash
cd server
npm list firebase-admin
# Doit afficher : firebase-admin@X.X.X
```

---

## Mise à jour des fichiers de configuration

### **client/public/firebase-messaging-sw.js**
Remplacer les valeurs de démonstration par les vraies clés Firebase

### **client/public/firebase-config.js**
Remplacer les valeurs de démonstration par les vraies clés Firebase

### **client/src/config/firebase.ts**
Les variables d'environnement seront automatiquement chargées

---

## Test rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur
npm run dev

# 3. Ouvrir l'app et tester
# - Autoriser les notifications
# - Vérifier dans la console : "✅ FCM Token obtenu"
# - Vérifier dans la BDD : Table UserDevices doit contenir le token
```

---

## Dépannage

### **Erreur : "messaging/unsupported-browser"**
→ Firebase Messaging n'est pas supporté sur Safari < 16
→ Utiliser Chrome, Firefox ou Edge

### **Erreur : "messaging/permission-blocked"**
→ L'utilisateur a bloqué les notifications
→ Réinitialiser dans Paramètres navigateur → Site → Notifications

### **Erreur : "messaging/invalid-vapid-key"**
→ Vérifier que VITE_FIREBASE_VAPID_KEY est correct
→ Régénérer une clé si nécessaire

---

**Dernière mise à jour** : 27 octobre 2025

