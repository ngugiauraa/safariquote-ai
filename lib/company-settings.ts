export type PackageTier = 'starter' | 'professional' | 'enterprise';

export type ContactInfo = {
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  address: string;
};

export type ThemeSettings = {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
};

export type FormSettings = {
  includeLogo: boolean;
  includeContactInfo: boolean;
  introText: string;
};

export type ItinerarySettings = {
  includeLogo: boolean;
  includeContactInfo: boolean;
  includeCopyright: boolean;
  customIntro: string;
  footerNote: string;
  theme: ThemeSettings;
};

export type EmailSettings = {
  includeLogo: boolean;
  includeContactInfo: boolean;
  includeCopyright: boolean;
  subjectPrefix: string;
  customMessage: string;
  footerNote: string;
};

export type CompanyCustomizationSettings = {
  packageTier: PackageTier;
  contactInfo: ContactInfo;
  form: FormSettings;
  itinerary: ItinerarySettings;
  email: EmailSettings;
};

export const SAFARIQUOTE_COPYRIGHT = 'SafariQuote AI © 2026 • Built for Kenyan Travel Companies';

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#0f766e',
  accentColor: '#f59e0b',
  textColor: '#111827',
  backgroundColor: '#f8fafc',
};

const DEFAULT_CONTACT_INFO: ContactInfo = {
  email: '',
  phone: '',
  whatsapp: '',
  website: '',
  address: '',
};

const DEFAULT_SETTINGS: CompanyCustomizationSettings = {
  packageTier: 'starter',
  contactInfo: DEFAULT_CONTACT_INFO,
  form: {
    includeLogo: false,
    includeContactInfo: false,
    introText: 'Tell us about your dream safari and we will prepare a tailored itinerary.',
  },
  itinerary: {
    includeLogo: true,
    includeContactInfo: true,
    includeCopyright: true,
    customIntro: 'Thank you for requesting a quote. Here is your personalized safari itinerary.',
    footerNote: 'All rates are subject to availability at the time of confirmation.',
    theme: DEFAULT_THEME,
  },
  email: {
    includeLogo: false,
    includeContactInfo: true,
    includeCopyright: true,
    subjectPrefix: 'Safari Quote',
    customMessage: 'Thank you for your request. Your itinerary PDF is attached to this email.',
    footerNote: 'We look forward to planning your safari.',
  },
};

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitizeColor(value: unknown, fallback: string) {
  const candidate = sanitizeString(value);
  return /^#([0-9a-fA-F]{6})$/.test(candidate) ? candidate : fallback;
}

function sanitizePackageTier(value: unknown): PackageTier {
  if (value === 'starter' || value === 'professional' || value === 'enterprise') {
    return value;
  }

  return 'starter';
}

export function buildCompanySlug(name: string) {
  return sanitizeString(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'company';
}

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://safariquote-ai.vercel.app'
  ).replace(/\/+$/, '');
}

export function getQuoteFormUrl(slug: string) {
  return `${getAppBaseUrl()}/quote/${slug}`;
}

export function getDashboardUrl() {
  return `${getAppBaseUrl()}/dashboard`;
}

export function parseStoredSettings(value: unknown) {
  if (!value) return {};

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return {};
}

