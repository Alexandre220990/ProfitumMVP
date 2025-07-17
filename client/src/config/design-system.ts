// ============================================================================
// DESIGN SYSTEM CONFIGURATION - FinancialTracker
// Basé sur le style existant de la home page
// ============================================================================

export const DESIGN_SYSTEM = {
  // ============================================================================
  // COULEURS
  // ============================================================================
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    secondary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },

  // ============================================================================
  // TYPOGRAPHIE
  // ============================================================================
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Cascadia Code', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
    },
    fontWeight: {
      light: '200',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },

  // ============================================================================
  // ESPACEMENT
  // ============================================================================
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
    '5xl': '8rem',
  },

  // ============================================================================
  // RAYONS DE BORDURE
  // ============================================================================
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // ============================================================================
  // OMBRES
  // ============================================================================
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // ============================================================================
  // TRANSITIONS
  // ============================================================================
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  // ============================================================================
  // Z-INDEX
  // ============================================================================
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
} as const;

// ============================================================================
// GRADIENTS PRÉDÉFINIS
// ============================================================================
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  secondary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  success: 'linear-gradient(135deg, #10b981, #059669)',
  error: 'linear-gradient(135deg, #ef4444, #dc2626)',
  warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
  dark: 'linear-gradient(135deg, #0f172a, #1e293b)',
  light: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
  glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
} as const;

// ============================================================================
// CLASSES CSS UTILITAIRES
// ============================================================================
export const CSS_CLASSES = {
  // Boutons
  button: {
    base: 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 cursor-pointer border-none outline-none',
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white',
    error: 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white',
  },

  // Cartes
  card: {
    base: 'bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 overflow-hidden',
    hover: 'hover:shadow-lg hover:-translate-y-1',
    glass: 'bg-white/80 backdrop-blur-sm border border-slate-200/50',
    dark: 'bg-slate-900 border-slate-700 text-white',
  },

  // Badges
  badge: {
    base: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
    primary: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
  },

  // Inputs
  input: {
    base: 'w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
    disabled: 'opacity-50 cursor-not-allowed',
  },

  // Animations
  animation: {
    fadeIn: 'animate-fade-in',
    slideIn: 'animate-slide-in',
    scaleIn: 'animate-scale-in',
    float: 'animate-float',
    pulse: 'animate-pulse',
    gradient: 'animate-gradient',
  },

  // Effets
  effects: {
    hoverLift: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
    hoverGlow: 'transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25',
    backdropBlur: 'backdrop-blur-sm',
  },
} as const;

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================
export type ColorScale = keyof typeof DESIGN_SYSTEM.colors.primary;
export type ColorName = keyof typeof DESIGN_SYSTEM.colors;
export type GradientName = keyof typeof GRADIENTS;
export type ButtonVariant = keyof typeof CSS_CLASSES.button;
export type CardVariant = keyof typeof CSS_CLASSES.card;
export type BadgeVariant = keyof typeof CSS_CLASSES.badge;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================
export const getColor = (colorName: ColorName, scale: ColorScale = '500') => {
  return DESIGN_SYSTEM.colors[colorName][scale];
};

export const getGradient = (gradientName: GradientName) => {
  return GRADIENTS[gradientName];
};

export const getButtonClass = (variant: ButtonVariant = 'primary') => {
  return `${CSS_CLASSES.button.base} ${CSS_CLASSES.button[variant]}`;
};

export const getCardClass = (variant: CardVariant = 'base') => {
  return `${CSS_CLASSES.card.base} ${CSS_CLASSES.card[variant]}`;
};

export const getBadgeClass = (variant: BadgeVariant = 'primary') => {
  return `${CSS_CLASSES.badge.base} ${CSS_CLASSES.badge[variant]}`;
};

export const getInputClass = (hasError = false, isDisabled = false) => {
  let classes = CSS_CLASSES.input.base;
  if (hasError) classes += ` ${CSS_CLASSES.input.error}`;
  if (isDisabled) classes += ` ${CSS_CLASSES.input.disabled}`;
  return classes;
};

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================
export default DESIGN_SYSTEM; 