-- Script pour créer 10 experts avec des spécialisations multiples
-- Correspondant aux produits éligibles : CEE, DFS, Foncier, MSA, Optimisation Énergie, TICPE, URSSAF
-- Utilise le même pattern que Client : id = auth_id de Supabase Auth

-- Nettoyage préalable (optionnel - décommentez si nécessaire)
-- DELETE FROM "Expert" WHERE email IN ('jean.dupont@cabinet-fiscal-plus.fr', 'marie.laurent@social-experts.fr', 'pierre.martin@cabinet-martin-associes.fr', 'sophie.dubois@dubois-consulting.fr', 'thomas.bernard@bernard-social.fr', 'anne.roussel@cabinet-roussel.fr', 'luc.moreau@moreau-energie.fr', 'camille.leroy@leroy-fiscal.fr', 'julie.petit@petit-agricole.fr', 'marc.durand@durand-eco.fr');

-- Insertion des experts avec id = auth_id (même pattern que Client)
INSERT INTO "Expert" (
    id,
    email,
    password,
    name,
    company_name,
    siren,
    specializations,
    experience,
    location,
    rating,
    compensation,
    description,
    status,
    disponibilites,
    certifications,
    card_number,
    card_expiry,
    card_cvc,
    abonnement,
    auth_id,
    created_at,
    updated_at
) VALUES
-- Expert 1 : Spécialisé TICPE + URSSAF
(
    'a26a9609-a160-47a0-9698-955876c3618d', -- id = auth_id
    'jean.dupont@cabinet-fiscal-plus.fr',
    '$2a$10$demo_password_hash',
    'Jean Dupont',
    'Cabinet Fiscal Plus',
    '123456789',
    ARRAY['TICPE', 'URSSAF'],
    '15 ans d''expérience en optimisation fiscale et sociale',
    'Paris',
    4.8,
    18.5,
    'Expert reconnu en optimisation fiscale avec une expertise particulière en TICPE et URSSAF. Plus de 200 dossiers traités avec succès.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification TICPE", "Certification URSSAF", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'scale',
    'a26a9609-a160-47a0-9698-955876c3618d', -- auth_id = id
    NOW(),
    NOW()
),

-- Expert 2 : Spécialisé DFS + Foncier
(
    '990d90b0-f10f-45b5-893d-fd438edd0c9e', -- id = auth_id
    'marie.laurent@social-experts.fr',
    '$2a$10$demo_password_hash',
    'Marie Laurent',
    'Social Experts',
    '987654321',
    ARRAY['DFS', 'Foncier'],
    '12 ans d''expérience en fiscalité et optimisation sociale',
    'Lyon',
    4.9,
    22.0,
    'Spécialiste des questions fiscales et sociales, expert en DFS et optimisation foncière. Accompagnement personnalisé et résultats garantis.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification DFS", "Certification Foncier", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'scale',
    '990d90b0-f10f-45b5-893d-fd438edd0c9e', -- auth_id = id
    NOW(),
    NOW()
),

-- Expert 3 : Spécialisé CEE + Optimisation Énergie
(
    'a2c5b6a1-6464-4a5d-95da-f769e61faf48', -- id = auth_id
    'pierre.martin@cabinet-martin-associes.fr',
    '$2a$10$demo_password_hash',
    'Pierre Martin',
    'Cabinet Martin & Associés',
    '456789123',
    ARRAY['CEE', 'Optimisation Énergie'],
    '10 ans d''expérience en crédits d''impôts et optimisations énergétiques',
    'Marseille',
    4.7,
    16.5,
    'Expert en crédits d''impôts et optimisations énergétiques. Spécialiste des certificats d''économies d''énergie et de l''optimisation des contrats.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification CEE", "Certification Optimisation Énergie", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'growth',
    'a2c5b6a1-6464-4a5d-95da-f769e61faf48', -- auth_id = id
    NOW(),
    NOW()
),

-- Expert 4 : Spécialisé TICPE + CEE + DFS
(
    '4e184a7e-9fa6-480c-9dae-6f8b9714c88e', -- id = auth_id
    'sophie.dubois@dubois-consulting.fr',
    '$2a$10$demo_password_hash',
    'Sophie Dubois',
    'Dubois Consulting',
    '789123456',
    ARRAY['TICPE', 'CEE', 'DFS'],
    '18 ans d''expérience en fiscalité et optimisation',
    'Bordeaux',
    4.9,
    25.0,
    'Consultante senior en fiscalité et optimisation. Expertise complète en TICPE, CEE et DFS. Plus de 500 dossiers traités.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification TICPE", "Certification CEE", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'scale',
    '4e184a7e-9fa6-480c-9dae-6f8b9714c88e', -- auth_id = id
    NOW(),
    NOW()
),

-- Expert 5 : Spécialisé URSSAF + MSA
(
    '9f5e68b4-814a-427a-835e-d325247f7b77', -- id = auth_id
    'thomas.bernard@bernard-social.fr',
    '$2a$10$demo_password_hash',
    'Thomas Bernard',
    'Bernard Social',
    '321654987',
    ARRAY['URSSAF', 'MSA'],
    '8 ans d''expérience en fiscalité sociale et optimisations',
    'Lille',
    4.6,
    14.5,
    'Expert en fiscalité sociale et optimisations URSSAF et MSA. Accompagnement des entreprises agricoles et commerciales.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification URSSAF", "Certification MSA", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'growth',
    '9f5e68b4-814a-427a-835e-d325247f7b77', -- auth_id = id
    NOW(),
    NOW()
),

