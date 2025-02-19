import session from "express-session";
import MemoryStore from "memorystore";
import { type User } from "@shared/schema";

const MemorySessionStore = MemoryStore(session);

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
    id: 2,
    username: "Partenaire",
    email: "partenaire@gmail.com",
    password: "partenaire",
    type: "partner",
    companyName: "Partenaire Test SARL",
    phoneNumber: "0687654321",
    address: "456 Avenue Test",
    city: "Lyon",
    postalCode: "69000",
    siret: "12345678901234",
    createdAt: new Date(),
  }
];

export interface IStorage {
  // Gestion des utilisateurs
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;

  // Gestion des rapports clients
  saveClientReport(userId: number, report: any): Promise<void>;
  getClientReports(userId: number): Promise<any[]>;

  // Session
  sessionStore: session.Store;
}

class MemoryStorage implements IStorage {
  private users: User[] = [...testUsers]; // ✅ Stockage des utilisateurs
  private clientReports: Record<number, any[]> = {}; // ✅ Stockage des rapports clients
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000, // Nettoyage toutes les 24 heures
    });
  }

  // =======================================
  // ✅ Gestion des utilisateurs
  // =======================================
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
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  // =======================================
  // ✅ Gestion des rapports clients
  // =======================================
  async saveClientReport(userId: number, report: any): Promise<void> {
    if (!this.clientReports[userId]) {
      this.clientReports[userId] = [];
    }
    this.clientReports[userId].push(report);
  }

  async getClientReports(userId: number): Promise<any[]> {
    return this.clientReports[userId] || [];
  }
}

// ✅ Exportation de l'instance
export const storage = new MemoryStorage();
