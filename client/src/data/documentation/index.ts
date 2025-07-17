import { README_DOC } from "./README";
import { SECURITY_DOC } from "./SECURITY";
import { ISO_ACTION_PLAN_DOC } from "./ISO_ACTION_PLAN";
import { ISO_COMPLIANCE_CHECKLIST_DOC } from "./ISO_COMPLIANCE_CHECKLIST";
import { ISO_FINAL_REPORT_DOC } from "./ISO_FINAL_REPORT";
import { ISO_IMPLEMENTATION_REPORT_DOC } from "./ISO_IMPLEMENTATION_REPORT";
import { GUIDE_HEBERGEMENT_DOC } from "./GUIDE_HEBERGEMENT";
import { OPTIMIZATION_REPORT_DOC } from "./OPTIMIZATION_REPORT";
import { OPERATIONAL_PROCEDURES_DOC } from "./OPERATIONAL_PROCEDURES";
import { GUIDE_ADMIN_DOC } from "./GUIDE_ADMIN";
import { GUIDE_CLIENT_DOC } from "./GUIDE_CLIENT";
import { GUIDE_EXPERT_DOC } from "./GUIDE_EXPERT";
import { GED_IMPLEMENTATION_DOC } from "./GED_IMPLEMENTATION";
import { DATABASE_DOCUMENTATION_DOC } from "./DATABASE_DOCUMENTATION";
import { API_DOCUMENTATION_DOC } from "./API_DOCUMENTATION";
import { ARCHITECTURE_DOCUMENTATION_DOC } from "./ARCHITECTURE_DOCUMENTATION";
import { DEVELOPER_QUICKSTART_DOC } from "./DEVELOPER_QUICKSTART";
import { MAINTENANCE_GUIDE_DOC } from "./MAINTENANCE_GUIDE";

// Documentation métier (fonctionnelle)
export const BUSINESS_DOCUMENTATION = [
  GUIDE_ADMIN_DOC,
  GUIDE_CLIENT_DOC,
  GUIDE_EXPERT_DOC
];

// Documentation technique
export const TECHNICAL_DOCUMENTATION = [
  README_DOC,
  SECURITY_DOC,
  ISO_ACTION_PLAN_DOC,
  ISO_COMPLIANCE_CHECKLIST_DOC,
  ISO_FINAL_REPORT_DOC,
  ISO_IMPLEMENTATION_REPORT_DOC,
  GUIDE_HEBERGEMENT_DOC,
  OPTIMIZATION_REPORT_DOC,
  OPERATIONAL_PROCEDURES_DOC,
  GED_IMPLEMENTATION_DOC,
  DATABASE_DOCUMENTATION_DOC,
  API_DOCUMENTATION_DOC,
  ARCHITECTURE_DOCUMENTATION_DOC,
  DEVELOPER_QUICKSTART_DOC,
  MAINTENANCE_GUIDE_DOC
];

// Toutes les documentations combinées
export const DOCUMENTATION_DATA = [
  ...BUSINESS_DOCUMENTATION,
  ...TECHNICAL_DOCUMENTATION
];

// Nouvelles catégories organisées
export const DOCUMENTATION_CATEGORIES = [
  { id: 'business, ', name: 'Documentation métier, ', description: 'Guides fonctionnels pour chaque profil utilisateur, ', icon: '👥' },
  { id: 'technical, ', name: 'Documentation technique, ', description: 'Documentation technique et architecture, ', icon: '⚙️' }
];

// Anciennes catégories pour compatibilité
export const OLD_DOCUMENTATION_CATEGORIES = [
  { id: 'guides, ', name: 'Guides, ', description: 'Guides d\'utilisation et procédures, ', icon: '📚' },
  { id: 'security, ', name: 'Sécurité, ', description: 'Documentation sécurité et conformité, ', icon: '🔒' },
  { id: 'iso, ', name: 'ISO 27001, ', description: 'Rapports et checklists ISO, ', icon: '📋' },
  { id: 'performance, ', name: 'Performance, ', description: 'Rapports d\'optimisation et métriques, ', icon: '⚡' }
];

export const getDocumentsByCategory = (category: string) => { if (category === 'business') {
    return BUSINESS_DOCUMENTATION; } else if (category === 'technical') { return TECHNICAL_DOCUMENTATION; }
  return DOCUMENTATION_DATA.filter(doc => doc.category === category);
};

export const getDocumentById = (id: string) => { return DOCUMENTATION_DATA.find(doc => doc.id === id) };

export const searchDocuments = (query: string) => { const lowercaseQuery = query.toLowerCase();
  return DOCUMENTATION_DATA.filter(doc => 
    doc.title.toLowerCase().includes(lowercaseQuery) ||
    doc.description.toLowerCase().includes(lowercaseQuery) ||
    doc.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  ) };

export { GUIDE_TESTS_DOC } from './GUIDE_TESTS';
// Ajouter ici les autres exports (SECURITY_DOC, ISO_DOC, etc.) 