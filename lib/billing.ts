import { clerkClient } from '@clerk/nextjs/server';
import { getPlanConfig, sanitizePlanTier, type PlanTier } from '@/lib/pricing';

export type BillingStatus = 'inactive' | 'pending' | 'active';

type UnknownMetadata = Record<string, unknown> | null | undefined;

export type OrganizationBillingState = {
  planTier: PlanTier;
  themeColor: string;
  billingStatus: BillingStatus;
  pendingPlanTier: PlanTier | null;
  pendingReference: string | null;
  lastPaymentReference: string | null;
};

function readString(metadata: UnknownMetadata, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function getBillingStatus(metadata: UnknownMetadata): BillingStatus {
  const value = metadata?.billingStatus;
  return value === 'active' || value === 'pending' || value === 'inactive' ? value : 'inactive';
}

export function getOrganizationBillingStateFromMetadata(metadata: UnknownMetadata): OrganizationBillingState {
  const planTier = sanitizePlanTier(readString(metadata, 'planTier'));
  const plan = getPlanConfig(planTier);
  const rawThemeColor = readString(metadata, 'themeColor') || '#0f766e';

  return {
    planTier,
    themeColor: plan.features.customColorPalette ? rawThemeColor : '#0f766e',
    billingStatus: getBillingStatus(metadata),
    pendingPlanTier: sanitizeNullablePlanTier(readString(metadata, 'pendingPlanTier')),
    pendingReference: readString(metadata, 'pendingReference'),
    lastPaymentReference: readString(metadata, 'lastPaymentReference'),
  };
}

function sanitizeNullablePlanTier(planTier: string | null): PlanTier | null {
  if (!planTier) {
    return null;
  }

  return sanitizePlanTier(planTier);
}

export async function getOrganizationBillingState(organizationId: string) {
  const clerk = await clerkClient();
  const organization = await clerk.organizations.getOrganization({ organizationId });

  return {
    organization,
    state: getOrganizationBillingStateFromMetadata(organization.publicMetadata as UnknownMetadata),
    publicMetadata: ((organization.publicMetadata as UnknownMetadata) || {}) as Record<string, unknown>,
    privateMetadata: ((organization.privateMetadata as UnknownMetadata) || {}) as Record<string, unknown>,
  };
}

type MetadataPatch = {
  publicMetadata?: Record<string, unknown>;
  privateMetadata?: Record<string, unknown>;
};

export async function updateOrganizationMetadata(organizationId: string, patch: MetadataPatch) {
  const clerk = await clerkClient();
  const organization = await clerk.organizations.getOrganization({ organizationId });

  return clerk.organizations.updateOrganizationMetadata(organizationId, {
    publicMetadata: {
      ...(((organization.publicMetadata as UnknownMetadata) || {}) as Record<string, unknown>),
      ...(patch.publicMetadata || {}),
    },
    privateMetadata: {
      ...(((organization.privateMetadata as UnknownMetadata) || {}) as Record<string, unknown>),
      ...(patch.privateMetadata || {}),
    },
  });
}

type ActivatePlanInput = {
  organizationId: string;
  planTier: PlanTier;
  reference: string;
  paidAt?: string | null;
};

export async function activateOrganizationPlan(input: ActivatePlanInput) {
  const { state } = await getOrganizationBillingState(input.organizationId);
  const plan = getPlanConfig(input.planTier);
  const themeColor = plan.features.customColorPalette ? state.themeColor : '#0f766e';

  await updateOrganizationMetadata(input.organizationId, {
    publicMetadata: {
      planTier: input.planTier,
      billingStatus: 'active',
      pendingPlanTier: null,
      pendingReference: null,
      lastPaymentReference: input.reference,
      lastPaymentAt: input.paidAt || new Date().toISOString(),
      themeColor,
    },
    privateMetadata: {
      lastPaymentReference: input.reference,
      lastPaymentAt: input.paidAt || new Date().toISOString(),
    },
  });
}
