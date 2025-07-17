import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ===== INTÉGRATIONS DE SIGNATURE ÉLECTRONIQUE =====

export enum SignatureProvider {
  DOCUSIGN = 'docusign',
  HELLOSIGN = 'hellosign',
  ADOBE_SIGN = 'adobe_sign',
  SIGN_NOW = 'sign_now'
}

export interface SignatureRequest {
  id: string;
  document_id: string;
  provider: SignatureProvider;
  signers: Array<{
    email: string;
    name: string;
    role: string;
    order: number;
  }>;
  subject: string;
  message: string;
  expires_in_days: number;
  metadata?: any;
}

export interface SignatureStatus {
  request_id: string;
  status: 'pending' | 'sent' | 'signed' | 'completed' | 'expired' | 'cancelled';
  signed_at?: string;
  signed_by?: string;
  signature_url?: string;
  certificate_url?: string;
}

// ===== INTÉGRATIONS DE PAIEMENT =====

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  ADYEN = 'adyen',
  SQUARE = 'square'
}

export interface PaymentRequest {
  id: string;
  invoice_id: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  description: string;
  customer_email: string;
  metadata?: any;
}

export interface PaymentStatus {
  payment_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  amount_paid?: number;
  paid_at?: string;
  failure_reason?: string;
}

// ===== INTÉGRATIONS DE NOTIFICATIONS PUSH =====

export enum PushProvider {
  FIREBASE = 'firebase',
  ONESIGNAL = 'onesignal',
  PUSHY = 'pushy',
  AIRSHIP = 'airship'
}

export interface PushNotification {
  id: string;
  user_id: string;
  provider: PushProvider;
  title: string;
  body: string;
  data?: any;
  image_url?: string;
  action_url?: string;
  priority: 'normal' | 'high';
  ttl?: number;
}

export interface PushDeliveryStatus {
  notification_id: string;
  status: 'sent' | 'delivered' | 'failed' | 'opened';
  delivered_at?: string;
  opened_at?: string;
  failure_reason?: string;
}

export class ExternalIntegrationsService {
  
  // ===== CONFIGURATION DES PROVIDERS =====

  private getProviderConfig(provider: string, type: 'signature' | 'payment' | 'push'): any {
    const configs = {
      signature: {
        docusign: {
          api_key: process.env.DOCUSIGN_API_KEY,
          account_id: process.env.DOCUSIGN_ACCOUNT_ID,
          user_id: process.env.DOCUSIGN_USER_ID,
          base_url: process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net'
        },
        hellosign: {
          api_key: process.env.HELLOSIGN_API_KEY,
          base_url: 'https://api.hellosign.com/v3'
        },
        adobe_sign: {
          client_id: process.env.ADOBE_SIGN_CLIENT_ID,
          client_secret: process.env.ADOBE_SIGN_CLIENT_SECRET,
          base_url: 'https://api.echosign.com'
        }
      },
      payment: {
        stripe: {
          secret_key: process.env.STRIPE_SECRET_KEY,
          publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
          webhook_secret: process.env.STRIPE_WEBHOOK_SECRET
        },
        paypal: {
          client_id: process.env.PAYPAL_CLIENT_ID,
          client_secret: process.env.PAYPAL_CLIENT_SECRET,
          mode: process.env.PAYPAL_MODE || 'sandbox'
        },
        adyen: {
          api_key: process.env.ADYEN_API_KEY,
          merchant_account: process.env.ADYEN_MERCHANT_ACCOUNT,
          environment: process.env.ADYEN_ENVIRONMENT || 'test'
        }
      },
      push: {
        firebase: {
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY,
          client_email: process.env.FIREBASE_CLIENT_EMAIL
        },
        onesignal: {
          app_id: process.env.ONESIGNAL_APP_ID,
          rest_api_key: process.env.ONESIGNAL_REST_API_KEY
        },
        pushy: {
          api_key: process.env.PUSHY_API_KEY
        }
      }
    };

    return configs[type][provider];
  }

  // ===== INTÉGRATIONS DE SIGNATURE ÉLECTRONIQUE =====

