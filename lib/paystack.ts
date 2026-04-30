import crypto from 'node:crypto';
import { getPlanConfig, sanitizePlanTier, type PlanTier } from '@/lib/pricing';

const PAYSTACK_API_BASE = 'https://api.paystack.co';

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function getSecretKey() {
  return requiredEnv('PAYSTACK_SECRET_KEY');
}

export function buildPaystackReference(organizationId: string, planTier: PlanTier) {
  return `sqai_${organizationId}_${planTier}_${Date.now()}`;
}

export function getPlanCheckoutAmount(planTier: string | null | undefined) {
  return getPlanConfig(sanitizePlanTier(planTier)).initialChargeKes * 100;
}

type InitializeTransactionInput = {
  email: string;
  organizationId: string;
  organizationName: string;
  planTier: PlanTier;
  callbackUrl: string;
  requestedByUserId: string;
};

export async function initializePaystackTransaction(input: InitializeTransactionInput) {
  const plan = getPlanConfig(input.planTier);
  const reference = buildPaystackReference(input.organizationId, input.planTier);

  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: plan.initialChargeKes * 100,
      currency: plan.currency,
      reference,
      callback_url: input.callbackUrl,
      metadata: {
        organizationId: input.organizationId,
        organizationName: input.organizationName,
        planTier: input.planTier,
        requestedByUserId: input.requestedByUserId,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.status || !payload?.data?.authorization_url) {
    throw new Error(payload?.message || 'Failed to initialize Paystack transaction');
  }

  return {
    authorizationUrl: payload.data.authorization_url as string,
    accessCode: payload.data.access_code as string,
    reference: payload.data.reference as string,
  };
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
    },
  });

  const payload = await response.json();

  if (!response.ok || !payload?.status || !payload?.data) {
    throw new Error(payload?.message || 'Failed to verify Paystack transaction');
  }

  return payload.data as {
    status: string;
    amount: number;
    reference: string;
    paid_at?: string;
    customer?: {
      email?: string;
    };
    metadata?: unknown;
  };
}

export function parsePaystackMetadata(metadata: unknown) {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === 'object' && parsed ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  return typeof metadata === 'object' ? metadata as Record<string, unknown> : {};
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const hash = crypto.createHmac('sha512', getSecretKey()).update(rawBody).digest('hex');
  return hash === signature;
}
