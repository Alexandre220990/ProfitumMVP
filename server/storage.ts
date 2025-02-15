import session from "express-session";
import MemoryStore from "memorystore";
import {
  type User,
} from "@shared/data";

const MemorySessionStore = MemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;
  sessionStore: session.Store;
}

class MemoryStorage implements IStorage {
  private users: User[] = [];
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
}

export const storage = new MemoryStorage();