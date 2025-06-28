import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `Tu es un assistant spécialisé en optimisation fiscale et financière pour les entreprises françaises.
Tu dois aider les utilisateurs à identifier des opportunités d'optimisation fiscale et à comprendre les différents dispositifs disponibles.
Tu dois être précis, professionnel et toujours orienté solutions.
Tu dois te concentrer sur les dispositifs suivants :
- CIR (Crédit d'Impôt Recherche)
- CICE (Crédit d'Impôt pour la Compétitivité et l'Emploi)
- TICPE (Taxe Intérieure de Consommation sur les Produits Énergétiques)
- Optimisation de la TVA
- Optimisation des charges sociales
- Optimisation de l'IS
- Optimisation de l'IR

Tu dois toujours :
1. Poser des questions pertinentes pour comprendre la situation de l'entreprise
2. Expliquer clairement les dispositifs d'optimisation
3. Donner des exemples concrets
4. Préciser les conditions d'éligibilité
5. Mentionner les montants potentiels d'économie
6. Guider vers les prochaines étapes`;

router.post('/message', async (req, res) => {
  try {
    const { message, history } = req.body;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });
  } catch (error) {
    console.error('Erreur OpenAI:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du message' });
  }
});

export default router; 