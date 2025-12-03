-- Table pour stocker les emails reçus des prospects (réponses et nouveaux contacts)
CREATE TABLE IF NOT EXISTS prospect_email_received (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lien avec le prospect
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  
  -- Identifiants Gmail
  gmail_message_id TEXT NOT NULL UNIQUE, -- ID unique du message Gmail
  gmail_thread_id TEXT, -- ID du thread Gmail (pour grouper les conversations)
  
  -- Informations expéditeur/destinataire
  from_email TEXT NOT NULL, -- Email de l'expéditeur
  from_name TEXT, -- Nom complet de l'expéditeur ("John Doe <john@example.com>")
  to_email TEXT, -- Email du destinataire (notre email)
  
  -- Contenu de l'email
  subject TEXT NOT NULL,
  body_html TEXT, -- Corps en HTML
  body_text TEXT, -- Corps en texte brut
  snippet TEXT, -- Extrait court du message (fourni par Gmail)
  
  -- Threading (pour suivre les conversations)
  in_reply_to TEXT, -- Message-ID de l'email auquel celui-ci répond
  "references" TEXT[], -- Liste des Message-IDs du thread
  
  -- Métadonnées Gmail
  headers JSONB, -- Tous les headers de l'email
  labels TEXT[], -- Labels Gmail (UNREAD, INBOX, etc.)
  
  -- Statut de traitement
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Date de réception
  is_read BOOLEAN DEFAULT FALSE, -- Lu par l'admin ?
  is_replied BOOLEAN DEFAULT FALSE, -- Admin a répondu ?
  replied_at TIMESTAMPTZ, -- Date de réponse de l'admin
  
  -- Métadonnées additionnelles
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_prospect_email_received_prospect_id 
  ON prospect_email_received(prospect_id);

CREATE INDEX IF NOT EXISTS idx_prospect_email_received_gmail_message_id 
  ON prospect_email_received(gmail_message_id);

CREATE INDEX IF NOT EXISTS idx_prospect_email_received_gmail_thread_id 
  ON prospect_email_received(gmail_thread_id);

CREATE INDEX IF NOT EXISTS idx_prospect_email_received_received_at 
  ON prospect_email_received(received_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospect_email_received_is_read 
  ON prospect_email_received(is_read) WHERE is_read = FALSE;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_prospect_email_received_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prospect_email_received_timestamp
  BEFORE UPDATE ON prospect_email_received
  FOR EACH ROW
  EXECUTE FUNCTION update_prospect_email_received_timestamp();

-- RLS (Row Level Security) - Accessible uniquement aux admins
ALTER TABLE prospect_email_received ENABLE ROW LEVEL SECURITY;

-- Policy : admins peuvent tout faire
CREATE POLICY "Admins can do everything on prospect_email_received"
  ON prospect_email_received
  FOR ALL
  USING (auth.jwt() ->> 'user_type' = 'admin');

-- Commentaires
COMMENT ON TABLE prospect_email_received IS 'Emails reçus des prospects (réponses aux emails de prospection et nouveaux contacts)';
COMMENT ON COLUMN prospect_email_received.gmail_message_id IS 'ID unique du message dans Gmail';
COMMENT ON COLUMN prospect_email_received.gmail_thread_id IS 'ID du thread Gmail pour regrouper les conversations';
COMMENT ON COLUMN prospect_email_received.in_reply_to IS 'Message-ID de l''email auquel celui-ci répond (header In-Reply-To)';
COMMENT ON COLUMN prospect_email_received."references" IS 'Liste des Message-IDs du thread (header References)';
COMMENT ON COLUMN prospect_email_received.is_read IS 'Indique si l''email a été lu par un admin';
COMMENT ON COLUMN prospect_email_received.is_replied IS 'Indique si un admin a répondu à cet email';

