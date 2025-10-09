# 🧪 PRÊT POUR TESTS - Système Email RDV

## ✅ Configuration actuelle

### Service Email
- **Solution** : Nodemailer + SMTP
- **Status** : ✅ Opérationnel
- **Migration AWS/SendGrid** : ❌ Non prévu pour le moment

### Variables d'environnement requises
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=mot-de-passe-app-gmail
CLIENT_URL=https://www.profitum.app
```

---

## 🚀 Comment tester

### Option 1 : Script standalone (RECOMMANDÉ)
```bash
cd /Users/alex/Desktop/FinancialTracker
node server/scripts/test-email-rdv.js grandjean.alexandre5@gmail.com
```

**Ce script teste** :
- ✅ Email simple (connexion SMTP)
- ✅ Template confirmation RDV client
- ✅ Template notification expert
- ✅ Template date alternative

**Sortie attendue** :
```
🚀 TEST SERVICE EMAIL RDV
═══════════════════════════════════════════════════════════
📧 Email de test: grandjean.alexandre5@gmail.com
🌐 SMTP: smtp.gmail.com:587
👤 User: votre-email@gmail.com
═══════════════════════════════════════════════════════════

📧 TEST 1: Email Simple
────────────────────────────────────────────────────────────
✅ Email simple envoyé avec succès

📧 TEST 2: Email Confirmation RDV (Template)
────────────────────────────────────────────────────────────
✅ Email confirmation RDV envoyé avec succès

📧 TEST 3: Email Notification Expert (Template)
────────────────────────────────────────────────────────────
✅ Email notification expert envoyé avec succès

📧 TEST 4: Email Date Alternative (Template)
────────────────────────────────────────────────────────────
✅ Email date alternative envoyé avec succès

📊 RÉSULTATS
═══════════════════════════════════════════════════════════
Test Email Simple: ✅ SUCCÈS
Test Confirmation RDV: ✅ SUCCÈS
Test Notification Expert: ✅ SUCCÈS
Test Date Alternative: ✅ SUCCÈS
═══════════════════════════════════════════════════════════

