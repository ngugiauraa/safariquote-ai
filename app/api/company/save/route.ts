import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPlanConfig } from '@/lib/pricing';
import { getOrganizationBillingState, updateOrganizationMetadata } from '@/lib/billing';

function slugifyCompanyName(name: string) {
  return (name || 'company')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'company';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to save company';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerk_org_id, name, logo_url, contact_email, sheet_id, vehicles, hotels, themeColor } = body;

    if (!clerk_org_id) {
      return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });
    }

    const { state } = await getOrganizationBillingState(clerk_org_id);
    const plan = getPlanConfig(state.planTier);
    const normalizedThemeColor = plan.features.customColorPalette && typeof themeColor === 'string' && themeColor
      ? themeColor
      : '#0f766e';

    await updateOrganizationMetadata(clerk_org_id, {
      publicMetadata: {
        themeColor: normalizedThemeColor,
      },
    });

    const { data: existingCompany, error: existingCompanyError } = await supabaseAdmin
      .from('companies')
      .select('id, slug')
      .eq('clerk_org_id', clerk_org_id)
      .maybeSingle();

    if (existingCompanyError) {
      throw existingCompanyError;
    }

    const slug = existingCompany?.slug || slugifyCompanyName(name || 'company');

    const { error: companyError } = await supabaseAdmin
      .from('companies')
      .upsert({
        clerk_org_id,
        slug,
        name: name || 'My Safari Company',
        logo_url: plan.features.logoOnForm ? logo_url || null : null,
        contact_email: contact_email || null,
        sheet_id: plan.features.googleSheetsSync ? sheet_id || null : null,
      }, {
        onConflict: 'clerk_org_id',
      });

    if (companyError) {
      throw companyError;
    }

    const { data: company, error: companyLookupError } = await supabaseAdmin
      .from('companies')
      .select('id, slug')
      .eq('clerk_org_id', clerk_org_id)
      .single();

    if (companyLookupError || !company) {
      throw companyLookupError || new Error('Company not found after upsert');
    }

    if (Array.isArray(vehicles)) {
      const { error: vehicleDeleteError } = await supabaseAdmin
        .from('vehicles')
        .delete()
        .eq('company_id', company.id);

      if (vehicleDeleteError) {
        throw vehicleDeleteError;
      }

      if (vehicles.length > 0) {
        const vehicleRows = vehicles.map((vehicle: { type?: string; daily_rate_kes?: number }) => ({
          company_id: company.id,
          type: vehicle.type || 'vehicle',
          daily_rate_kes: vehicle.daily_rate_kes || 0,
        }));

        const { error: vehicleInsertError } = await supabaseAdmin.from('vehicles').insert(vehicleRows);

        if (vehicleInsertError) {
          throw vehicleInsertError;
        }
      }
    }

    if (Array.isArray(hotels)) {
      const { error: hotelDeleteError } = await supabaseAdmin
        .from('hotels')
        .delete()
        .eq('company_id', company.id);

      if (hotelDeleteError) {
        throw hotelDeleteError;
      }

      if (hotels.length > 0) {
        const hotelRows = hotels.map((hotel: { destination?: string; name?: string; nightly_rate_kes?: number }) => ({
          company_id: company.id,
          destination: hotel.destination || 'Destination',
          name: hotel.name || 'Hotel',
          nightly_rate_kes: hotel.nightly_rate_kes || 0,
        }));

        const { error: hotelInsertError } = await supabaseAdmin.from('hotels').insert(hotelRows);

        if (hotelInsertError) {
          throw hotelInsertError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      slug: company.slug,
      isNewCompany: !existingCompany,
      planTier: state.planTier,
    });
  } catch (error: unknown) {
    console.error('Save company error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
