# 🚀 GUIDE DE CONFIGURATION - GOOGLE CALENDAR & MESSAGERIE

## 📋 **TABLE DES MATIÈRES**

1. [Configuration Google Cloud Console](#google-cloud-console)
2. [Variables d'environnement](#variables-denvironnement)
3. [Configuration de la base de données](#base-de-données)
4. [Démarrage du serveur](#démarrage-serveur)
5. [Test de l'intégration](#test-intégration)
6. [Dépannage](#dépannage)

---

## 🔧 **1. CONFIGURATION GOOGLE CLOUD CONSOLE**

### **Étape 1 : Créer un projet Google Cloud**
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez l'ID du projet

### **Étape 2 : Activer les APIs nécessaires**
1. Dans le menu, allez à **APIs & Services > Library**
2. Recherchez et activez les APIs suivantes :
   - **Google Calendar API**
   - **Google+ API** (pour l'authentification)

### **Étape 3 : Créer les identifiants OAuth2**
1. Allez à **APIs & Services > Credentials**
2. Cliquez sur **+ CREATE CREDENTIALS > OAuth 2.0 Client IDs**
3. Sélectionnez **Web application**
4. Configurez les URIs de redirection autorisés :
   ```
   http://localhost:3000/api/auth/google/callback
   https://votre-domaine.com/api/auth/google/callback
   ```
5. Notez le **Client ID** et **Client Secret**

### **Étape 4 : Configurer l'écran de consentement**
1. Allez à **APIs & Services > OAuth consent screen**
2. Configurez les informations de base :
   - **App name** : Profitum
   - **User support email** : votre email
   - **Developer contact information** : votre email
3. Ajoutez les scopes nécessaires :
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

---

## 🔐 **2. VARIABLES D'ENVIRONNEMENT**

### **Fichier `.env` (serveur)**
```bash
# ============================================================================
# CONFIGURATION GOOGLE CALENDAR
# ============================================================================

# Google OAuth2
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# ============================================================================
# CONFIGURATION SUPABASE
# ============================================================================

SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# ============================================================================
# CONFIGURATION SERVEUR
# ============================================================================

PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# ============================================================================
# CONFIGURATION SOCKET.IO (MESSAGERIE)
# ============================================================================

SOCKET_CORS_ORIGIN=http://localhost:5173
```

### **Fichier `.env` (client)**
```bash
# ============================================================================
# CONFIGURATION CLIENT
# ============================================================================

VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
VITE_SOCKET_URL=http://localhost:3000
```

---

## 🗄️ **3. CONFIGURATION DE LA BASE DE DONNÉES**

### **Étape 1 : Vérifier les tables existantes**
Les migrations SQL ont déjà été créées. Vérifiez que les tables suivantes existent :

```sql
-- Tables Google Calendar
GoogleCalendarIntegration
GoogleCalendarEvent
GoogleCalendarSyncLog

-- Tables Messagerie
Conversation
Message
ConversationParticipant
UserPresence
```

### **Étape 2 : Vérifier les politiques RLS**
```sql
-- Politiques pour GoogleCalendarIntegration
CREATE POLICY "Users can view own integrations" ON "GoogleCalendarIntegration"
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" ON "GoogleCalendarIntegration"
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour Conversation
CREATE POLICY "Users can view conversations they participate in" ON "Conversation"
FOR SELECT USING (
  auth.uid() = participant1_id OR auth.uid() = participant2_id
);

-- Politiques pour Message
CREATE POLICY "Users can view messages in their conversations" ON "Message"
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM "Conversation" 
    WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
  )
);
```

---

## 🚀 **4. DÉMARRAGE DU SERVEUR**

### **Étape 1 : Installer les dépendances**
```bash
# Dans le dossier server/
npm install

# Dépendances spécifiques
npm install socket.io @types/socket.io
npm install googleapis @types/googleapis
npm install express-rate-limit
```

### **Étape 2 : Démarrer le serveur**
```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

### **Étape 3 : Vérifier les logs**
Le serveur doit afficher :
```
✅ Serveur démarré sur le port 3000
✅ Socket.IO initialisé
✅ Google Calendar service initialisé
✅ Messaging service initialisé
```

---

## 🧪 **5. TEST DE L'INTÉGRATION**

### **Test Google Calendar**
1. Allez sur `http://localhost:5173/google-calendar-integration`
2. Cliquez sur **Se connecter à Google Calendar**
3. Autorisez l'accès à votre compte Google
4. Testez la synchronisation d'événements

### **Test Messagerie**
1. Allez sur `http://localhost:5173/messagerie`
2. Vérifiez que la liste des conversations se charge
3. Testez l'envoi de messages
4. Vérifiez les indicateurs de frappe

### **Test Socket.IO**
1. Ouvrez la console du navigateur
2. Vérifiez les logs de connexion Socket.IO
3. Testez la présence en temps réel

---

## 🔧 **6. DÉPANNAGE**

### **Erreur OAuth2**
```
❌ Erreur : redirect_uri_mismatch
```
**Solution :** Vérifiez que l'URI de redirection dans Google Cloud Console correspond exactement à celui dans vos variables d'environnement.

### **Erreur Socket.IO**
```
❌ Erreur : CORS policy
```
**Solution :** Vérifiez que `SOCKET_CORS_ORIGIN` est correctement configuré.

### **Erreur Base de données**
```
❌ Erreur : RLS policy violation
```
**Solution :** Vérifiez que les politiques RLS sont correctement appliquées et que l'utilisateur est authentifié.

### **Erreur Synchronisation**
```
❌ Erreur : Google Calendar API quota exceeded
```
**Solution :** Vérifiez les quotas dans Google Cloud Console et ajustez la fréquence de synchronisation.

---

## 📊 **7. MONITORING ET LOGS**

### **Logs à surveiller**
```bash
# Logs de synchronisation Google Calendar
tail -f logs/google-calendar-sync.log

# Logs Socket.IO
tail -f logs/socket.log

# Logs d'erreurs
tail -f logs/error.log
```

### **Métriques importantes**
- Nombre de synchronisations par jour
- Taux de succès des synchronisations
- Nombre de messages envoyés
- Temps de réponse Socket.IO

---

## 🎯 **8. PROCHAINES ÉTAPES**

### **Optimisations possibles**
1. **Cache Redis** pour les tokens Google
2. **Queue de synchronisation** avec Bull/BullMQ
3. **Notifications push** pour les messages
4. **Chiffrement** des messages sensibles
5. **Backup automatique** des conversations

### **Fonctionnalités avancées**
1. **Groupes de conversation** pour les dossiers
2. **Pièces jointes** dans les messages
3. **Recherche** dans les conversations
4. **Export** des conversations
5. **Intégration** avec d'autres calendriers

---

## 📞 **SUPPORT**

En cas de problème :
1. Vérifiez les logs du serveur
2. Consultez la documentation Google Calendar API
3. Vérifiez la configuration Supabase
4. Contactez l'équipe de développement

**Email :** support@profitum.com  
**Documentation :** https://docs.profitum.com 