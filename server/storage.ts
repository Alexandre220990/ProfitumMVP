import session from "express-session";
import MemoryStore from "memorystore";
import { type User } from "@shared/schema";

const MemorySessionStore = MemoryStore(session);

// Utilisateurs de test pré-configurés
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
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;
  sessionStore: session.Store;
}

class MemoryStorage implements IStorage {
  private users: User[] = [...testUsers]; // Initialisation avec les utilisateurs de test
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
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }
}

export const storage = new MemoryStorage();