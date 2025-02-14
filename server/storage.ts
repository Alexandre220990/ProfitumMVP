import { users, requests, quotes, appointments, type User, type Request, type Quote, type Appointment, type InsertUser, type InsertRequest, type InsertQuote, type InsertAppointment } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async createRequest(request: InsertRequest & { clientId: number }): Promise<Request> {
    const [created] = await db
      .insert(requests)
      .values({
        ...request,
        status: "pending",
      })
      .returning();
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

  async createQuote(quote: InsertQuote & { partnerId: number }): Promise<Quote> {
    const [created] = await db
      .insert(quotes)
      .values({
        ...quote,
        status: "pending",
      })
      .returning();
    return created;
  }

  async getQuotesByRequest(requestId: number): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.requestId, requestId));
  }

  async getQuotesByPartner(partnerId: number): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.partnerId, partnerId));
  }

  async updateQuoteStatus(id: number, status: Quote["status"]): Promise<Quote> {
    const [updated] = await db
      .update(quotes)
      .set({ status })
      .where(eq(quotes.id, id))
      .returning();
    return updated;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db
      .insert(appointments)
      .values({
        ...appointment,
        status: "scheduled",
      })
      .returning();
    return created;
  }

  async getAppointmentsByQuote(quoteId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.quoteId, quoteId));
  }
}

export const storage = new DatabaseStorage();