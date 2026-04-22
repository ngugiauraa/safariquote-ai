import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerk_org_id, name, logo_url, contact_email, sheet_id, vehicles, hotels } = body;

    if (!clerk_org_id) {
      return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });
    }

    // Save or update company
    const { error: companyError } = await supabaseAdmin
      .from('companies')
      .upsert({
        clerk_org_id,
        slug: (name || 'company').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: name || 'My Safari Company',
        logo_url: logo_url || null,
        contact_email: contact_email || null,
        sheet_id: sheet_id || null,
      });

    if (companyError) throw companyError;

    // Get the company ID for vehicles and hotels
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('clerk_org_id', clerk_org_id)
      .single();

    if (!company) throw new Error('Company not found after upsert');

    // Save vehicles
    if (vehicles && vehicles.length > 0) {
      await supabaseAdmin
        .from('vehicles')
        .delete()
        .eq('company_id', company.id);

      const vehicleRows = vehicles.map((v: any) => ({
        company_id: company.id,
        type: v.type,
        daily_rate_kes: v.daily_rate_kes
      }));

      await supabaseAdmin.from('vehicles').insert(vehicleRows);
    }

    // Save hotels
    if (hotels && hotels.length > 0) {
      await supabaseAdmin
        .from('hotels')
        .delete()
        .eq('company_id', company.id);

      const hotelRows = hotels.map((h: any) => ({
        company_id: company.id,
        destination: h.destination,
        name: h.name,
        nightly_rate_kes: h.nightly_rate_kes
      }));

      await supabaseAdmin.from('hotels').insert(hotelRows);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save company error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}