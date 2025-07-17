// ============================================================================
// DESIGN SYSTEM - EXPORTS PRINCIPAUX
// ============================================================================

// Composants de base
export { 
  default as Button, 
  ButtonWithIcon, 
  LoadingButton, 
  SubmitButton, 
  CancelButton, 
  DeleteButton, 
  SuccessButton 
} from './Button';

export { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  ImageCard, 
  IconCard, 
  StatCard, 
  NavigationCard 
} from './Card';

export { 
  default as Badge, 
  BadgeWithIcon, 
  StatusBadge, 
  NotificationBadge, 
  CategoryBadge, 
  PriorityBadge, 
  VersionBadge, 
  BadgeGroup 
} from './Badge';

// Nouveaux composants
export { 
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ConfirmModal,
  DeleteModal,
  SuccessModal
} from './Modal';

export { 
  Dropdown,
  DropdownMenu,
  DropdownItem,
  FilterDropdown,
  MultiSelectDropdown
} from './Dropdown';

// Configuration du design system
export { default as DESIGN_SYSTEM, GRADIENTS, CSS_CLASSES } from '@/config/design-system';

// Types
export type { ButtonVariant, CardVariant, BadgeVariant, ColorScale, ColorName, GradientName } from '@/config/design-system'; 