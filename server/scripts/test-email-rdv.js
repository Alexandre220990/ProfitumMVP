#!/usr/bin/env node
/**
 * Script de test pour l'envoi d'emails RDV
 * Usage: node server/scripts/test-email-rdv.js grandjean.alexandre5@gmail.com
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Transporteur email
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEmailSimple(email) {
  try {
    log('\n📧 TEST 1: Email Simple', 'cyan');
    log('─'.repeat(60), 'blue');

    const mailOptions = {
      from: `"Profitum - Test RDV" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '✅ Test Email RDV - Profitum',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #667eea;">🎉 Email Test Réussi !</h1>
          <p>Ce message confirme que le service email RDV fonctionne correctement.</p>
          <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Service :</strong> RDVEmailService</p>
          <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>Configuration :</strong></p>
            <ul>
              <li>SMTP Host : ${process.env.SMTP_HOST || 'Non configuré'}</li>
              <li>SMTP Port : ${process.env.SMTP_PORT || 'Non configuré'}</li>
              <li>SMTP User : ${process.env.SMTP_USER || 'Non configuré'}</li>
            </ul>
          </div>
          <p style="margin-top: 20px; color: #48bb78;">✅ Service email opérationnel !</p>
        </div>
      `,
      text: 'Email test RDV - Service opérationnel !'
    };

    await emailTransporter.sendMail(mailOptions);
    log(`✅ Email simple envoyé avec succès à ${email}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

async function testEmailConfirmationRDV(email) {
  try {
    log('\n📧 TEST 2: Email Confirmation RDV (Template)', 'cyan');
    log('─'.repeat(60), 'blue');

    // Charger le template
    const templatePath = path.join(__dirname, '../templates/emails/rdv-confirmation-client.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Enregistrer helpers Handlebars
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    const template = Handlebars.compile(templateContent);

    // Données de test
    const testData = {
      rdv_id: 'test-rdv-123',
      client_email: email,
      client_name: 'Alexandre Grandjean',
      company_name: 'Test Entreprise SARL',
      meetings: [
        {
          expert_name: 'Jean Dupont',
          scheduled_date: '15 octobre 2025',
          scheduled_time: '10:00',
          duration_minutes: 60,
          meeting_type: 'video',
          location: 'Lien visio',
          products: [
            { name: 'TICPE', estimated_savings: 15000 },
            { name: 'URSSAF', estimated_savings: 8000 }
          ]
        },
        {
          expert_name: 'Marie Martin',
          scheduled_date: '16 octobre 2025',
          scheduled_time: '14:30',
          duration_minutes: 45,
          meeting_type: 'phone',
          location: 'Appel téléphonique',
          products: [
            { name: 'Crédit Impôt Recherche', estimated_savings: 12000 }
          ]
        }
      ],
      total_savings: 35000,
      products_count: 3,
      temp_password: 'Test123!',
      apporteur_name: 'Sophie Durand',
      apporteur_email: 'sophie@profitum.fr',
      apporteur_phone: '06 12 34 56 78',
      platform_url: 'https://www.profitum.app'
    };

    const html = template(testData);

    const mailOptions = {
      from: `"Profitum - RDV Confirmé" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🎉 Vos rendez-vous sont confirmés - ${testData.company_name}`,
      html: html
    };

    await emailTransporter.sendMail(mailOptions);
    log(`✅ Email confirmation RDV envoyé avec succès à ${email}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function testEmailNotificationExpert(email) {
  try {
    log('\n📧 TEST 3: Email Notification Expert (Template)', 'cyan');
    log('─'.repeat(60), 'blue');

    // Charger le template
    const templatePath = path.join(__dirname, '../templates/emails/rdv-notification-expert.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    const template = Handlebars.compile(templateContent);

    // Données de test
    const testData = {
      meeting_id: 'test-meeting-456',
      expert_email: email,
      expert_name: 'Jean Dupont',
      client_name: 'Alexandre Grandjean',
      client_email: 'alexandre@entreprise-test.fr',
      client_phone: '06 12 34 56 78',
      company_name: 'Test Entreprise SARL',
      scheduled_date: '15 octobre 2025',
      scheduled_time: '10:00',
      duration_minutes: 60,
      meeting_type: 'video',
      location: 'Lien visio',
      products: [
        { name: 'TICPE', estimated_savings: 15000 },
        { name: 'URSSAF', estimated_savings: 8000 }
      ],
      total_savings: 23000,
      products_count: 2,
      qualification_score: 8,
      apporteur_name: 'Sophie Durand',
      platform_url: 'https://www.profitum.app'
    };

    const html = template(testData);

    const mailOptions = {
      from: `"Profitum - Nouveau RDV" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🆕 Nouveau RDV proposé - ${testData.company_name}`,
      html: html,
      priority: 'high'
    };

    await emailTransporter.sendMail(mailOptions);
    log(`✅ Email notification expert envoyé avec succès à ${email}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function testEmailAlternative(email) {
  try {
    log('\n📧 TEST 4: Email Date Alternative (Template)', 'cyan');
    log('─'.repeat(60), 'blue');

    // Charger le template
    const templatePath = path.join(__dirname, '../templates/emails/rdv-alternative-proposee.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    const template = Handlebars.compile(templateContent);

    // Données de test
    const testData = {
      meeting_id: 'test-meeting-789',
      client_email: email,
      client_name: 'Alexandre Grandjean',
      original_date: '15 octobre 2025',
      original_time: '10:00',
      alternative_date: '16 octobre 2025',
      alternative_time: '14:30',
      expert_name: 'Jean Dupont',
      expert_notes: 'Je propose cette nouvelle date car j\'ai un imprévu ce jour-là. Désolé pour le désagrément.',
      products: [
        { name: 'TICPE', estimated_savings: 15000 },
        { name: 'URSSAF', estimated_savings: 8000 }
      ],
      apporteur_name: 'Sophie Durand',
      apporteur_email: 'sophie@profitum.fr',
      platform_url: 'https://www.profitum.app'
    };

    const html = template(testData);

    const mailOptions = {
      from: `"Profitum - Date Alternative" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `📅 Nouvelle date proposée par ${testData.expert_name}`,
      html: html
    };

    await emailTransporter.sendMail(mailOptions);
    log(`✅ Email date alternative envoyé avec succès à ${email}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// MAIN
async function main() {
  const email = process.argv[2];

  if (!email) {
    log('❌ Usage: node test-email-rdv.js <email>', 'red');
    log('   Exemple: node test-email-rdv.js grandjean.alexandre5@gmail.com', 'yellow');
    process.exit(1);
  }

  log('\n🚀 TEST SERVICE EMAIL RDV', 'bright');
  log('═'.repeat(60), 'blue');
  log(`📧 Email de test: ${email}`, 'cyan');
  log(`🌐 SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`, 'cyan');
  log(`👤 User: ${process.env.SMTP_USER}`, 'cyan');
  log('═'.repeat(60), 'blue');

  const results = {
    simple: await testEmailSimple(email),
    confirmation: await testEmailConfirmationRDV(email),
    notification: await testEmailNotificationExpert(email),
    alternative: await testEmailAlternative(email)
  };

  log('\n📊 RÉSULTATS', 'cyan');
  log('═'.repeat(60), 'blue');
  log(`Test Email Simple: ${results.simple ? '✅ SUCCÈS' : '❌ ÉCHEC'}`, results.simple ? 'green' : 'red');
  log(`Test Confirmation RDV: ${results.confirmation ? '✅ SUCCÈS' : '❌ ÉCHEC'}`, results.confirmation ? 'green' : 'red');
  log(`Test Notification Expert: ${results.notification ? '✅ SUCCÈS' : '❌ ÉCHEC'}`, results.notification ? 'green' : 'red');
  log(`Test Date Alternative: ${results.alternative ? '✅ SUCCÈS' : '❌ ÉCHEC'}`, results.alternative ? 'green' : 'red');
  log('═'.repeat(60), 'blue');

  const totalSuccess = Object.values(results).filter(r => r).length;
  const totalTests = Object.values(results).length;
  
  log(`\n🎯 Score: ${totalSuccess}/${totalTests}`, totalSuccess === totalTests ? 'green' : 'yellow');
  
  if (totalSuccess === totalTests) {
    log('✅ Tous les tests ont réussi !', 'green');
  } else {
    log(`⚠️ ${totalTests - totalSuccess} test(s) ont échoué`, 'yellow');
  }

  process.exit(totalSuccess === totalTests ? 0 : 1);
}

main().catch(error => {
  log(`\n❌ ERREUR FATALE: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

