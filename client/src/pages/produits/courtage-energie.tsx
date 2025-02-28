```typescript
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileSignature,
  Check,
  UserCog,
  Calendar,
  Upload,
  Trash2,
  ArrowLeft,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCcw
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import HeaderClient from "@/components/HeaderClient";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useParams } from "wouter";

type StepStatus = "completed" | "current" | "upcoming";

type Expert = {
  id: number;
  name: string;
  company: string;
  speciality: string;
  experience: string;
  compensation: number;
  description: string;
};

const energyExperts: Expert[] = [
  {
    id: 1,
    name: "Marie Dupont",
    company: "EnergyConsult",
    speciality: "Expert Courtage Énergie",
    experience: "12 ans d'expertise",
    compensation: 25,
    description: "Spécialiste des audits énergétiques et de l'optimisation des coûts"
  },
  {
    id: 2,
    name: "Thomas Martin",
    company: "GreenOptim",
    speciality: "Courtier Énergie",
    experience: "8 ans d'expérience",
    compensation: 22,
    description: "Expert en négociation de contrats d'énergie pour les entreprises"
  }
];

type DocumentItem = {
  id: string;
  label: string;
  uploadedFiles: { id: number; name: string }[];
};

const documentsList: DocumentItem[] = [
  { id: "bills", label: "Factures d'énergie (12 derniers mois)", uploadedFiles: [] },
  { id: "contracts", label: "Contrats énergétiques actuels", uploadedFiles: [] },
  { id: "consumption", label: "Relevés de consommation", uploadedFiles: [] },
  { id: "meters", label: "Caractéristiques des compteurs", uploadedFiles: [] },
  { id: "site", label: "Plans des sites/bâtiments", uploadedFiles: [] },
  { id: "equipment", label: "Liste des équipements énergivores", uploadedFiles: [] },
  { id: "other", label: "Autre document", uploadedFiles: [] },
];

// [Suite du code identique à DFS avec changement du type d'audit]
// ... [Copier le reste du code de DFS en remplaçant les références à "dfs" par "energy"]
