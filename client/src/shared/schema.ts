import { z } from "zod";

export const createClientSchema = z.object({ username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"), email: z.string().email("Email invalide"), password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"), confirmPassword: z.string(), company_name: z.string().min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"), phone_number: z.string().min(10, "Numéro de téléphone invalide"), address: z.string().min(5, "Adresse invalide"), city: z.string().min(2, "Ville invalide"), postal_code: z.string().regex(/^\d{5 }$/, "Code postal invalide"),
  siren: z.string().regex(/^\d{ 9 }$/, "Numéro SIREN invalide"),
  type: z.literal("client")
}).refine((data) => data.password === data.confirmPassword, { message: "Les mots de passe ne correspondent pas", path: ["confirmPassword"] }); 