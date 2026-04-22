import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSafariQuote } from '@/lib/grok';
import { appendToGoogleSheet } from '@/lib/google-sheets';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    const { companySlug, customerName, customerEmail } = formData;

    if (!companySlug) {
      return NextResponse.json({ error: "Company slug is required" }, { status: 400 });
    }

    // Get company data including vehicles and hotels
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('*, vehicles(*), hotels(*)')
      .eq('slug', companySlug)
      .single();

    if (error || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Generate quote using Grok
    const quote = await generateSafariQuote(company, formData);

    // Save quote to database
    const { data: savedQuote } = await supabaseAdmin
      .from('quotes')
      .insert({
        company_id: company.id,
        customer_name: customerName,
        customer_email: customerEmail,
        request: formData,
        response: quote,
        total_kes: quote.totalCostKES
      })
      .select()
      .single();

    // Log to Google Sheets if sheet_id exists
    if (company.sheet_id) {
      await appendToGoogleSheet(company.sheet_id, {
        ...formData,
        totalKES: quote.totalCostKES,
        quoteId: savedQuote?.id
      });
    }

    // Send confirmation email to customer
    await resend.emails.send({
      from: `${company.name} <quotes@safariquote.ai>`,
      to: customerEmail,
      subject: `Your Kenya Safari Quote - ${quote.totalCostKES.toLocaleString()} KES`,
      html: `
        <h1>Your Safari Itinerary is Ready!</h1>
        <p>Dear ${customerName},</p>
        <p>Here is your personalized quote for ${formData.destinations ? formData.destinations.join(', ') : 'Custom Safari'}.</p>
        <p><strong>Total Cost: KES ${quote.totalCostKES.toLocaleString()}</strong></p>
        <p>Contact us: ${company.contact_email}</p>
        <pre style="background:#f4f4f4;padding:15px;border-radius:8px;">${JSON.stringify(quote, null, 2)}</pre>
      `
    });

    // Notify company owner
    await resend.emails.send({
      from: 'SafariQuote AI <alert@safariquote.ai>',
      to: company.contact_email,
      subject: `🚨 NEW QUOTE REQUEST - ${customerName}`,
      html: `
        <h2>New Quote Generated</h2>
        <p>Customer: ${customerName} (${customerEmail})</p>
        <p>Total: <strong>KES ${quote.totalCostKES.toLocaleString()}</strong></p>
        <p>Destinations: ${formData.destinations ? formData.destinations.join(', ') : 'Custom'}</p>
        <p>View full details in your dashboard.</p>
      `
    });

    return NextResponse.json({ 
      success: true, 
      quote,
      quoteId: savedQuote?.id 
    });

  } catch (error: any) {
    console.error("Quote generation error:", error);
    return NextResponse.json({ 
      error: "Failed to generate quote", 
      details: error.message 
    }, { status: 500 });
  }
}