import { z } from "zod";

// Types d'utilisateur
export const UserType = z.enum(["client", "partner"]);
export type UserType = z.infer<typeof UserType>;

// Schémas de base
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

// Types
export type User = z.infer<typeof userSchema>;
export type Request = z.infer<typeof requestSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type QuestionnaireResponse = z.infer<typeof questionnaireResponseSchema>;

// Données mockées
export const mockUsers: User[] = [
  {
    id: 1,
    username: "client1",
    password: "hashedPassword123",
    email: "client1@example.com",
    type: "client",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: "partner1",
    password: "hashedPassword456",
    email: "partner1@example.com",
    type: "partner",
    companyName: "Expert Services",
    siret: "12345678901234",
    createdAt: new Date().toISOString(),
  },
];

export const mockRequests: Request[] = [
  {
    id: 1,
    clientId: 1,
    title: "Besoin d'une expertise en plomberie",
    description: "Fuite d'eau dans la salle de bain",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

export const mockQuotes: Quote[] = [
  {
    id: 1,
    requestId: 1,
    partnerId: 2,
    amount: 150,
    description: "Réparation de la fuite et vérification du système",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 1,
    quoteId: 1,
    datetime: new Date().toISOString(),
    status: "scheduled",
  },
];

export const mockQuestionnaireResponses: QuestionnaireResponse[] = [
  {
    id: 1,
    userId: 1,
    answers: ["Réponse 1", "Réponse 2", "Réponse 3"],
    createdAt: new Date().toISOString(),
  },
];
