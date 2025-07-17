import { useState, useEffect } from "react";
import { ChatbotState, Message } from "../types/chatbot";

const STORAGE_KEY = 'profitum_chatbot_session';

/**
 * Hook personnalisé pour gérer la session du chatbot
 * Permet de sauvegarder et restaurer l'état de la conversation
 */
export const useChatbotSession = (initialSimulationId: string | null = null) => { const [state, setState] = useState<ChatbotState>(() => {
    // Essayer de charger l'état depuis le localStorage
    const savedState = loadSession();
    if (savedState) {
      return savedState; }
    
    // État initial si rien n'est trouvé
    return { simulationId: initialSimulationId, currentQuestionIndex: 0, messages: [], answers: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  });

  // Sauvegarder l'état dans le localStorage à chaque changement
  useEffect(() => { saveSession(state); }, [state]);

  /**
   * Charge la session depuis le localStorage
   */
  const loadSession = (): ChatbotState | null => { try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return null;
      
      const parsedData = JSON.parse(savedData);
      
      // Vérifier si la session n'est pas trop ancienne (24h max)
      const now = new Date();
      const updated = new Date(parsedData.updated_at);
      if (now.getTime() - updated.getTime() > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return null; }
      
      return parsedData;
    } catch (error) { console.error('Erreur lors du chargement de la session: ', error);
      return null; }
  };

  /**
   * Sauvegarde la session dans le localStorage
   */
  const saveSession = (stateToSave: ChatbotState) => { try {
      const stateWithTimestamp = {
        ...stateToSave, updated_at: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) { console.error('Erreur lors de la sauvegarde de la session: ', error); }
  };

  /**
   * Efface la session du localStorage
   */
  const clearSession = () => { try {
      localStorage.removeItem(STORAGE_KEY);
      setState({
        simulationId: initialSimulationId, currentQuestionIndex: 0, messages: [], answers: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    } catch (error) { console.error('Erreur lors de la suppression de la session: ', error); }
  };

  /**
   * Ajoute un message à la conversation
   */
  const addMessage = (message: Omit<Message, 'timestamp' | 'created_at' | 'updated_at'>) => { setState(prevState => ({
      ...prevState, messages: [
        ...prevState.messages, { 
          ...message, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
    }));
  };

  /**
   * Ajoute une réponse stockée
   */
  const addAnswer = (questionId: number, answer: string) => { setState(prevState => ({
      ...prevState, answers: [
        ...prevState.answers, { 
          questionId, answer, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
    }));
  };

  /**
   * Met à jour l'index de la question courante
   * @param index Le nouvel index de la question
   */
  const setCurrentQuestionIndex = (index: number) => { setState(prevState => ({
      ...prevState, currentQuestionIndex: index, updated_at: new Date().toISOString() }));
  };

  /**
   * Met à jour l'ID de simulation
   */
  const setSimulationId = (id: string | null) => { setState(prevState => ({
      ...prevState, simulationId: id, updated_at: new Date().toISOString() }));
  };

  return { state, addMessage, addAnswer, setCurrentQuestionIndex, setSimulationId, clearSession };
}; 