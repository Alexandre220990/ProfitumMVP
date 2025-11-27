import { 
  Code, 
  Zap, 
  Scale, 
  Receipt, 
  Users
} from "lucide-react";

// Mapping des produits vers les catégories
export const PRODUCT_TO_CATEGORY: Record<string, string> = {
  'ticpe': 'optimisation-energetique',
  'optimisation-fournisseur-electricite': 'optimisation-energetique',
  'optimisation-fournisseur-gaz': 'optimisation-energetique',
  'optimisation-energie': 'optimisation-energetique',
  'recouvrement': 'services-juridiques-recouvrement',
  'urssaf': 'optimisation-sociale',
  'dfs': 'optimisation-sociale',
  'msa': 'optimisation-sociale',
  'foncier': 'optimisation-fiscale',
  'cir': 'optimisation-fiscale',
  'cei-cii-jei': 'optimisation-fiscale',
  'logiciel-solid': 'logiciels-outils-numeriques',
  'chronotachygraphes': 'logiciels-outils-numeriques'
};

// Définition des catégories principales - Structure exacte selon la base de données
export const CATEGORIES = [
  {
    id: "logiciels-outils-numeriques",
    title: "Logiciels et Outils Numériques",
    description: "Optimisez votre gestion avec nos solutions logicielles et outils numériques dédiés.",
    icon: Code,
    color: "indigo",
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50",
    borderColor: "border-indigo-200",
    hoverBorderColor: "hover:border-indigo-300",
    valueProposition: "Transformez votre gestion quotidienne avec des outils numériques performants et adaptés à vos besoins spécifiques.",
    products: [
      {
        id: "logiciel-solid",
        name: "Logiciel Solid",
        description: "SOLID, spécialiste des données sociales. La gestion des temps d'activités des conducteurs, de l'archivage légal à la prépaie.",
        solutionPath: null
      },
      {
        id: "chronotachygraphes",
        name: "Chronotachygraphes digitaux",
        description: "Chronotachygraphes digitaux pour pilotage en temps réel et simplifié des démarches administratives liées aux remboursement de la TICPE.",
        solutionPath: null
      }
    ]
  },
  {
    id: "optimisation-energetique",
    title: "Optimisation Énergétique",
    description: "Réduisez vos coûts énergétiques et optimisez votre consommation.",
    icon: Zap,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50",
    borderColor: "border-green-200",
    hoverBorderColor: "hover:border-green-300",
    valueProposition: "Optimisez votre consommation énergétique et réduisez vos factures grâce à nos solutions d'accompagnement personnalisées.",
    products: [
      {
        id: "ticpe",
        name: "TICPE",
        description: "Remboursement de la Taxe Intérieure de Consommation sur les Produits Énergétiques.",
        solutionPath: "/solutions/ticpe"
      },
      {
        id: "optimisation-fournisseur-electricite",
        name: "Optimisation fournisseur électricité",
        description: "Renégociation complète de vos contrats d'électricité.",
        solutionPath: null
      },
      {
        id: "optimisation-fournisseur-gaz",
        name: "Optimisation fournisseur gaz",
        description: "Optimisation de vos contrats de gaz naturel.",
        solutionPath: null
      },
      {
        id: "optimisation-energie",
        name: "Optimisation Énergie",
        description: "Optimisation des contrats d'électricité et de gaz.",
        solutionPath: "/solutions/energie"
      }
    ]
  },
  {
    id: "services-juridiques-recouvrement",
    title: "Services Juridiques et Recouvrement",
    description: "Sécurisez vos droits et récupérez vos créances avec nos experts.",
    icon: Scale,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200",
    hoverBorderColor: "hover:border-emerald-300",
    valueProposition: "Protégez vos intérêts et récupérez ce qui vous est dû grâce à notre expertise juridique et notre accompagnement en recouvrement.",
    products: [
      {
        id: "recouvrement",
        name: "Recouvrement",
        description: "Avocat spécialisé en recouvrement d'impayés.",
        solutionPath: null
      }
    ]
  },
  {
    id: "optimisation-fiscale",
    title: "Optimisation Fiscale",
    description: "Maximisez vos économies fiscales avec nos solutions d'optimisation.",
    icon: Receipt,
    color: "yellow",
    gradient: "from-yellow-500 to-orange-500",
    bgGradient: "from-yellow-50 to-orange-50",
    borderColor: "border-yellow-200",
    hoverBorderColor: "hover:border-yellow-300",
    valueProposition: "Optimisez votre fiscalité et réduisez vos impôts grâce à notre expertise en crédits d'impôt et déductions fiscales.",
    products: [
      {
        id: "cir",
        name: "CIR",
        description: "Valorisez vos innovations avec le Crédit Impôt Recherche et boostez votre trésorerie.",
        solutionPath: "/solutions/cir"
      },
      {
        id: "cei-cii-jei",
        name: "CEI, CII, JEI",
        description: "Optimisez votre fiscalité avec les dispositifs CEI, CII et JEI pour les entreprises innovantes.",
        solutionPath: "/solutions/cei-cii-jei"
      },
      {
        id: "foncier",
        name: "FONCIER",
        description: "Optimisation Fiscalité Foncière.",
        solutionPath: "/solutions/foncier"
      }
    ]
  },
  {
    id: "optimisation-sociale",
    title: "Optimisation Sociale",
    description: "Optimisez vos charges sociales et réduisez vos coûts.",
    icon: Users,
    color: "purple",
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-50 to-violet-50",
    borderColor: "border-purple-200",
    hoverBorderColor: "hover:border-purple-300",
    valueProposition: "Réduisez vos charges sociales et optimisez vos cotisations grâce à notre expertise en optimisation sociale.",
    products: [
      {
        id: "urssaf",
        name: "URSSAF",
        description: "Optimisation de Charges Sociales.",
        solutionPath: "/solutions/urssaf"
      },
      {
        id: "dfs",
        name: "DFS",
        description: "Déduction Forfaitaire Spécifique.",
        solutionPath: "/solutions/dfs"
      },
      {
        id: "msa",
        name: "MSA",
        description: "Optimisation Charges MSA.",
        solutionPath: null
      }
    ]
  }
];

// Fonction utilitaire pour obtenir une catégorie par son ID
export const getCategoryById = (id: string) => {
  return CATEGORIES.find(cat => cat.id === id);
};

// Fonction utilitaire pour obtenir les produits d'une catégorie
export const getProductsByCategory = (categoryId: string) => {
  const category = getCategoryById(categoryId);
  return category?.products || [];
};