export function normalizeCompanySettings(
  rawSettings: unknown,
  fallback?: {
    logoUrl?: string;
    contactEmail?: string;
  }
): CompanyCustomizationSettings {
  const parsed = parseStoredSettings(rawSettings);
  const packageTier = sanitizePackageTier(parsed.packageTier);

  const contactInfo = {
    email: sanitizeString(parsed.contactInfo?.email) || sanitizeString(fallback?.contactEmail),
    phone: sanitizeString(parsed.contactInfo?.phone),
    whatsapp: sanitizeString(parsed.contactInfo?.whatsapp),
    website: sanitizeString(parsed.contactInfo?.website),
    address: sanitizeString(parsed.contactInfo?.address),
  };

  const form: FormSettings = {
    includeLogo: sanitizeBoolean(parsed.form?.includeLogo, DEFAULT_SETTINGS.form.includeLogo),
    includeContactInfo: sanitizeBoolean(
      parsed.form?.includeContactInfo,
      DEFAULT_SETTINGS.form.includeContactInfo
    ),
    introText: sanitizeString(parsed.form?.introText) || DEFAULT_SETTINGS.form.introText,
  };

  const itinerary: ItinerarySettings = {
    includeLogo: sanitizeBoolean(
      parsed.itinerary?.includeLogo,
      DEFAULT_SETTINGS.itinerary.includeLogo
    ),
    includeContactInfo: sanitizeBoolean(
      parsed.itinerary?.includeContactInfo,
      DEFAULT_SETTINGS.itinerary.includeContactInfo
    ),
    includeCopyright: sanitizeBoolean(
      parsed.itinerary?.includeCopyright,
      DEFAULT_SETTINGS.itinerary.includeCopyright
    ),
    customIntro:
      sanitizeString(parsed.itinerary?.customIntro) || DEFAULT_SETTINGS.itinerary.customIntro,
    footerNote:
      sanitizeString(parsed.itinerary?.footerNote) || DEFAULT_SETTINGS.itinerary.footerNote,
    theme: {
      primaryColor: sanitizeColor(
        parsed.itinerary?.theme?.primaryColor,
        DEFAULT_THEME.primaryColor
      ),
      accentColor: sanitizeColor(
        parsed.itinerary?.theme?.accentColor,
        DEFAULT_THEME.accentColor
      ),
      textColor: sanitizeColor(parsed.itinerary?.theme?.textColor, DEFAULT_THEME.textColor),
      backgroundColor: sanitizeColor(
        parsed.itinerary?.theme?.backgroundColor,
        DEFAULT_THEME.backgroundColor
      ),
    },
  };

  const email: EmailSettings = {
    includeLogo: sanitizeBoolean(parsed.email?.includeLogo, DEFAULT_SETTINGS.email.includeLogo),
    includeContactInfo: sanitizeBoolean(
      parsed.email?.includeContactInfo,
      DEFAULT_SETTINGS.email.includeContactInfo
    ),
    includeCopyright: sanitizeBoolean(
      parsed.email?.includeCopyright,
      DEFAULT_SETTINGS.email.includeCopyright
    ),
    subjectPrefix:
      sanitizeString(parsed.email?.subjectPrefix) || DEFAULT_SETTINGS.email.subjectPrefix,
    customMessage:
      sanitizeString(parsed.email?.customMessage) || DEFAULT_SETTINGS.email.customMessage,
    footerNote: sanitizeString(parsed.email?.footerNote) || DEFAULT_SETTINGS.email.footerNote,
  };

  if (packageTier === 'starter') {
    form.includeLogo = false;
    form.includeContactInfo = false;
    email.includeLogo = false;
    email.includeCopyright = true;
    itinerary.includeCopyright = true;
  }

  if (packageTier === 'professional') {
    form.includeContactInfo = true;
    email.includeLogo = true;
    email.includeCopyright = true;
    itinerary.includeCopyright = true;
  }

  if (packageTier === 'enterprise') {
    form.includeLogo = true;
    form.includeContactInfo = true;
    email.includeLogo = true;
  }

  return {
    packageTier,
    contactInfo,
    form,
    itinerary,
    email,
  };
}

export function getCompanyDisplayLogo(
  settings: CompanyCustomizationSettings,
  fallbackLogoUrl: string | null | undefined,
  surface: 'form' | 'itinerary' | 'email'
) {
  const logoUrl = sanitizeString(fallbackLogoUrl);
  if (!logoUrl) return '';

  if (surface === 'form' && settings.form.includeLogo) return logoUrl;
  if (surface === 'itinerary' && settings.itinerary.includeLogo) return logoUrl;
  if (surface === 'email' && settings.email.includeLogo) return logoUrl;

  return '';
}

export function getContactLines(contactInfo: ContactInfo) {
  return [
    contactInfo.email,
    contactInfo.phone,
    contactInfo.whatsapp ? `WhatsApp: ${contactInfo.whatsapp}` : '',
    contactInfo.website,
    contactInfo.address,
  ].filter(Boolean);
}

export function sanitizeVehicles(vehicles: unknown) {
  if (!Array.isArray(vehicles)) return [];

  return vehicles
    .map((vehicle) => ({
      type: sanitizeString(vehicle?.type),
      daily_rate_kes: Number(vehicle?.daily_rate_kes) || 0,
    }))
    .filter((vehicle) => vehicle.type && vehicle.daily_rate_kes > 0);
}

export function sanitizeHotels(hotels: unknown) {
  if (!Array.isArray(hotels)) return [];

  return hotels
    .map((hotel) => ({
      destination: sanitizeString(hotel?.destination),
      name: sanitizeString(hotel?.name),
      nightly_rate_kes: Number(hotel?.nightly_rate_kes) || 0,
    }))
    .filter((hotel) => hotel.destination && hotel.name && hotel.nightly_rate_kes > 0);
}
