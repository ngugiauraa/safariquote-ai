import { NextRequest, NextResponse } from 'next/server';

import {
  buildCompanySlug,
  normalizeCompanySettings,
  sanitizeHotels,
  sanitizeVehicles,
} from '@/lib/company-settings';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

function isMissingCustomizationColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes('customization_settings'));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clerkOrgId = String(body.clerk_org_id || '').trim();
    const companyName = String(body.name || '').trim();
    const logoUrl = String(body.logo_url || '').trim();
    const contactEmail = String(body.contact_email || '').trim();
    const sheetId = String(body.sheet_id || '').trim();

    if (!clerkOrgId || !companyName) {
      return NextResponse.json(
        { error: 'Organization and company name are required.' },
        { status: 400 }
      );
    }

    const vehicles = sanitizeVehicles(body.vehicles);
    const hotels = sanitizeHotels(body.hotels);
    const slug = buildCompanySlug(companyName);
    const customizationSettings = normalizeCompanySettings(body.customization_settings, {
      logoUrl,
      contactEmail,
    });

    const companyPayload = {
      clerk_org_id: clerkOrgId,
      name: companyName,
      slug,
      logo_url: logoUrl || null,
      contact_email: customizationSettings.contactInfo.email || contactEmail || null,
      sheet_id: sheetId || null,
      customization_settings: customizationSettings,
    };

    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('clerk_org_id', clerkOrgId)
      .maybeSingle();

    let companyRecord:
      | {
          id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          contact_email?: string | null;
          sheet_id?: string | null;
          customization_settings?: unknown;
        }
      | null = null;
    let warning = '';

    const upsertWithCustomization = await supabaseAdmin
      .from('companies')
      .upsert(companyPayload, { onConflict: 'clerk_org_id' })
      .select('*')
      .single();

    if (upsertWithCustomization.error && isMissingCustomizationColumn(upsertWithCustomization.error)) {
      warning =
        'The companies table is missing the customization_settings column, so advanced branding settings were not saved yet.';

      const { customization_settings: _ignored, ...basePayload } = companyPayload;
      void _ignored;
      const fallbackUpsert = await supabaseAdmin
        .from('companies')
        .upsert(basePayload, { onConflict: 'clerk_org_id' })
        .select('*')
        .single();

      if (fallbackUpsert.error || !fallbackUpsert.data) {
        throw fallbackUpsert.error || new Error('Failed to save company settings.');
      }

      companyRecord = fallbackUpsert.data;
    } else {
      if (upsertWithCustomization.error || !upsertWithCustomization.data) {
        throw upsertWithCustomization.error || new Error('Failed to save company settings.');
      }

      companyRecord = upsertWithCustomization.data;
    }

    if (!companyRecord) {
      throw new Error('Company record was not returned after save.');
    }

    await supabaseAdmin.from('vehicles').delete().eq('company_id', companyRecord.id);
    if (vehicles.length > 0) {
      const { error: vehiclesError } = await supabaseAdmin.from('vehicles').insert(
        vehicles.map((vehicle) => ({
          company_id: companyRecord.id,
          ...vehicle,
        }))
      );

      if (vehiclesError) throw vehiclesError;
    }

    await supabaseAdmin.from('hotels').delete().eq('company_id', companyRecord.id);
    if (hotels.length > 0) {
      const { error: hotelsError } = await supabaseAdmin.from('hotels').insert(
        hotels.map((hotel) => ({
          company_id: companyRecord.id,
          ...hotel,
        }))
      );

      if (hotelsError) throw hotelsError;
    }

    return NextResponse.json({
      success: true,
      created: !existingCompany,
      warning: warning || undefined,
      company: {
        id: companyRecord.id,
        name: companyRecord.name,
        slug: companyRecord.slug,
        logo_url: companyRecord.logo_url || logoUrl || null,
        contact_email:
          companyRecord.contact_email || customizationSettings.contactInfo.email || contactEmail,
        sheet_id: companyRecord.sheet_id || sheetId || null,
        customization_settings:
          companyRecord.customization_settings || customizationSettings,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save company settings.';
    console.error('Company save error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
