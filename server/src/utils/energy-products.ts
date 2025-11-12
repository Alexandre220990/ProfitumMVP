import type { SupabaseClient } from '@supabase/supabase-js';

type EnergyVariant = 'electricite' | 'gaz';

interface EnergyVariantConfig {
  label: string;
  matchers: string[];
  productName: string;
}

interface NormalizedEnergyVariant {
  hasInvoices: boolean;
  monthlyAmount: number | null;
}

export interface NormalizedEnergyAnswer {
  electricite: NormalizedEnergyVariant;
  gaz: NormalizedEnergyVariant;
}

const ENERGY_VARIANTS: Record<EnergyVariant, EnergyVariantConfig> = {
  electricite: {
    label: "d'électricité",
    matchers: ['électricité', 'electricite', 'elec'],
    productName: 'Optimisation fournisseur électricité'
  },
  gaz: {
    label: 'de gaz',
    matchers: ['gaz'],
    productName: 'Optimisation fournisseur gaz'
  }
};

const energyProductCache: Partial<
  Record<EnergyVariant, { id: string; nom: string; type_produit?: string | null; notes_affichage?: string | null }>
> = {};

const DEFAULT_ENERGY_ANSWER: NormalizedEnergyAnswer = {
  electricite: { hasInvoices: false, monthlyAmount: null },
  gaz: { hasInvoices: false, monthlyAmount: null }
};

function parseMoneyValue(raw: any): number | null {
  if (raw === undefined || raw === null) {
    return null;
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === 'string') {
    const sanitized = raw
      .replace(/€/g, '')
      .replace(/\s/g, '')
      .replace(',', '.');

    const parsed = Number.parseFloat(sanitized);
    if (Number.isNaN(parsed)) {
      return null;
    }
    return parsed;
  }

  return null;
}

function isTruthy(raw: any): boolean {
  if (typeof raw === 'boolean') {
    return raw;
  }
  if (typeof raw === 'number') {
    return raw > 0;
  }
  if (typeof raw === 'string') {
    const value = raw.trim().toLowerCase();
    return ['oui', 'true', '1', 'yes', 'y'].includes(value);
  }
  return false;
}

function normalizeCompositeStructure(raw: any): NormalizedEnergyAnswer {
  if (!raw || typeof raw !== 'object') {
    return {
      electricite: { ...DEFAULT_ENERGY_ANSWER.electricite },
      gaz: { ...DEFAULT_ENERGY_ANSWER.gaz }
    };
  }

  const normalized: NormalizedEnergyAnswer = {
    electricite: { ...DEFAULT_ENERGY_ANSWER.electricite },
    gaz: { ...DEFAULT_ENERGY_ANSWER.gaz }
  };

  (Object.keys(ENERGY_VARIANTS) as EnergyVariant[]).forEach((variant) => {
    const segment = raw[variant] || raw[variant.toUpperCase()] || {};
    const hasInvoices =
      isTruthy(segment.hasInvoices) ||
      isTruthy(segment.has_factures) ||
      isTruthy(segment.hasContracts) ||
      isTruthy(segment.oui) ||
      isTruthy(segment.active);

    const monthlyAmount =
      parseMoneyValue(segment.monthlyAmount) ??
      parseMoneyValue(segment.montant) ??
      parseMoneyValue(segment.amount) ??
      parseMoneyValue(segment.value);

    normalized[variant] = {
      hasInvoices: hasInvoices || (!!monthlyAmount && monthlyAmount > 0),
      monthlyAmount: monthlyAmount && monthlyAmount > 0 ? monthlyAmount : null
    };
  });

  return normalized;
}

export function normalizeEnergyAnswer(
  answers: Record<string, any> | null | undefined
): NormalizedEnergyAnswer {
  let normalized: NormalizedEnergyAnswer = {
    electricite: { ...DEFAULT_ENERGY_ANSWER.electricite },
    gaz: { ...DEFAULT_ENERGY_ANSWER.gaz }
  };

  if (!answers || typeof answers !== 'object') {
    return normalized;
  }

  const compositeRaw =
    answers.CALCUL_ENERGIE_FACTURES ??
    answers.ENERGIE_COMPOSITE ??
    answers.ENERGIE_FACTURES;

  if (compositeRaw && typeof compositeRaw === 'object') {
    normalized = normalizeCompositeStructure(compositeRaw);
  }

  const applyVariant = (
    variant: EnergyVariant,
    flagValue: any,
    amountValue: any
  ) => {
    if (flagValue !== undefined && flagValue !== null) {
      const truthy = isTruthy(flagValue);
      normalized[variant].hasInvoices = truthy;
      if (!truthy) {
        normalized[variant].monthlyAmount = null;
      }
    }

    const parsedAmount = parseMoneyValue(amountValue);
    if (parsedAmount !== null) {
      if (parsedAmount > 0) {
        normalized[variant].monthlyAmount = parsedAmount;
        normalized[variant].hasInvoices = true;
      } else if (parsedAmount === 0 && normalized[variant].hasInvoices) {
        normalized[variant].monthlyAmount = 0;
      }
    }
  };

  applyVariant(
    'gaz',
    answers.ENERGIE_GAZ_FACTURES ?? answers.general_energie_gaz,
    answers.ENERGIE_GAZ_MONTANT ?? answers.energie_gaz_montant
  );
  applyVariant(
    'electricite',
    answers.ENERGIE_ELEC_FACTURES ?? answers.general_energie_elec,
    answers.ENERGIE_ELEC_MONTANT ?? answers.energie_elec_montant
  );

  return normalized;
}

