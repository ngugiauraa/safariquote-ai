import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { sanitizePlanTier } from '@/lib/pricing';
import { initializePaystackTransaction } from '@/lib/paystack';
import { updateOrganizationMetadata } from '@/lib/billing';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to start checkout';
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const planTier = sanitizePlanTier(body?.planTier);

    const clerk = await clerkClient();
    const [organization, user] = await Promise.all([
      clerk.organizations.getOrganization({ organizationId: orgId }),
      clerk.users.getUser(userId),
    ]);

    const email = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)?.emailAddress
      || user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: 'A billing email is required before checkout' }, { status: 400 });
    }

    const callbackUrl = new URL('/api/billing/paystack/callback', req.nextUrl.origin).toString();
    const checkout = await initializePaystackTransaction({
      email,
      organizationId: orgId,
      organizationName: organization.name,
      planTier,
      callbackUrl,
      requestedByUserId: userId,
    });

    await updateOrganizationMetadata(orgId, {
      publicMetadata: {
        billingStatus: 'pending',
        pendingPlanTier: planTier,
        pendingReference: checkout.reference,
      },
      privateMetadata: {
        pendingPlanTier: planTier,
        pendingReference: checkout.reference,
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: checkout.authorizationUrl,
      reference: checkout.reference,
    });
  } catch (error: unknown) {
    console.error('Paystack checkout error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
