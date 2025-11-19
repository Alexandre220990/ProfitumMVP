-- =====================================================
-- AJOUT DES POLITIQUES RLS MANQUANTES
-- Pour service_role INSERT et UPDATE
-- =====================================================

-- Supprimer les politiques si elles existent (pour éviter les erreurs)
DROP POLICY IF EXISTS "Allow service role insert" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow service role update" ON public.contact_messages;

-- Politique RLS : Permettre au service role d'insérer (pour le backend)
CREATE POLICY "Allow service role insert" ON public.contact_messages
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Politique RLS : Permettre au service role de mettre à jour (pour le backend)
CREATE POLICY "Allow service role update" ON public.contact_messages
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

