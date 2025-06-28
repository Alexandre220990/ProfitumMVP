import { z } from "zod";

// Types d'utilisateur
export const UserType = z.enum(["client", "partner"]);
export type UserType = z.infer<typeof UserType>;

// Schéma de base pour l'utilisateur
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
  type: UserType,
  client: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
    company: z.string().nullable(),
    siren: z.string().nullable(),
    phone: z.string().nullable(),
    revenuAnnuel: z.number().nullable(),
    secteurActivite: z.string().nullable(),
    nombreEmployes: z.number().nullable(),
    ancienneteEntreprise: z.number().nullable(),
    besoinFinancement: z.boolean().nullable(),
    typeProjet: z.string().nullable(),
    dateSimulation: z.string().nullable(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    last_login: z.string().nullable(),
    preferences: z.record(z.any()).nullable()
  }).optional(),
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  siret: z.string().optional(),
  createdAt: z.string(),
});

// Types
export type User = z.infer<typeof userSchema>;

// Données mockées initiales
export const mockUsers: User[] = [
  {
    id: 1,
    username: "profitum",
    password: "c67fd61258d3d0d103f48680858383143ad949e6349b6111b06276c37f966051.5eb15c5e86e2d2e19ad68858e2de1ccb", // Hashé pour "Profitum"
    email: "profitum@client.fr",
    type: "client",
    client: {
      id: 1,
      email: "profitum@client.fr",
      name: "Profitum",
      company: "Profitum Client",
      siren: "123456789",
      phone: "0123456789",
      revenuAnnuel: 1000000,
      secteurActivite: "Technology",
      nombreEmployes: 50,
      ancienneteEntreprise: 5,
      besoinFinancement: true,
      typeProjet: "Expansion",
      dateSimulation: new Date().toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      last_login: new Date().toISOString(),
      preferences: null
    },
    companyName: "Profitum Client",
    phoneNumber: "0123456789",
    address: "123 Client Street",
    city: "Paris",
    postalCode: "75000",
    createdAt: new Date().toISOString(),
  }
];

// Autres données mockées nécessaires pour l'application
export const mockRequests: [] = [];
export const mockQuotes: [] = [];
export const mockAppointments: [] = [];
export const mockQuestionnaireResponses: [] = [];

export const requestSchema = z.object({
  id: z.number(),
  clientId: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["pending", "quoted", "accepted", "rejected"]),
  createdAt: z.string(),
});

export const quoteSchema = z.object({
  id: z.number(),
  requestId: z.number(),
  partnerId: z.number(),
  amount: z.number(),
  description: z.string(),
  status: z.enum(["pending", "accepted", "rejected"]),
  createdAt: z.string(),
});

export const appointmentSchema = z.object({
  id: z.number(),
  quoteId: z.number(),
  datetime: z.string(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

export const questionnaireResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  answers: z.array(z.string()),
  createdAt: z.string(),
});

export type Request = z.infer<typeof requestSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type QuestionnaireResponse = z.infer<typeof questionnaireResponseSchema>;