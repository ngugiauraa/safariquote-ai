import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPlanConfig, sanitizePlanTier } from '@/lib/pricing';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing company slug' }, { status: 400 });
  }

  const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('name, logo_url, contact_email, slug, clerk_org_id')
      .eq('slug', slug)
      .maybeSingle();

  if (error) {
    console.error('Company info error:', error);
    return NextResponse.json({ error: 'Failed to load company info' }, { status: 500 });
  }

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const clerk = await clerkClient();
  const organization = await clerk.organizations.getOrganization({
    organizationId: company.clerk_org_id,
  });
  const planTier = sanitizePlanTier(organization.publicMetadata?.planTier as string | undefined);
  const plan = getPlanConfig(planTier);
  const themeColor = typeof organization.publicMetadata?.themeColor === 'string'
    ? organization.publicMetadata.themeColor
    : '#0f766e';

  return NextResponse.json({
    success: true,
    name: company.name,
    logo_url: plan.features.logoOnForm ? company.logo_url : null,
    contact_email: plan.features.contactDetailsOnForm ? company.contact_email : null,
    slug: company.slug,
    planTier,
    themeColor: plan.features.customColorPalette ? themeColor : null,
    whiteLabelForm: plan.features.whiteLabelForm,
  });
}
