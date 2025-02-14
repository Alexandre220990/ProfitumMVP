import { User, Request, Quote, Appointment, InsertUser, InsertRequest, InsertQuote, InsertAppointment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private requests: Map<number, Request>;
  private quotes: Map<number, Quote>;
  private appointments: Map<number, Appointment>;
  sessionStore: session.Store;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.requests = new Map();
    this.quotes = new Map();
    this.appointments = new Map();
    this.currentId = { users: 1, requests: 1, quotes: 1, appointments: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRequest(request: InsertRequest & { clientId: number }): Promise<Request> {
    const id = this.currentId.requests++;
    const newRequest = {
      ...request,
      id,
      status: "pending",
      createdAt: new Date(),
    } as Request;
    this.requests.set(id, newRequest);
    return newRequest;
  }

  async getRequestById(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async getRequestsByClient(clientId: number): Promise<Request[]> {
    return Array.from(this.requests.values()).filter(
      (request) => request.clientId === clientId,
    );
  }

  async getRequestsForPartners(): Promise<Request[]> {
    return Array.from(this.requests.values()).filter(
      (request) => request.status === "pending",
    );
  }

  async createQuote(quote: InsertQuote & { partnerId: number }): Promise<Quote> {
    const id = this.currentId.quotes++;
    const newQuote = {
      ...quote,
      id,
      status: "pending",
      createdAt: new Date(),
    } as Quote;
    this.quotes.set(id, newQuote);
    return newQuote;
  }

  async getQuotesByRequest(requestId: number): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(
      (quote) => quote.requestId === requestId,
    );
  }

  async getQuotesByPartner(partnerId: number): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(
      (quote) => quote.partnerId === partnerId,
    );
  }

  async updateQuoteStatus(id: number, status: Quote["status"]): Promise<Quote> {
    const quote = this.quotes.get(id);
    if (!quote) throw new Error("Quote not found");
    const updatedQuote = { ...quote, status };
    this.quotes.set(id, updatedQuote);
    return updatedQuote;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentId.appointments++;
    const newAppointment = {
      ...appointment,
      id,
      status: "scheduled",
    } as Appointment;
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async getAppointmentsByQuote(quoteId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.quoteId === quoteId,
    );
  }
}

export const storage = new MemStorage();
