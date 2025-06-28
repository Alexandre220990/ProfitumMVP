import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ================================
// ✅ TABLE USERS (Déjà existante)
// ================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  type: text("type", { enum: ["client", "partner"] }).notNull(),
  companyName: text("company_name"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  siren: text("siren").check("siren_length", "length(siren) = 9"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ================================
// ✅ TABLE QUESTIONNAIRE RESPONSES (Ajoutée)
// ================================
export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  answers: jsonb("answers").notNull(), // Stockage des réponses sous format JSON
  createdAt: timestamp("created_at").defaultNow(),
});

// ================================
// ✅ TABLE REQUESTS (Déjà existante)
// ================================
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "quoted", "accepted", "rejected"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ================================
// ✅ TABLE QUOTES (Déjà existante)
// ================================
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id),
  partnerId: integer("partner_id").references(() => users.id),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ================================
// ✅ TABLE APPOINTMENTS (Déjà existante)
// ================================
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => quotes.id),
  datetime: timestamp("datetime").notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).notNull(),
});

// ================================
// ✅ SCHÉMAS ZOD
// ================================
export const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

export const createClientSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  confirmPassword: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// ✅ Schéma pour l'insertion des réponses du questionnaire
export const insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).pick({
  userId: true,
  answers: true,
});

// ✅ Schémas pour les autres tables
export const insertUserSchema = createInsertSchema(users).extend({
  email: z.string().email("L'email n'est pas valide"),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  companyName: z.string().min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
  phoneNumber: z.string().regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, "Le numéro de téléphone n'est pas valide"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  postalCode: z.string().regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
  siret: z.string().regex(/^\d{14}$/, "Le numéro SIRET doit contenir 14 chiffres").optional(),
});

export const insertRequestSchema = createInsertSchema(requests).pick({
  title: true,
  description: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).pick({
  requestId: true,
  amount: true,
  description: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  quoteId: true,
  datetime: true,
});

// ================================
// ✅ TYPES DRIZZLE ORM
// ================================
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertQuestionnaireResponse = z.infer<typeof insertQuestionnaireResponseSchema>;

export type User = typeof users.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
