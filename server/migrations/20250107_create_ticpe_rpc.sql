-- =====================================================
-- FONCTION RPC POUR INSERTION TRANSACTIONNELLE
-- Date: 2025-01-07
-- =====================================================

-- Fonction pour insérer les questions TICPE en transaction
CREATE OR REPLACE FUNCTION insert_ticpe_questions_transaction(questions_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    question_record jsonb;
    inserted_count integer := 0;
    error_count integer := 0;
    result jsonb;
BEGIN
    -- Démarrer une transaction
    BEGIN
        -- Parcourir chaque question dans le JSON
        FOR question_record IN SELECT * FROM jsonb_array_elements(questions_data)
        LOOP
            -- Insérer la question
            INSERT INTO "public"."QuestionnaireQuestion" (
                question_id,
                question_order,
                question_text,
                question_type,
                options,
                validation_rules,
                importance,
                conditions,
                produits_cibles,
                phase
            ) VALUES (
                (question_record->>'question_id')::text,
                (question_record->>'question_order')::integer,
                (question_record->>'question_text')::text,
                (question_record->>'question_type')::text,
                (question_record->>'options')::jsonb,
                (question_record->>'validation_rules')::jsonb,
                (question_record->>'importance')::integer,
                (question_record->>'conditions')::jsonb,
                (question_record->>'produits_cibles')::text[],
                (question_record->>'phase')::integer
            );
            
            inserted_count := inserted_count + 1;
        END LOOP;
        
        -- Si on arrive ici, tout s'est bien passé
        result := jsonb_build_object(
            'success', true,
            'inserted_count', inserted_count,
            'error_count', 0,
            'message', 'Toutes les questions ont ete inserees avec succes'
        );
        
        RETURN result;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- En cas d'erreur, rollback automatique
            error_count := questions_data::jsonb_array_length(questions_data) - inserted_count;
            result := jsonb_build_object(
                'success', false,
                'inserted_count', inserted_count,
                'error_count', error_count,
                'error_message', SQLERRM,
                'message', 'Erreur lors de l''insertion des questions'
            );
            
            RETURN result;
    END;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION insert_ticpe_questions_transaction(jsonb) IS 'Fonction pour inserer les questions TICPE en transaction atomique';

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION insert_ticpe_questions_transaction(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_ticpe_questions_transaction(jsonb) TO anon; 