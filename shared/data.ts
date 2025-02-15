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
    username: "client1",
    password: "hashedPassword123",
    email: "client1@example.com",
    type: "client",
    companyName: "Client Company",
    phoneNumber: "0123456789",
    address: "123 Client Street",
    city: "Client City",
    postalCode: "12345",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: "partner1",
    password: "hashedPassword456",
    email: "partner1@example.com",
    type: "partner",
    companyName: "Partner Company",
    siret: "12345678901234",
    phoneNumber: "9876543210",
    address: "456 Partner Avenue",
    city: "Partner City",
    postalCode: "54321",
    createdAt: new Date().toISOString(),
  },
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