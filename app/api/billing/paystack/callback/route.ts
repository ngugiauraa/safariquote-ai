import { NextRequest, NextResponse } from 'next/server';
import { activateOrganizationPlan } from '@/lib/billing';
import { getPlanCheckoutAmount, parsePaystackMetadata, verifyPaystackTransaction } from '@/lib/paystack';
import { sanitizePlanTier } from '@/lib/pricing';

function buildDashboardRedirect(req: NextRequest, status: 'success' | 'failed', message: string, planTier?: string) {
  const url = new URL('/dashboard', req.nextUrl.origin);
  url.searchParams.set('payment', status);
  url.searchParams.set('message', message);

  if (planTier) {
    url.searchParams.set('plan', planTier);
  }

  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('trxref');

  if (!reference) {
    return buildDashboardRedirect(req, 'failed', 'Missing payment reference');
  }

  try {
    const transaction = await verifyPaystackTransaction(reference);
    const metadata = parsePaystackMetadata(transaction.metadata);
    const organizationId = typeof metadata.organizationId === 'string' ? metadata.organizationId : null;
    const rawPlanTier = typeof metadata.planTier === 'string' ? metadata.planTier : null;
    const planTier = sanitizePlanTier(rawPlanTier);
    const expectedAmount = getPlanCheckoutAmount(planTier);

    if (!organizationId || !rawPlanTier) {
      return buildDashboardRedirect(req, 'failed', 'Payment metadata was incomplete');
    }

    if (transaction.status !== 'success') {
      return buildDashboardRedirect(req, 'failed', 'Payment was not completed', planTier);
    }

    if (transaction.amount !== expectedAmount) {
      return buildDashboardRedirect(req, 'failed', 'Payment amount did not match the selected package', planTier);
    }

    await activateOrganizationPlan({
      organizationId,
      planTier,
      reference: transaction.reference,
      paidAt: transaction.paid_at || null,
    });

    return buildDashboardRedirect(req, 'success', `${planTier} plan activated`, planTier);
  } catch (error) {
    console.error('Paystack callback error:', error);
    return buildDashboardRedirect(req, 'failed', 'We could not verify that payment');
  }
}
