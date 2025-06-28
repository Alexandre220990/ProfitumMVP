import session from "express-session";
import { userQueries, requestQueries, quoteQueries, appointmentQueries, questionnaireQueries } from './db/queries';
import { User, Request, Quote, Appointment, QuestionnaireResponse } from '../shared/data';

// ✅ ID du client de test (exposé pour utilisation dans d'autres fichiers)
export const CLIENT_TEST_ID = 2;

// ✅ Utilisateurs de test pré-configurés
const testUsers: User[] = [
  {
    id: 1,
    username: "Alex G.",
    email: "alex@gmail.com",
    password: "Profitum",
    type: "client",
    companyName: null,
    phoneNumber: "0612345678",
    address: "123 Rue Test",
    city: "Paris",
    postalCode: "75000",
    siret: null,
    createdAt: new Date(),
  },
  {
    id: 2, // ✅ Référence dynamique à l'ID client
    username: "Client",
    email: "client@gmail.com",
    password: "client",
    type: "client",
    companyName: "Client Test SARL",
    phoneNumber: "0687654321",
    address: "456 Avenue Test",
    city: "Lyon",
    postalCode: "69000",
    siret: "12345678901234",
    createdAt: new Date(),
  },
];

export interface IStorage {
  // Gestion des utilisateurs
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;

  // Gestion des demandes
  createRequest(request: Omit<Request, "id" | "createdAt">): Promise<Request>;
  getRequest(id: number): Promise<Request | undefined>;
  getRequestsByClientId(clientId: number): Promise<Request[]>;

  // Gestion des devis
  createQuote(quote: Omit<Quote, "id" | "createdAt">): Promise<Quote>;
  getQuotesByRequestId(requestId: number): Promise<Quote[]>;
  getQuotesByClientId(clientId: number): Promise<Quote[]>;

  // Gestion des rendez-vous
  createAppointment(appointment: Omit<Appointment, "id" | "createdAt">): Promise<Appointment>;
  getAppointmentsByQuoteId(quoteId: number): Promise<Appointment[]>;

  // Gestion des réponses aux questionnaires
  saveQuestionnaireResponse(response: Omit<QuestionnaireResponse, "id" | "createdAt">): Promise<QuestionnaireResponse>;
  getQuestionnaireResponsesByUserId(userId: number): Promise<QuestionnaireResponse[]>;

  // Gestion des sessions
  sessionStore: session.Store;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new session.MemoryStore();
  }

  // =======================================
  // ✅ Gestion des utilisateurs
  // =======================================
  async getUser(id: number): Promise<User | undefined> {
    return userQueries.getUserById(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return userQueries.getUserByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return userQueries.getUserByEmail(email);
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    return userQueries.createUser(user);
  }

  // =======================================
  // ✅ Gestion des demandes
  // =======================================
  async createRequest(request: Omit<Request, "id" | "createdAt">): Promise<Request> {
    return requestQueries.createRequest(request);
  }

  async getRequest(id: number): Promise<Request | undefined> {
    return requestQueries.getRequestById(id);
  }

  async getRequestsByClientId(clientId: number): Promise<Request[]> {
    return requestQueries.getRequestsByClientId(clientId);
  }

  // =======================================
  // ✅ Gestion des devis
  // =======================================
  async createQuote(quote: Omit<Quote, "id" | "createdAt">): Promise<Quote> {
    return quoteQueries.createQuote(quote);
  }

  async getQuotesByRequestId(requestId: number): Promise<Quote[]> {
    return quoteQueries.getQuotesByRequestId(requestId);
  }

  async getQuotesByClientId(clientId: number): Promise<Quote[]> {
    return quoteQueries.getQuotesByClientId(clientId);
  }

  // =======================================
  // ✅ Gestion des rendez-vous
  // =======================================
  async createAppointment(appointment: Omit<Appointment, "id" | "createdAt">): Promise<Appointment> {
    return appointmentQueries.createAppointment(appointment);
  }

  async getAppointmentsByQuoteId(quoteId: number): Promise<Appointment[]> {
    return appointmentQueries.getAppointmentsByQuoteId(quoteId);
  }

  // =======================================
  // ✅ Gestion des réponses aux questionnaires
  // =======================================
  async saveQuestionnaireResponse(response: Omit<QuestionnaireResponse, "id" | "createdAt">): Promise<QuestionnaireResponse> {
    return questionnaireQueries.saveResponse(response);
  }

  async getQuestionnaireResponsesByUserId(userId: number): Promise<QuestionnaireResponse[]> {
    return questionnaireQueries.getResponsesByUserId(userId);
  }
}

// ✅ Exportation de l'instance pour une utilisation centralisée
export const storage = new DatabaseStorage();
