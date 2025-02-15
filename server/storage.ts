import {
  users,
  requests,
  quotes,
  appointments,
  questionnaireResponses, // 🚀 Ajout de la table questionnaireResponses
  type User,
  type Request,
  type Quote,
  type Appointment,
  type InsertUser,
  type InsertRequest,
  type InsertQuote,
  type InsertAppointment,
  type InsertQuestionnaireResponse, // 🚀 Type pour les réponses du questionnaire
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Requests
  createRequest(request: InsertRequest & { clientId: number }): Promise<Request>;
  getRequestById(id: number): Promise<Request | undefined>;
  getRequestsByClient(clientId: number): Promise<Request[]>;
  getRequestsForPartners(): Promise<Request[]>;

  // Quotes
  createQuote(quote: InsertQuote & { partnerId: number }): Promise<Quote>;
  getQuotesByRequest(requestId: number): Promise<Quote[]>;
  getQuotesByPartner(partnerId: number): Promise<Quote[]>;
  updateQuoteStatus(id: number, status: Quote["status"]): Promise<Quote>;

  // Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByQuote(quoteId: number): Promise<Appointment[]>;

  // Questionnaire Responses
  saveQuestionnaireResponse(userId: number, answers: string[]): Promise<InsertQuestionnaireResponse>;
  getQuestionnaireResponses(userId: number): Promise<InsertQuestionnaireResponse[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }
    this.sessionStore = new PostgresSessionStore({
      conObject: { connectionString: process.env.DATABASE_URL },
      createTableIfMissing: true,
    });
  }

  // ================================
  // ✅ USERS
  // ================================
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  // ================================
  // ✅ REQUESTS
  // ================================
  async createRequest(request: InsertRequest & { clientId: number }): Promise<Request> {
    const [created] = await db.insert(requests).values({ ...request, status: "pending" }).returning();
    return created;
  }

  async getRequestById(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request;
  }

  async getRequestsByClient(clientId: number): Promise<Request[]> {
    return await db.select().from(requests).where(eq(requests.clientId, clientId));
  }

  async getRequestsForPartners(): Promise<Request[]> {
    return await db.select().from(requests).where(eq(requests.status, "pending"));
  }

  // ================================
  // ✅ QUOTES
  // ================================
  async createQuote(quote: InsertQuote & { partnerId: number }): Promise<Quote> {
    const [created] = await db.insert(quotes).values({ ...quote, status: "pending" }).returning();
    return created;
  }

  async getQuotesByRequest(requestId: number): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.requestId, requestId));
  }

  async getQuotesByPartner(partnerId: number): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.partnerId, partnerId));
  }

  async updateQuoteStatus(id: number, status: Quote["status"]): Promise<Quote> {
    const [updated] = await db.update(quotes).set({ status }).where(eq(quotes.id, id)).returning();
    return updated;
  }

  // ================================
  // ✅ APPOINTMENTS
  // ================================
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db.insert(appointments).values({ ...appointment, status: "scheduled" }).returning();
    return created;
  }

  async getAppointmentsByQuote(quoteId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.quoteId, quoteId));
  }

  // ================================
  // ✅ QUESTIONNAIRE RESPONSES
  // ================================
  async saveQuestionnaireResponse(userId: number, answers: string[]): Promise<InsertQuestionnaireResponse> {
    const [created] = await db.insert(questionnaireResponses).values({ userId, answers }).returning();
    return created;
  }

  async getQuestionnaireResponses(userId: number): Promise<InsertQuestionnaireResponse[]> {
    return await db.select().from(questionnaireResponses).where(eq(questionnaireResponses.userId, userId));
  }
}

export const storage = new DatabaseStorage();
