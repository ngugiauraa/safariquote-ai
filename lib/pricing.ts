export type PlanTier = 'starter' | 'professional' | 'enterprise';

export type PlanFeatures = {
  logoOnForm: boolean;
  contactDetailsOnForm: boolean;
  googleSheetsSync: boolean;
  customColorPalette: boolean;
  whiteLabelForm: boolean;
};

export type PricingPlan = {
  tier: PlanTier;
  name: string;
  price: string;
  period: string;
  monthlyPriceKes: number;
  setupFeeKes: number;
  initialChargeKes: number;
  currency: 'KES';
  description: string;
  idealFor: string;
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
  badge?: string;
  setupFee?: string;
  included: string[];
  excluded?: string[];
  features: PlanFeatures;
};

export const pricingPlans: PricingPlan[] = [
  {
    tier: 'starter',
    name: 'Starter',
    price: 'KSh 1,500',
    period: '/mo',
    monthlyPriceKes: 1500,
    setupFeeKes: 3000,
    initialChargeKes: 4500,
    currency: 'KES',
    description: 'Start taking safari requests online without custom branding.',
    idealFor: 'Best for operators validating demand and replacing WhatsApp back-and-forth.',
    ctaLabel: 'Start Starter',
    ctaHref: '/dashboard',
    setupFee: 'One-time setup fee: KSh 3,000',
    included: [
      'Unlimited quote requests',
      'Dashboard access',
      'Vehicle and hotel rate management',
      'SafariQuote branded public form',
    ],
    excluded: [
      'Company logo on the public form',
      'Company contact details on the public form',
      'Google Sheets syncing',
      'Custom brand colors',
    ],
    features: {
      logoOnForm: false,
      contactDetailsOnForm: false,
      googleSheetsSync: false,
      customColorPalette: false,
      whiteLabelForm: false,
    },
  },
  {
    tier: 'professional',
    name: 'Professional',
    price: 'KSh 2,500',
    period: '/mo',
    monthlyPriceKes: 2500,
    setupFeeKes: 3000,
    initialChargeKes: 5500,
    currency: 'KES',
    description: 'Give customers a branded quote experience that looks like your company.',
    idealFor: 'Best for growing operators who want a polished public-facing quote funnel.',
    ctaLabel: 'Start Professional',
    ctaHref: '/dashboard',
    featured: true,
    badge: 'BEST VALUE',
    setupFee: 'One-time setup fee: KSh 3,000',
    included: [
      'Everything in Starter',
      'Company logo on the public form',
      'Company contact details on the public form',
      'Google Sheets syncing',
    ],
    excluded: [
      'Custom brand colors',
      'White-label public form',
    ],
    features: {
      logoOnForm: true,
      contactDetailsOnForm: true,
      googleSheetsSync: true,
      customColorPalette: false,
      whiteLabelForm: false,
    },
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 'KSh 5,000',
    period: '/mo',
    monthlyPriceKes: 5000,
    setupFeeKes: 0,
    initialChargeKes: 5000,
    currency: 'KES',
    description: 'Run a more white-labeled quote experience with your own visual identity.',
    idealFor: 'Best for established operators who want their quote flow to feel fully in-house.',
    ctaLabel: 'Start Enterprise',
    ctaHref: '/dashboard',
    setupFee: 'Includes onboarding and advanced brand setup',
    included: [
      'Everything in Professional',
      'Custom accent color on the quote form',
      'Reduced SafariQuote branding on the public form',
      'Most white-labeled customer experience in this app',
    ],
    features: {
      logoOnForm: true,
      contactDetailsOnForm: true,
      googleSheetsSync: true,
      customColorPalette: true,
      whiteLabelForm: true,
    },
  },
];

export function getPlanConfig(planTier: string | null | undefined): PricingPlan {
  return pricingPlans.find((plan) => plan.tier === planTier) || pricingPlans[0];
}

export function sanitizePlanTier(planTier: string | null | undefined): PlanTier {
  const matchingPlan = pricingPlans.find((plan) => plan.tier === planTier);
  return matchingPlan?.tier || 'starter';
}
