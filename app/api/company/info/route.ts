import { NextRequest, NextResponse } from 'next/server';

import { normalizeCompanySettings } from '@/lib/company-settings';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');
    const clerkOrgId = req.nextUrl.searchParams.get('clerkOrgId');

    if (!slug && !clerkOrgId) {
      return NextResponse.json(
        { error: 'Provide either slug or clerkOrgId.' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin.from('companies').select('*, vehicles(*), hotels(*)');

    if (slug) {
      query = query.eq('slug', slug);
    } else if (clerkOrgId) {
      query = query.eq('clerk_org_id', clerkOrgId);
    }

    const { data: company, error } = await query.maybeSingle();

    if (error) throw error;

    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const customizationSettings = normalizeCompanySettings(company.customization_settings, {
      logoUrl: company.logo_url,
      contactEmail: company.contact_email,
    });

    return NextResponse.json({
      success: true,
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo_url: company.logo_url || '',
      contact_email: company.contact_email || '',
      sheet_id: company.sheet_id || '',
      vehicles: company.vehicles || [],
      hotels: company.hotels || [],
      customization_settings: customizationSettings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load company details.';
    console.error('Company info error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
