import { NextRequest, NextResponse } from 'next/server';
import { activateOrganizationPlan } from '@/lib/billing';
import { getPlanCheckoutAmount, parsePaystackMetadata, verifyPaystackSignature } from '@/lib/paystack';
import { sanitizePlanTier } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      event?: string;
      data?: {
        status?: string;
        amount?: number;
        reference?: string;
        paid_at?: string;
        metadata?: unknown;
      };
    };

    if (event.event !== 'charge.success' || !event.data?.reference) {
      return NextResponse.json({ received: true });
    }

    const metadata = parsePaystackMetadata(event.data.metadata);
    const organizationId = typeof metadata.organizationId === 'string' ? metadata.organizationId : null;
    const rawPlanTier = typeof metadata.planTier === 'string' ? metadata.planTier : null;
    const planTier = sanitizePlanTier(rawPlanTier);
    const expectedAmount = getPlanCheckoutAmount(planTier);

    if (!organizationId || !rawPlanTier || event.data.status !== 'success' || event.data.amount !== expectedAmount) {
      return NextResponse.json({ received: true });
    }

    await activateOrganizationPlan({
      organizationId,
      planTier,
      reference: event.data.reference,
      paidAt: event.data.paid_at || null,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
