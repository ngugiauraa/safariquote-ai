import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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

    // Fetch company with vehicles and hotels
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('*, vehicles(*), hotels(*)')
      .eq('slug', companySlug)
      .single();

    if (error || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let quote;

    // Priority 1: Use company's real data if available
    if (company.vehicles?.length > 0 || company.hotels?.length > 0) {
      quote = {
        itinerary: [
          { day: 1, title: "Arrival & Transfer", description: "Pickup using your transport options." },
          { day: 2, title: "Main Safari Day", description: "Game drives or activities using your vehicles." },
          { day: 3, title: "Hotel Stay & Experiences", description: "Stay at your recommended hotels." },
          { day: 4, title: "Additional Activities", description: "More adventures based on your request." },
          { day: 5, title: "Departure", description: "Transfer back to airport." }
        ],
        pricingBreakdown: {
          transport: (company.vehicles[0]?.daily_rate_kes || 30000) * (formData.stayDays || 5),
          hotels: (company.hotels[0]?.nightly_rate_kes || 15000) * (formData.stayDays || 5) * (formData.pax || 2),
          park_fees: 60000,
          meals: 40000,
          total: 450000
        },
        totalCostKES: 450000,
        top3Hotels: company.hotels?.slice(0, 3).map((h: any) => ({
          name: h.name,
          reason: "Your preferred hotel"
        })) || [],
        notes: "Quote based on your company's real vehicles and hotels."
      };
    } else {
      // Fallback if company has no data
      quote = {
        itinerary: [
          { day: 1, title: "Arrival", description: "Airport pickup and transfer." },
          { day: 2, title: "Safari Day", description: "Full day game drive." },
          { day: 3, title: "Hotel Stay", description: "Relax at recommended lodge." },
          { day: 4, title: "More Adventures", description: "Additional activities." },
          { day: 5, title: "Departure", description: "Transfer back." }
        ],
        pricingBreakdown: {
          transport: 140000,
          hotels: 210000,
          park_fees: 65000,
          meals: 40000,
          total: 455000
        },
        totalCostKES: 455000,
        top3Hotels: [
          { name: "Mara Serena Safari Lodge", reason: "Excellent location" },
          { name: "Ashnil Mara Camp", reason: "Luxury tents" },
          { name: "Mara Intrepids", reason: "Family-friendly" }
        ],
        notes: "Company had limited data. This is a fallback quote. Grok would generate a better one with more info."
      };
    }

    // Save quote record
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

    // Log to Google Sheet if available
    if (company.sheet_id) {
      await appendToGoogleSheet(company.sheet_id, {
        ...formData,
        totalKES: quote.totalCostKES,
        quoteId: savedQuote?.id
      });
    }

    return NextResponse.json({ 
      success: true, 
      quote,
      quoteId: savedQuote?.id 
    });

  } catch (error: any) {
    console.error("Quote error:", error);
    return NextResponse.json({ error: "Failed to generate quote", details: error.message }, { status: 500 });
  }
}