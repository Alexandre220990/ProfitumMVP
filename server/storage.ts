import session from "express-session";
import MemoryStore from "memorystore";
import {
  type User,
  type Request,
  type Quote,
  type Appointment,
  type InsertUser,
  mockUsers,
  mockRequests,
  mockQuotes,
  mockAppointments,
  mockQuestionnaireResponses,
} from "@shared/data";

const MemorySessionStore = MemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;

  // Requests
  createRequest(request: Omit<Request, "id" | "status" | "createdAt">): Promise<Request>;
  getRequestById(id: number): Promise<Request | undefined>;
  getRequestsByClient(clientId: number): Promise<Request[]>;
  getRequestsForPartners(): Promise<Request[]>;

  // Quotes
  createQuote(quote: Omit<Quote, "id" | "status" | "createdAt">): Promise<Quote>;
  getQuotesByRequest(requestId: number): Promise<Quote[]>;
  getQuotesByPartner(partnerId: number): Promise<Quote[]>;
  updateQuoteStatus(id: number, status: Quote["status"]): Promise<Quote>;

  // Appointments
  createAppointment(appointment: Omit<Appointment, "id" | "status">): Promise<Appointment>;
  getAppointmentsByQuote(quoteId: number): Promise<Appointment[]>;

  sessionStore: session.Store;
}

class MemoryStorage implements IStorage {
  private users: User[] = [...mockUsers];
  private requests: Request[] = [...mockRequests];
  private quotes: Quote[] = [...mockQuotes];
  private appointments: Appointment[] = [...mockAppointments];
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000 // 24 heures
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser = {
      ...user,
      id: this.users.length + 1,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  // Requests
  async createRequest(request: Omit<Request, "id" | "status" | "createdAt">): Promise<Request> {
    const newRequest = {
      ...request,
      id: this.requests.length + 1,
      status: "pending",
      createdAt: new Date().toISOString(),
    } as Request;
    this.requests.push(newRequest);
    return newRequest;
  }

  async getRequestById(id: number): Promise<Request | undefined> {
    return this.requests.find(r => r.id === id);
  }

  async getRequestsByClient(clientId: number): Promise<Request[]> {
    return this.requests.filter(r => r.clientId === clientId);
  }

  async getRequestsForPartners(): Promise<Request[]> {
    return this.requests.filter(r => r.status === "pending");
  }

  // Quotes
  async createQuote(quote: Omit<Quote, "id" | "status" | "createdAt">): Promise<Quote> {
    const newQuote = {
      ...quote,
      id: this.quotes.length + 1,
      status: "pending",
      createdAt: new Date().toISOString(),
    } as Quote;
    this.quotes.push(newQuote);
    return newQuote;
  }

  async getQuotesByRequest(requestId: number): Promise<Quote[]> {
    return this.quotes.filter(q => q.requestId === requestId);
  }

  async getQuotesByPartner(partnerId: number): Promise<Quote[]> {
    return this.quotes.filter(q => q.partnerId === partnerId);
  }

  async updateQuoteStatus(id: number, status: Quote["status"]): Promise<Quote> {
    const quote = this.quotes.find(q => q.id === id);
    if (!quote) throw new Error("Quote not found");
    quote.status = status;
    return quote;
  }

  // Appointments
  async createAppointment(appointment: Omit<Appointment, "id" | "status">): Promise<Appointment> {
    const newAppointment = {
      ...appointment,
      id: this.appointments.length + 1,
      status: "scheduled",
    } as Appointment;
    this.appointments.push(newAppointment);
    return newAppointment;
  }

  async getAppointmentsByQuote(quoteId: number): Promise<Appointment[]> {
    return this.appointments.filter(a => a.quoteId === quoteId);
  }
}

export const storage = new MemoryStorage();