-- Expert 6 : Spécialisé Foncier + DFS
(
    '6dde9f23-fb44-4f5c-83c6-75ccc4226477', -- id = auth_id
    'anne.roussel@cabinet-roussel.fr',
    '$2a$10$demo_password_hash',
    'Anne Roussel',
    'Cabinet Roussel',
    '654321987',
    ARRAY['Foncier', 'DFS'],
    '11 ans d''expérience en fiscalité foncière',
    'Nantes',
    4.5,
    19.0,
    'Spécialiste en fiscalité foncière et DFS. Expertise particulière pour les investisseurs immobiliers et les entreprises.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification Foncier", "Certification DFS", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'growth',
    '6dde9f23-fb44-4f5c-83c6-75ccc4226477', -- auth_id = id
    NOW(),
    NOW()
),

-- Expert 7 : Spécialisé Optimisation Énergie + CEE
(
    '910fc79d-a09a-4c0f-9c66-1a8128b96cd4', -- id = auth_id
    'luc.moreau@moreau-energie.fr',
    '$2a$10$demo_password_hash',
    'Luc Moreau',
    'Moreau Énergie',
    '147258369',
    ARRAY['Optimisation Énergie', 'CEE'],
    '13 ans d''expérience en optimisation énergétique',
    'Toulouse',
    4.8,
    21.5,
    'Expert en optimisation énergétique et certificats d''économies d''énergie. Accompagnement des entreprises dans leur transition énergétique.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification Optimisation Énergie", "Certification CEE", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'scale',
    '910fc79d-a09a-4c0f-9c66-1a8128b96cd4', -- auth_id = id
    NOW(),
    NOW()
),

-- Expert 8 : Spécialisé TICPE + DFS + URSSAF
(
    '335a04a7-ca00-42c3-aee2-510cc4ecdd72', -- id = auth_id
    'camille.leroy@leroy-fiscal.fr',
    '$2a$10$demo_password_hash',
    'Camille Leroy',
    'Leroy Fiscal',
    '963852741',
    ARRAY['TICPE', 'DFS', 'URSSAF'],
    '16 ans d''expérience en fiscalité et optimisation',
    'Strasbourg',
    4.7,
    23.0,
    'Expert polyvalent en fiscalité et optimisation. Spécialiste TICPE, DFS et URSSAF. Accompagnement complet des entreprises.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification TICPE", "Certification DFS", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'scale',
    '335a04a7-ca00-42c3-aee2-510cc4ecdd72', -- auth_id = id
    NOW(),
    NOW()
),

-- Expert 9 : Spécialisé MSA + Foncier
(
    '33f7c567-06ec-41dc-959a-e14dac7f45ce', -- id = auth_id
    'julie.petit@petit-agricole.fr',
    '$2a$10$demo_password_hash',
    'Julie Petit',
    'Petit Agricole',
    '852963741',
    ARRAY['MSA', 'Foncier'],
    '9 ans d''expérience en secteur agricole',
    'Dijon',
    4.4,
    17.5,
    'Spécialiste du secteur agricole et de l''optimisation MSA. Expertise en fiscalité foncière pour les exploitants agricoles.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification MSA", "Certification Foncier", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'starter',
    '33f7c567-06ec-41dc-959a-e14dac7f45ce', -- auth_id = id
    NOW(),
    NOW()
),

-- Expert 10 : Spécialisé CEE + Optimisation Énergie + DFS
(
    'efbecbcd-547c-469d-bac1-7596c244d9d4', -- id = auth_id
    'marc.durand@durand-eco.fr',
    '$2a$10$demo_password_hash',
    'Marc Durand',
    'Durand Éco',
    '741852963',
    ARRAY['CEE', 'Optimisation Énergie', 'DFS'],
    '14 ans d''expérience en développement durable et fiscalité',
    'Grenoble',
    4.6,
    20.0,
    'Expert en développement durable et fiscalité verte. Spécialiste CEE, optimisation énergétique et DFS pour entreprises éco-responsables.',
    'active',
    '{"lundi": "9h-17h", "mardi": "9h-17h", "mercredi": "9h-17h", "jeudi": "9h-17h", "vendredi": "9h-17h"}',
    '["Certification CEE", "Certification Optimisation Énergie", "Certification Expert"]',
    NULL,
    NULL,
    NULL,
    'growth',
    'efbecbcd-547c-469d-bac1-7596c244d9d4', -- auth_id = id
    NOW(),
    NOW()
);

-- Vérification de l'insertion
SELECT 
    id,
    name,
    company_name,
    specializations,
    rating,
    compensation,
    status,
    abonnement,
    auth_id,
    CASE WHEN id = auth_id THEN '✅ OK' ELSE '❌ ERREUR' END as id_match
FROM "Expert" 
WHERE email LIKE '%demo%' OR email LIKE '%@%'
ORDER BY name; 