  /**
   * Créer une demande de signature DocuSign
   */
  async createDocuSignSignature(signatureRequest: SignatureRequest): Promise<string> {
    try {
      const config = this.getProviderConfig('docusign', 'signature');
      
      // Obtenir le token d'accès
      const authResponse = await axios.post(`${config.base_url}/oauth/token`, {
        grant_type: 'password',
        username: config.user_id,
        password: process.env.DOCUSIGN_PASSWORD,
        integrator_key: config.api_key
      });

      const accessToken = authResponse.data.access_token;

      // Créer l'enveloppe de signature
      const envelopeRequest = {
        emailSubject: signatureRequest.subject,
        emailBlurb: signatureRequest.message,
        documents: [{
          documentBase64: await this.getDocumentBase64(signatureRequest.document_id),
          name: 'Document à signer',
          fileExtension: 'pdf',
          documentId: '1'
        }],
        recipients: {
          signers: signatureRequest.signers.map(signer => ({
            email: signer.email,
            name: signer.name,
            recipientId: signer.order.toString(),
            routingOrder: signer.order
          }))
        },
        status: 'sent'
      };

      const envelopeResponse = await axios.post(
        `${config.base_url}/restapi/v2.1/accounts/${config.account_id}/envelopes`,
        envelopeRequest,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Sauvegarder la demande
      await this.saveSignatureRequest(signatureRequest, envelopeResponse.data.envelopeId);

      return envelopeResponse.data.envelopeId;

    } catch (error) {
      console.error('Erreur création signature DocuSign:', error);
      throw error;
    }
  }

  /**
   * Créer une demande de signature HelloSign
   */
  async createHelloSignSignature(signatureRequest: SignatureRequest): Promise<string> {
    try {
      const config = this.getProviderConfig('hellosign', 'signature');
      
      const signatureRequestData = {
        test_mode: process.env.NODE_ENV !== 'production' ? 1 : 0,
        title: signatureRequest.subject,
        subject: signatureRequest.subject,
        message: signatureRequest.message,
        signers: signatureRequest.signers.map(signer => ({
          email_address: signer.email,
          name: signer.name,
          role: signer.role
        })),
        files: [await this.getDocumentBase64(signatureRequest.document_id)],
        metadata: signatureRequest.metadata
      };

      const response = await axios.post(
        `${config.base_url}/signature_request/send`,
        signatureRequestData,
        {
          headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Sauvegarder la demande
      await this.saveSignatureRequest(signatureRequest, response.data.signature_request.signature_request_id);

      return response.data.signature_request.signature_request_id;

    } catch (error) {
      console.error('Erreur création signature HelloSign:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'une signature
   */
  async checkSignatureStatus(requestId: string, provider: SignatureProvider): Promise<SignatureStatus> {
    try {
      switch (provider) {
        case SignatureProvider.DOCUSIGN:
          return await this.checkDocuSignStatus(requestId);
        case SignatureProvider.HELLOSIGN:
          return await this.checkHelloSignStatus(requestId);
        default:
          throw new Error(`Provider non supporté: ${provider}`);
      }
    } catch (error) {
      console.error('Erreur vérification statut signature:', error);
      throw error;
    }
  }

  private async checkDocuSignStatus(requestId: string): Promise<SignatureStatus> {
    const config = this.getProviderConfig('docusign', 'signature');
    
    const authResponse = await axios.post(`${config.base_url}/oauth/token`, {
      grant_type: 'password',
      username: config.user_id,
      password: process.env.DOCUSIGN_PASSWORD,
      integrator_key: config.api_key
    });

    const accessToken = authResponse.data.access_token;

    const response = await axios.get(
      `${config.base_url}/restapi/v2.1/accounts/${config.account_id}/envelopes/${requestId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const envelope = response.data;
    
    return {
      request_id: requestId,
      status: this.mapDocuSignStatus(envelope.status),
      signed_at: envelope.completedDateTime,
      signed_by: envelope.signerEmail,
      signature_url: envelope.recipients?.signers?.[0]?.signatureUrl
    };
  }

  private async checkHelloSignStatus(requestId: string): Promise<SignatureStatus> {
    const config = this.getProviderConfig('hellosign', 'signature');
    
    const response = await axios.get(
      `${config.base_url}/signature_request/${requestId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.api_key}`
        }
      }
    );

    const signatureRequest = response.data.signature_request;
    
    return {
      request_id: requestId,
      status: this.mapHelloSignStatus(signatureRequest.is_complete),
      signed_at: signatureRequest.signed_at,
      signed_by: signatureRequest.signatures?.[0]?.signer_email_address
    };
  }

  // ===== INTÉGRATIONS DE PAIEMENT =====

  /**
   * Créer un paiement Stripe
   */
  async createStripePayment(paymentRequest: PaymentRequest): Promise<string> {
    try {
      const config = this.getProviderConfig('stripe', 'payment');
      
      const paymentIntent = await axios.post(
        'https://api.stripe.com/v1/payment_intents',
        {
          amount: Math.round(paymentRequest.amount * 100), // Stripe utilise les centimes
          currency: paymentRequest.currency.toLowerCase(),
          description: paymentRequest.description,
          metadata: {
            invoice_id: paymentRequest.invoice_id,
            ...paymentRequest.metadata
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.secret_key}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      // Sauvegarder le paiement
      await this.savePaymentRequest(paymentRequest, paymentIntent.data.id);

      return paymentIntent.data.id;

    } catch (error) {
      console.error('Erreur création paiement Stripe:', error);
      throw error;
    }
  }

  /**
   * Créer un paiement PayPal
   */
  async createPayPalPayment(paymentRequest: PaymentRequest): Promise<string> {
    try {
      const config = this.getProviderConfig('paypal', 'payment');
      
      // Obtenir le token d'accès
      const authResponse = await axios.post(
        `https://api.${config.mode}.paypal.com/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${config.client_id}:${config.client_secret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = authResponse.data.access_token;

      // Créer l'ordre de paiement
      const orderResponse = await axios.post(
        `https://api.${config.mode}.paypal.com/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: paymentRequest.currency,
              value: paymentRequest.amount.toString()
            },
            description: paymentRequest.description,
            custom_id: paymentRequest.invoice_id
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Sauvegarder le paiement
      await this.savePaymentRequest(paymentRequest, orderResponse.data.id);

      return orderResponse.data.id;

    } catch (error) {
      console.error('Erreur création paiement PayPal:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(paymentId: string, provider: PaymentProvider): Promise<PaymentStatus> {
    try {
      switch (provider) {
        case PaymentProvider.STRIPE:
          return await this.checkStripePaymentStatus(paymentId);
        case PaymentProvider.PAYPAL:
          return await this.checkPayPalPaymentStatus(paymentId);
        default:
          throw new Error(`Provider non supporté: ${provider}`);
      }
    } catch (error) {
      console.error('Erreur vérification statut paiement:', error);
      throw error;
    }
  }

  private async checkStripePaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const config = this.getProviderConfig('stripe', 'payment');
    
    const response = await axios.get(
      `https://api.stripe.com/v1/payment_intents/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.secret_key}`
        }
      }
    );

    const paymentIntent = response.data;
    
    return {
      payment_id: paymentId,
      status: this.mapStripeStatus(paymentIntent.status),
      transaction_id: paymentIntent.latest_charge,
      amount_paid: paymentIntent.amount / 100,
      paid_at: paymentIntent.created ? new Date(paymentIntent.created * 1000).toISOString() : undefined
    };
  }

  private async checkPayPalPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const config = this.getProviderConfig('paypal', 'payment');
    
    const authResponse = await axios.post(
      `https://api.${config.mode}.paypal.com/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.client_id}:${config.client_secret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = authResponse.data.access_token;

    const response = await axios.get(
      `https://api.${config.mode}.paypal.com/v2/checkout/orders/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const order = response.data;
    
    return {
      payment_id: paymentId,
      status: this.mapPayPalStatus(order.status),
      transaction_id: order.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      amount_paid: parseFloat(order.purchase_units?.[0]?.amount?.value || '0'),
      paid_at: order.update_time
    };
  }

  // ===== INTÉGRATIONS DE NOTIFICATIONS PUSH =====

  /**
   * Envoyer une notification push Firebase
   */
  async sendFirebasePush(notification: PushNotification): Promise<string> {
    try {
      const config = this.getProviderConfig('firebase', 'push');
      
      // Obtenir le token de l'utilisateur
      const userToken = await this.getUserPushToken(notification.user_id);
      if (!userToken) {
        throw new Error('Token push non trouvé pour l\'utilisateur');
      }

      const message = {
        token: userToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data,
        android: {
          priority: notification.priority === 'high' ? 'high' : 'normal',
          ttl: notification.ttl ? `${notification.ttl}s` : '86400s'
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body
              },
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await axios.post(
        `https://fcm.googleapis.com/v1/projects/${config.project_id}/messages:send`,
        { message },
        {
          headers: {
            'Authorization': `Bearer ${await this.getFirebaseAccessToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Sauvegarder la notification
      await this.savePushNotification(notification, response.data.name);

      return response.data.name;

    } catch (error) {
      console.error('Erreur envoi notification Firebase:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification push OneSignal
   */
  async sendOneSignalPush(notification: PushNotification): Promise<string> {
    try {
      const config = this.getProviderConfig('onesignal', 'push');
      
      // Obtenir le token de l'utilisateur
      const userToken = await this.getUserPushToken(notification.user_id);
      if (!userToken) {
        throw new Error('Token push non trouvé pour l\'utilisateur');
      }

      const message = {
        app_id: config.app_id,
        include_player_ids: [userToken],
        headings: { en: notification.title },
        contents: { en: notification.body },
        data: notification.data,
        priority: notification.priority === 'high' ? 10 : 5,
        ttl: notification.ttl || 86400
      };

      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        message,
        {
          headers: {
            'Authorization': `Basic ${config.rest_api_key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Sauvegarder la notification
      await this.savePushNotification(notification, response.data.id);

      return response.data.id;

    } catch (error) {
      console.error('Erreur envoi notification OneSignal:', error);
      throw error;
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Obtenir le contenu base64 d'un document
   */
  private async getDocumentBase64(documentId: string): Promise<string> {
    // Implémentation pour récupérer le document et le convertir en base64
    // À adapter selon votre système de stockage
    return '';
  }

  /**
   * Sauvegarder une demande de signature
   */
  private async saveSignatureRequest(signatureRequest: SignatureRequest, externalId: string): Promise<void> {
    await supabase
      .from('SignatureRequest')
      .insert({
        id: signatureRequest.id,
        document_id: signatureRequest.document_id,
        provider: signatureRequest.provider,
        external_id: externalId,
        signers: signatureRequest.signers,
        subject: signatureRequest.subject,
        message: signatureRequest.message,
        expires_in_days: signatureRequest.expires_in_days,
        metadata: signatureRequest.metadata,
        status: 'pending',
        created_at: new Date().toISOString()
      });
  }

  /**
   * Sauvegarder une demande de paiement
   */
  private async savePaymentRequest(paymentRequest: PaymentRequest, externalId: string): Promise<void> {
    await supabase
      .from('PaymentRequest')
      .insert({
        id: paymentRequest.id,
        invoice_id: paymentRequest.invoice_id,
        provider: paymentRequest.provider,
        external_id: externalId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        description: paymentRequest.description,
        customer_email: paymentRequest.customer_email,
        metadata: paymentRequest.metadata,
        status: 'pending',
        created_at: new Date().toISOString()
      });
  }

  /**
   * Sauvegarder une notification push
   */
  private async savePushNotification(notification: PushNotification, externalId: string): Promise<void> {
    await supabase
      .from('PushNotification')
      .insert({
        id: notification.id,
        user_id: notification.user_id,
        provider: notification.provider,
        external_id: externalId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        image_url: notification.image_url,
        action_url: notification.action_url,
        priority: notification.priority,
        ttl: notification.ttl,
        status: 'sent',
        created_at: new Date().toISOString()
      });
  }

  /**
   * Obtenir le token push d'un utilisateur
   */
  private async getUserPushToken(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('UserDevices')
      .select('push_token')
      .eq('user_id', userId)
      .eq('active', true)
      .single();

    if (error) return null;
    return data?.push_token || null;
  }

  /**
   * Obtenir le token d'accès Firebase
   */
  private async getFirebaseAccessToken(): Promise<string> {
    // Implémentation pour obtenir le token d'accès Firebase
    // À adapter selon votre configuration
    return '';
  }

  // ===== MAPPING DES STATUTS =====

  private mapDocuSignStatus(status: string): string {
    const mapping: { [key: string]: string } = {
      'sent': 'sent',
      'delivered': 'sent',
      'signed': 'signed',
      'completed': 'completed',
      'declined': 'cancelled',
      'voided': 'cancelled'
    };
    return mapping[status] || 'pending';
  }

  private mapHelloSignStatus(isComplete: boolean): string {
    return isComplete ? 'completed' : 'pending';
  }

  private mapStripeStatus(status: string): string {
    const mapping: { [key: string]: string } = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'processing',
      'succeeded': 'completed',
      'canceled': 'cancelled'
    };
    return mapping[status] || 'pending';
  }

  private mapPayPalStatus(status: string): string {
    const mapping: { [key: string]: string } = {
      'CREATED': 'pending',
      'SAVED': 'pending',
      'APPROVED': 'pending',
      'VOIDED': 'cancelled',
      'COMPLETED': 'completed'
    };
    return mapping[status] || 'pending';
  }
}

export default ExternalIntegrationsService; 