async function getEnergyProduct(
  client: SupabaseClient,
  variant: EnergyVariant
): Promise<{ id: string; nom: string; type_produit?: string | null; notes_affichage?: string | null } | null> {
  if (energyProductCache[variant]) {
    return energyProductCache[variant]!;
  }

  const config = ENERGY_VARIANTS[variant];
  const matchers = config.matchers.map((matcher) => `%${matcher}%`);

  let product = null;
  for (const matcher of matchers) {
    const { data, error } = await client
      .from('ProduitEligible')
      .select('id, nom, type_produit, notes_affichage')
      .ilike('nom', matcher)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.warn(`⚠️ Impossible de récupérer le produit énergie (${variant}):`, error.message);
      continue;
    }

    if (data) {
      product = data;
      break;
    }
  }

  if (!product) {
    console.warn(`⚠️ Produit énergie introuvable pour le variant "${variant}".`);
    return null;
  }

  energyProductCache[variant] = product;
  return product;
}

export async function mergeEnergyOverrides(
  client: SupabaseClient,
  results: any,
  answersByQuestionId: Record<string, any> | undefined | null
): Promise<void> {
  if (!results) {
    return;
  }

  const currentProducts: any[] = Array.isArray(results.produits) ? results.produits : [];

  const filteredProducts = currentProducts.filter((product) => {
    const name = (product?.produit_nom || product?.nom || '').toString().toLowerCase();
    if (!name) {
      return true;
    }

    if (name.includes('fournisseur') && (name.includes('electric') || name.includes('électric') || name.includes('gaz'))) {
      return false;
    }

    if (name.includes('energie') || name.includes('énergie')) {
      return false;
    }

    return true;
  });

  const normalizedAnswer = normalizeEnergyAnswer(answersByQuestionId || {});
  const energyProductsToAdd: any[] = [];

  for (const variant of Object.keys(ENERGY_VARIANTS) as EnergyVariant[]) {
    const variantData = normalizedAnswer[variant];
    if (!variantData.hasInvoices || !variantData.monthlyAmount || variantData.monthlyAmount <= 0) {
      continue;
    }

    const product = await getEnergyProduct(client, variant);
    if (!product) {
      continue;
    }

    const config = ENERGY_VARIANTS[variant];
    const annualBase = variantData.monthlyAmount * 12;
    const estimatedSavings = Math.round(annualBase * 0.2);

    energyProductsToAdd.push({
      produit_id: product.id,
      produit_nom: product.nom || config.productName,
      montant_estime: estimatedSavings,
      is_eligible: true,
      type_produit: product.type_produit || 'financier',
      notes:
        product.notes_affichage ||
        `Estimation de 20% d'économies sur vos factures ${config.label} (base: ${variantData.monthlyAmount.toLocaleString('fr-FR')}€/mois).`,
      calcul_details: {
        source: 'energy_split_question',
        variant,
        monthly_amount: variantData.monthlyAmount,
        annual_reference: annualBase,
        assumed_savings_rate: 0.2
      }
    });
  }

  results.produits = [...filteredProducts, ...energyProductsToAdd];

  const totalEligible = results.produits.filter((product: any) => product.is_eligible !== false).length;
  const totalSavings = results.produits.reduce((sum: number, product: any) => {
    const value = Number(product?.montant_estime) || 0;
    return sum + value;
  }, 0);

  results.total_eligible = totalEligible;
  results.total_savings = totalSavings;
  results.total_potential_savings = totalSavings;

  if (energyProductsToAdd.length > 0) {
    results.energy_overrides = {
      ...(results.energy_overrides || {}),
      variants: energyProductsToAdd.map((product) => product.calcul_details?.variant),
      generated_at: new Date().toISOString()
    };
  }
}