🎯 Score: 4/4
✅ Tous les tests ont réussi !
```

---

### Option 2 : Via API (serveur démarré)

**Démarrer le serveur** :
```bash
cd server
npm run dev
```

**Test email simple** :
```bash
curl -X POST http://localhost:5001/api/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"to":"grandjean.alexandre5@gmail.com"}'
```

**Test template confirmation** :
```bash
curl -X POST http://localhost:5001/api/test-email/rdv-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"to":"grandjean.alexandre5@gmail.com"}'
```

---

### Option 3 : Workflow complet (intégration)

1. **Démarrer l'application**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

2. **Se connecter en tant qu'apporteur**

3. **Créer un prospect avec simulation**
   - Remplir formulaire `ProspectForm`
   - Activer "Faire une simulation"
   - Compléter le simulateur
   - Planifier des RDV avec experts

4. **Vérifier les emails**
   - Expert reçoit notification (`rdv-notification-expert.html`)
   - Client reçoit confirmation (`rdv-confirmation-client.html`)

5. **Tester date alternative**
   - Expert se connecte
   - Propose une date alternative
   - Client reçoit email (`rdv-alternative-proposee.html`)

---

## 📧 Que vérifier dans les emails

### Design
- ✅ Rendu HTML correct (pas de code visible)
- ✅ Images et icônes affichées
- ✅ Couleurs et mise en page professionnelle
- ✅ Responsive (mobile + desktop)

### Contenu
- ✅ Toutes les données affichées correctement
- ✅ Dates et heures au format français
- ✅ Économies formatées en euros
- ✅ Informations de contact présentes

### Fonctionnalité
- ✅ Liens cliquables (plateforme, actions)
- ✅ Pas dans spam/indésirables
- ✅ Boutons d'action visibles et fonctionnels
- ✅ Footer avec informations légales

---

## 🐛 Résolution problèmes courants

### Email non reçu
1. **Vérifier les logs console** : Y a-t-il une erreur ?
2. **Vérifier dossier spam** : L'email peut être marqué comme spam
3. **Vérifier SMTP credentials** : `.env` correctement configuré ?
4. **Tester avec Gmail** : Si autre fournisseur, essayer Gmail

### Erreur SMTP
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution** :
- Activer authentification 2 facteurs Gmail
- Générer un "mot de passe d'application"
- Utiliser ce mot de passe dans `SMTP_PASS`

### Template non chargé
```
Error: ENOENT: no such file or directory
```
**Solution** :
- Vérifier que `server/templates/emails/*.html` existent
- Lancer le script depuis la racine du projet

### Handlebars error
```
Error: Missing helper: "eq"
```
**Solution** : Helper déjà enregistré dans le service, mais si erreur :
```javascript
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});
```

---

## 📊 Monitoring production (futur)

### Métriques à surveiller
- Taux de succès envoi
- Temps de réponse SMTP
- Taux d'ouverture (avec tracking)
- Taux de clics sur boutons
- Emails rejetés (bounce)

### Outils recommandés (si migration future)
- **SendGrid** : Dashboard analytics complet
- **AWS SES** : Intégration CloudWatch
- **Mailgun** : API simple et fiable
- **Postmark** : Spécialisé emails transactionnels

**⚠️ Pour le moment : on reste sur nodemailer + SMTP**

---

## ✅ Checklist avant test

- [ ] Variables `.env` configurées
  - [ ] `SMTP_HOST`
  - [ ] `SMTP_PORT`
  - [ ] `SMTP_USER`
  - [ ] `SMTP_PASS`
  - [ ] `CLIENT_URL`

- [ ] Dépendances installées
  - [ ] `nodemailer`
  - [ ] `handlebars`
  - [ ] `@types/handlebars`

- [ ] Fichiers présents
  - [ ] `server/src/services/RDVEmailService.ts`
  - [ ] `server/templates/emails/rdv-confirmation-client.html`
  - [ ] `server/templates/emails/rdv-notification-expert.html`
  - [ ] `server/templates/emails/rdv-alternative-proposee.html`
  - [ ] `server/scripts/test-email-rdv.js`

- [ ] Permissions
  - [ ] Script exécutable : `chmod +x server/scripts/test-email-rdv.js`

---

## 🎯 Commande de test

```bash
# Commande unique pour tester
cd /Users/alex/Desktop/FinancialTracker && \
node server/scripts/test-email-rdv.js grandjean.alexandre5@gmail.com
```

**⏱️ Durée** : 10-15 secondes  
**📧 Emails envoyés** : 4  
**📊 Rapport** : Console coloré avec résultats

---

## 🚀 Prochaines étapes après tests

### Si tests OK ✅
1. Déployer sur environnement de staging
2. Tester workflow complet avec vrais utilisateurs
3. Monitorer les premiers envois en production
4. Collecter feedback utilisateurs

### Si tests KO ❌
1. Analyser les logs d'erreur
2. Vérifier la configuration SMTP
3. Tester avec un autre email
4. Consulter la documentation :
   - `docs/guides/GUIDE-EMAILS-RDV.md`
   - `docs/sessions/2025-10-09/FINALISATION-SESSION.md`

---

## 📚 Documentation associée

- **Guide complet** : `docs/guides/GUIDE-EMAILS-RDV.md`
- **Finalisation session** : `docs/sessions/2025-10-09/FINALISATION-SESSION.md`
- **Architecture RDV** : `docs/architecture/ARCHITECTURE-RDV-UNIQUE.md`

---

**Status** : ✅ PRÊT POUR TESTS  
**Configuration** : Nodemailer + SMTP (pas de migration AWS/SendGrid)  
**Email de test** : grandjean.alexandre5@gmail.com

🎉 **Tout est prêt pour les tests !**

