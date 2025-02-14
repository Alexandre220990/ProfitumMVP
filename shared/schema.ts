import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  type: text("type", { enum: ["client", "partner"] }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "quoted", "accepted", "rejected"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id),
  partnerId: integer("partner_id").references(() => users.id),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => quotes.id),
  datetime: timestamp("datetime").notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  type: true,
  name: true,
  email: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type User = typeof users.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
