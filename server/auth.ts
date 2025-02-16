import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { type User } from "@shared/schema";

declare global {
  namespace Express {
    // Extend the User interface without causing une référence récursive
    interface User {
      id: number;
      username: string;
      email: string;
      type: "client" | "partner";
      companyName: string | null;
      phoneNumber: string | null;
      address: string | null;
      city: string | null;
      postalCode: string | null;
      siret: string | null;
      createdAt: Date;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  console.log("Setting up authentication...");

  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set");
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax"
      },
      name: "session"
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      async (email, password, done) => {
        try {
          console.log("Tentative de connexion pour:", email);
          const user = await storage.getUserByEmail(email);
          if (!user) {
            console.log("Utilisateur non trouvé:", email);
            return done(null, false);
          }

          const isPasswordValid = await comparePasswords(password, user.password);
          if (!isPasswordValid) {
            console.log("Mot de passe invalide pour:", email);
            return done(null, false);
          }

          const { password: _, ...userWithoutPassword } = user;
          console.log("Connexion réussie pour:", email);
          return done(null, userWithoutPassword);
        } catch (error) {
          console.error("Erreur de connexion:", error);
          return done(error);
        }
      }
    )
  );

  // Correction de la signature de serializeUser
  passport.serializeUser((user: Express.User, done) => {
    console.log("Sérialisation de l'utilisateur:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Désérialisation de l'utilisateur:", id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log("Utilisateur non trouvé lors de la désérialisation:", id);
        return done(null, false);
      }
      const { password, ...userWithoutPassword } = user;
      console.log("Utilisateur désérialisé avec succès:", userWithoutPassword.email);
      done(null, userWithoutPassword);
    } catch (error) {
      console.error("Erreur lors de la désérialisation:", error);
      done(error);
    }
  });

  // Routes d'authentification
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Tentative d'inscription:", req.body.email);

      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        console.log("Email déjà utilisé:", req.body.email);
        return res.status(400).json({ message: "Cette adresse email est déjà utilisée" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      console.log("Inscription réussie pour:", user.email);

      req.login(user, (err) => {
        if (err) {
          console.error("Erreur lors de la connexion après inscription:", err);
          return next(err);
        }
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: false | User, info: any) => {
      if (err) {
        console.error("Erreur d'authentification:", err);
        return next(err);
      }
      if (!user) {
        console.log("Échec de la connexion:", info);
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Erreur lors de la connexion:", err);
          return next(err);
        }
        const { password, ...userWithoutPassword } = user;
        console.log("Connexion réussie pour:", user.email);
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const userEmail = req.user?.email;
    console.log("Déconnexion de l'utilisateur:", userEmail);
    req.logout((err) => {
      if (err) {
        console.error("Erreur lors de la déconnexion:", err);
        return next(err);
      }
      console.log("Déconnexion réussie pour:", userEmail);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Tentative d'accès non authentifiée à /api/user");
      return res.sendStatus(401);
    }
    console.log("Données utilisateur envoyées pour:", req.user?.email);
    res.json(req.user);
  });
}