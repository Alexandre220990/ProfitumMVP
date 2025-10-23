-- Ajouter la colonne notification_preferences à la table ApporteurAffaires

-- Vérifier si la colonne existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ApporteurAffaires' 
        AND column_name = 'notification_preferences'
    ) THEN
        -- Ajouter la colonne notification_preferences (JSONB)
        ALTER TABLE "ApporteurAffaires" 
        ADD COLUMN notification_preferences JSONB DEFAULT '{
            "newProspects": true,
            "confirmedMeetings": true,
            "paidCommissions": true,
            "followUpReminders": false,
            "availableTrainings": false,
            "reminderFrequency": "daily"
        }'::jsonb;
        
        RAISE NOTICE 'Colonne notification_preferences ajoutée avec succès';
    ELSE
        RAISE NOTICE 'La colonne notification_preferences existe déjà';
    END IF;
END $$;

-- Vérifier que la colonne a été ajoutée
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ApporteurAffaires' 
AND column_name = 'notification_preferences';

