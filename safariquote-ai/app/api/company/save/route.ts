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

    // Fetch company with its vehicles and hotels
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('*, vehicles(*), hotels(*)')
      .eq('slug', companySlug)
      .single();

    if (error || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // === PRIORITY 1: Use company's real data if available ===
    let quote;

    if (company.vehicles && company.vehicles.length > 0 && company.hotels && company.hotels.length > 0) {
      // Real company data available → build quote from it
      quote = {
        itinerary: [
          { day: 1, title: "Arrival & Transfer", description: "Pickup and transfer using your transport." },
          { day: 2, title: "Safari / Activity Day", description: "Using your selected vehicles and hotels." },
          { day: 3, title: "Main Safari Day", description: "Full day activity based on your preferences." },
          { day: 4, title: "Additional Experiences", description: "More activities or relaxation." },
          { day: 5, title: "Departure", description: "Transfer back to airport." }
        ],
        pricingBreakdown: {
          transport: company.vehicles[0]?.daily_rate_kes * (formData.stayDays || 5) || 150000,
          hotels: company.hotels[0]?.nightly_rate_kes * (formData.stayDays || 5) * (formData.pax || 2) || 200000,
          park_fees: 60000,
          meals: 40000,
          total: 450000
        },
        totalCostKES: 450000,
        top3Hotels: company.hotels.slice(0, 3).map((h: any) => ({
          name: h.name,
          reason: "Your preferred hotel"
        })),
        notes: "Quote generated using your company's real vehicles and hotels."
      };
    } else {
      // === FALLBACK: Company has no data → use Grok (or mock for now) ===
      // TODO: Replace with real Grok call when you have credits
      quote = {
        itinerary: [
          { day: 1, title: "Arrival in Nairobi", description: "Airport pickup and hotel transfer." },
          { day: 2, title: "Travel to destination", description: "Scenic drive or flight." },
          { day: 3, title: "Full day safari / activities", description: "Game drives or chosen experiences." },
          { day: 4, title: "More adventures", description: "Additional activities based on your request." },
          { day: 5, title: "Departure", description: "Transfer back to airport." }
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
          { name: "Mara Serena Safari Lodge", reason: "Excellent location and service" },
          { name: "Ashnil Mara Camp", reason: "Luxury tents with great views" },
          { name: "Mara Intrepids", reason: "Family-friendly with good facilities" }
        ],
        notes: "Company had no vehicles/hotels data. This is a fallback quote."
      };
    }

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

    // Log to Google Sheet if company has one
    if (company.sheet_id) {
      await appendToGoogleSheet(company.sheet_id, {
        ...formData,
        totalKES: quote.totalCostKES,
        quoteId: savedQuote?.id
      });
    }

    // Send emails (optional for now)
    // ... (you can add later)

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