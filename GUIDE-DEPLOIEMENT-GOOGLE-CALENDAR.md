# 🚀 GUIDE DE DÉPLOIEMENT - GOOGLE CALENDAR PROFITUMV2

## 📋 **TABLE DES MATIÈRES**

1. [Configuration Google Cloud Console](#google-cloud-console)
2. [Configuration des variables d'environnement](#variables-denvironnement)
3. [Déploiement sur Railway (Backend)](#deploiement-railway)
4. [Déploiement sur Vercel (Frontend)](#deploiement-vercel)
5. [Tests d'intégration](#tests-integration)
6. [Monitoring et maintenance](#monitoring-maintenance)

---

## ☁️ **1. CONFIGURATION GOOGLE CLOUD CONSOLE**

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
   https://votre-domaine-railway.com/api/auth/google/callback
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

## 🔐 **2. CONFIGURATION DES VARIABLES D'ENVIRONNEMENT**

### **Variables Railway (Backend)**
```bash
# Google OAuth2
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=https://votre-domaine-railway.com/api/auth/google/callback

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Sécurité
JWT_SECRET=votre_jwt_secret_tres_securise_2024_profitum_production
SESSION_SECRET=votre_session_secret_tres_securise_2024_profitum_production

# Configuration serveur
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://votre-domaine-vercel.com
CLIENT_URL=https://votre-domaine-vercel.com

# Configuration Google Calendar avancée
GOOGLE_CALENDAR_SYNC_INTERVAL=300000
GOOGLE_CALENDAR_MAX_EVENTS_PER_SYNC=1000
GOOGLE_CALENDAR_SYNC_WINDOW_DAYS=90
GOOGLE_CALENDAR_NOTIFICATION_EMAIL=true
GOOGLE_CALENDAR_NOTIFICATION_PUSH=true
GOOGLE_CALENDAR_DEFAULT_REMINDER_MINUTES=15
GOOGLE_CALENDAR_AUTO_CREATE_MEETINGS=true
GOOGLE_CALENDAR_MEETING_DURATION_DEFAULT=60
GOOGLE_CALENDAR_TIMEZONE_DEFAULT=Europe/Paris

# Logs et monitoring
LOG_LEVEL=info
ENABLE_GOOGLE_CALENDAR_LOGS=true
ENABLE_SYNC_LOGS=true
ENABLE_ERROR_LOGS=true
```

### **Variables Vercel (Frontend)**
```bash
# API et Supabase
VITE_API_URL=https://votre-domaine-railway.com
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
VITE_SOCKET_URL=https://votre-domaine-railway.com

# Google Calendar
VITE_GOOGLE_CLIENT_ID=votre_client_id_google
VITE_GOOGLE_REDIRECT_URI=https://votre-domaine-railway.com/api/auth/google/callback
```

---

## 🚂 **3. DÉPLOIEMENT SUR RAILWAY (BACKEND)**

### **Étape 1 : Préparer le projet**
```bash
# Dans le dossier server/
npm install
npm run build
```

### **Étape 2 : Déployer sur Railway**
1. Allez sur [Railway](https://railway.app/)
2. Créez un nouveau projet
3. Connectez votre repository GitHub
4. Sélectionnez le dossier `server/`
5. Configurez les variables d'environnement (voir section ci-dessus)
6. Déployez le projet

### **Étape 3 : Vérifier le déploiement**
```bash
# Vérifier que le serveur répond
curl https://votre-domaine-railway.com/health

# Vérifier les logs
railway logs
```

### **Étape 4 : Configurer le domaine personnalisé (optionnel)**
1. Dans Railway, allez dans **Settings > Domains**
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions

---

## ⚡ **4. DÉPLOIEMENT SUR VERCEL (FRONTEND)**

### **Étape 1 : Préparer le projet**
```bash
# Dans le dossier client/
npm install
npm run build
```

### **Étape 2 : Déployer sur Vercel**
1. Allez sur [Vercel](https://vercel.com/)
2. Créez un nouveau projet
3. Connectez votre repository GitHub
4. Sélectionnez le dossier `client/`
5. Configurez les variables d'environnement (voir section ci-dessus)
6. Déployez le projet

### **Étape 3 : Vérifier le déploiement**
```bash
# Vérifier que le site fonctionne
curl https://votre-domaine-vercel.com

# Vérifier les logs
vercel logs
```

### **Étape 4 : Configurer le domaine personnalisé (optionnel)**
1. Dans Vercel, allez dans **Settings > Domains**
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions

---

## 🧪 **5. TESTS D'INTÉGRATION**

### **Test 1 : Connexion Google Calendar**
1. Allez sur `https://votre-domaine-vercel.com/google-calendar-integration`
2. Cliquez sur **Se connecter à Google Calendar**
3. Autorisez l'accès à votre compte Google
4. Vérifiez que la connexion est établie

### **Test 2 : Création d'événement collaboratif**
1. Allez sur `https://votre-domaine-vercel.com/agenda-client`
2. Créez un nouvel événement collaboratif
3. Invitez des participants
4. Vérifiez que l'événement est créé

### **Test 3 : Synchronisation bidirectionnelle**
1. Créez un événement dans Google Calendar
2. Vérifiez qu'il apparaît dans Profitum
3. Créez un événement dans Profitum
4. Vérifiez qu'il apparaît dans Google Calendar

### **Test 4 : Notifications**
1. Créez un événement avec des rappels
2. Vérifiez que les notifications sont envoyées
3. Testez les réponses aux invitations

### **Test 5 : Gestion des conflits**
1. Modifiez un événement dans Google Calendar
2. Modifiez le même événement dans Profitum
3. Vérifiez que les conflits sont résolus correctement

---

## 📊 **6. MONITORING ET MAINTENANCE**

### **Monitoring Railway**
```bash
# Vérifier les logs en temps réel
railway logs --follow

# Vérifier les métriques
railway status

# Redémarrer le service si nécessaire
railway restart
```

### **Monitoring Vercel**
```bash
# Vérifier les logs
vercel logs

# Vérifier les métriques
vercel analytics

# Redéployer si nécessaire
vercel --prod
```

### **Monitoring Google Calendar API**
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services > Dashboard**
3. Vérifiez les quotas et l'utilisation
4. Surveillez les erreurs d'API

### **Logs à surveiller**
```bash
# Logs de synchronisation
tail -f logs/google-calendar-sync.log

# Logs d'erreurs
tail -f logs/error.log

# Logs d'authentification
tail -f logs/auth.log
```

### **Métriques importantes**
- Nombre de synchronisations par jour
- Taux de succès des synchronisations
- Temps de réponse des APIs
- Nombre d'événements créés/modifiés
- Utilisation des quotas Google

### **Maintenance préventive**
1. **Quotidien** : Vérifier les logs d'erreurs
2. **Hebdomadaire** : Vérifier les quotas Google
3. **Mensuel** : Mettre à jour les dépendances
4. **Trimestriel** : Réviser les tokens OAuth2

---

## 🔧 **7. DÉPANNAGE**

### **Erreur OAuth2**
```
❌ Erreur : redirect_uri_mismatch
```
**Solution :** Vérifiez que l'URI de redirection dans Google Cloud Console correspond exactement à celui dans vos variables d'environnement.

### **Erreur de synchronisation**
```
❌ Erreur : Google Calendar API quota exceeded
```
**Solution :** Vérifiez les quotas dans Google Cloud Console et ajustez la fréquence de synchronisation.

### **Erreur de base de données**
```
❌ Erreur : RLS policy violation
```
**Solution :** Vérifiez que les politiques RLS sont correctement appliquées et que l'utilisateur est authentifié.

### **Erreur de déploiement**
```
❌ Erreur : Build failed
```
**Solution :** Vérifiez les logs de build et corrigez les erreurs de compilation.

---

## 📈 **8. OPTIMISATIONS**

### **Performance**
1. **Cache Redis** : Implémentez un cache pour les tokens et événements
2. **Queue de synchronisation** : Utilisez Bull/BullMQ pour les synchronisations
3. **Pagination** : Limitez le nombre d'événements récupérés
4. **Compression** : Activez la compression gzip

### **Sécurité**
1. **Rate limiting** : Limitez le nombre de requêtes par utilisateur
2. **Validation** : Validez toutes les données d'entrée
3. **Chiffrement** : Chiffrez les tokens sensibles
4. **Audit** : Loggez toutes les actions importantes

### **Scalabilité**
1. **Load balancing** : Utilisez plusieurs instances
2. **CDN** : Utilisez un CDN pour les assets statiques
3. **Database pooling** : Optimisez les connexions à la base de données
4. **Microservices** : Séparez les services si nécessaire

---

## 🎯 **9. PROCHAINES ÉTAPES**

### **Fonctionnalités avancées**
1. **Groupes de calendriers** : Permettre de partager des calendriers
2. **Templates d'événements** : Créer des modèles d'événements
3. **Intégration Outlook** : Ajouter le support d'Outlook Calendar
4. **Notifications push** : Implémenter les notifications push
5. **Analytics** : Ajouter des analytics détaillés

### **Améliorations UX**
1. **Drag & drop** : Permettre de déplacer les événements
2. **Vues multiples** : Ajouter des vues agenda, semaine, mois
3. **Recherche avancée** : Implémenter une recherche globale
4. **Filtres** : Ajouter des filtres par type, participant, etc.

---

## 📞 **SUPPORT**

En cas de problème :
1. Vérifiez les logs du serveur et du client
2. Consultez la documentation Google Calendar API
3. Vérifiez la configuration Supabase
4. Contactez l'équipe de développement

**Email :** support@profitum.com  
**Documentation :** https://docs.profitum.com  
**GitHub :** https://github.com/profitum/profitumv2

---

## ✅ **CHECKLIST DE DÉPLOIEMENT**

- [ ] Configuration Google Cloud Console terminée
- [ ] Variables d'environnement configurées
- [ ] Déploiement Railway réussi
- [ ] Déploiement Vercel réussi
- [ ] Tests d'intégration passés
- [ ] Monitoring configuré
- [ ] Documentation mise à jour
- [ ] Équipe formée

**🎉 Félicitations ! Votre intégration Google Calendar est maintenant opérationnelle !** 