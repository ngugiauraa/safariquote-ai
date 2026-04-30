import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrganizationBillingState } from '@/lib/billing';

export async function GET(req: NextRequest) {
  const { orgId } = await auth();
  const clerkOrgId = req.nextUrl.searchParams.get('clerkOrgId');

  if (!orgId || !clerkOrgId || orgId !== clerkOrgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: company, error } = await supabaseAdmin
    .from('companies')
    .select('name, logo_url, contact_email, sheet_id, vehicles(*), hotels(*)')
    .eq('clerk_org_id', clerkOrgId)
    .maybeSingle();

  if (error) {
    console.error('Current company error:', error);
    return NextResponse.json({ error: 'Failed to load company settings' }, { status: 500 });
  }

  const { state } = await getOrganizationBillingState(clerkOrgId);

  return NextResponse.json({
    success: true,
    company: company || null,
    planTier: state.planTier,
    themeColor: state.themeColor,
    billingStatus: state.billingStatus,
    pendingPlanTier: state.pendingPlanTier,
    pendingReference: state.pendingReference,
  });
}
