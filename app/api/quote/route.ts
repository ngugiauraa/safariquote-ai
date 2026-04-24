import { NextRequest, NextResponse } from 'next/server';

import { appendToGoogleSheet } from '@/lib/google-sheets';
import {
  getQuoteFormUrl,
  normalizeCompanySettings,
} from '@/lib/company-settings';
import { buildCompanyLeadEmail, buildCustomerQuoteEmail } from '@/lib/email';
import { createQuotePdf } from '@/lib/pdf';
import { getResendClient, getResendFromAddress } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

type QuoteFormPayload = {
  companySlug: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children12Plus: number;
  childrenUnder12: number;
  preferredDestination: string;
  accommodation: string;
  transport: string;
  activities: string[];
  otherActivities: string;
  currency: string;
  budgetPerAdult: string;
  budgetPerChild: string;
  notes: string;
  specialDiet: string;
  healthNotes: string;
};

type CompanyRecord = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  contact_email?: string | null;
  sheet_id?: string | null;
  customization_settings?: unknown;
  vehicles?: Array<{ daily_rate_kes: number }>;
  hotels?: Array<{ destination: string; name: string; nightly_rate_kes: number }>;
};

type QuoteResult = {
  itinerary: Array<{ day: number; title: string; description: string }>;
  pricingBreakdown: Record<string, number>;
  totalCostKES: number;
  top3Hotels: Array<{ name: string; reason: string }>;
  notes: string;
};

function getTripDays(arrivalDate: string, departureDate: string) {
  if (!arrivalDate || !departureDate) return 5;

  const start = new Date(arrivalDate);
  const end = new Date(departureDate);
  const diffMs = end.getTime() - start.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Number.isFinite(days) && days > 0 ? days : 5;
}

function buildRequestSummary(formData: QuoteFormPayload) {
  const activities = formData.activities.length
    ? formData.activities.join(', ')
    : 'No specific activities selected';

  return [
    `Dates: ${formData.arrivalDate || 'TBD'} to ${formData.departureDate || 'TBD'}`,
    `Adults: ${formData.adults || 0}`,
    `Children: ${(formData.children12Plus || 0) + (formData.childrenUnder12 || 0)}`,
    `Destination: ${formData.preferredDestination || 'Open to suggestions'}`,
    `Transport: ${formData.transport || 'Operator to propose'}`,
    `Accommodation: ${formData.accommodation || 'midrange'}`,
    `Activities: ${activities}`,
    formData.notes ? `Notes: ${formData.notes}` : '',
  ]
    .filter(Boolean)
    .join('<br />');
}

function generateFallbackQuote(company: CompanyRecord, formData: QuoteFormPayload): QuoteResult {
  const stayDays = getTripDays(formData.arrivalDate, formData.departureDate);
  const adults = Number(formData.adults) || 0;
  const children = (Number(formData.children12Plus) || 0) + (Number(formData.childrenUnder12) || 0);
  const pax = Math.max(1, adults + children);
  const transportRate = company.vehicles?.[0]?.daily_rate_kes || 30000;
  const hotelRate = company.hotels?.[0]?.nightly_rate_kes || 18000;
  const destination = formData.preferredDestination || company.hotels?.[0]?.destination || 'Kenya safari circuit';
  const activityLabel =
    formData.activities?.length > 0 ? formData.activities.join(', ') : 'signature safari experiences';

  const transportTotal = transportRate * stayDays;
  const hotelTotal = hotelRate * stayDays * pax;
  const parkFees = 15000 * stayDays * pax;
  const meals = 5000 * stayDays * pax;
  const total = transportTotal + hotelTotal + parkFees + meals;

  return {
    itinerary: Array.from({ length: stayDays }, (_, index) => ({
      day: index + 1,
      title:
        index === 0
          ? 'Arrival and briefing'
          : index === stayDays - 1
            ? 'Departure'
            : `Safari day ${index}`,
      description:
        index === 0
          ? `Arrival, airport transfer, and check-in for your ${destination} safari.`
          : index === stayDays - 1
            ? 'Final breakfast, checkout, and transfer for departure.'
            : `Explore ${destination} with ${activityLabel} and accommodation matching your ${formData.accommodation} preference.`,
    })),
    pricingBreakdown: {
      transport: transportTotal,
      hotels: hotelTotal,
      park_fees: parkFees,
      meals,
      total,
    },
    totalCostKES: total,
    top3Hotels:
      company.hotels?.slice(0, 3).map((hotel) => ({
        name: hotel.name,
        reason: `Fits the requested ${formData.accommodation} travel style in ${hotel.destination}.`,
      })) || [],
    notes:
      'This quote was generated from your company rates and the traveler preferences submitted on your form.',
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = (await req.json()) as QuoteFormPayload;
    const customerName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
    const customerEmail = formData.email?.trim();

    if (!formData.companySlug) {
      return NextResponse.json({ error: 'Company slug is required.' }, { status: 400 });
    }

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Customer name and email are required.' },
        { status: 400 }
      );
    }

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('*, vehicles(*), hotels(*)')
      .eq('slug', formData.companySlug)
      .single<CompanyRecord>();

    if (error || !company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const settings = normalizeCompanySettings(company.customization_settings, {
      logoUrl: company.logo_url || undefined,
      contactEmail: company.contact_email || undefined,
    });

    const quote = generateFallbackQuote(company, formData);

    const { data: savedQuote, error: quoteSaveError } = await supabaseAdmin
      .from('quotes')
      .insert({
        company_id: company.id,
        customer_name: customerName,
        customer_email: customerEmail,
        request: formData,
        response: quote,
        total_kes: quote.totalCostKES,
      })
      .select()
      .single();

    if (quoteSaveError) {
      throw quoteSaveError;
    }

    if (company.sheet_id) {
      await appendToGoogleSheet(company.sheet_id, {
        customerName,
        customerEmail,
        destinations: [formData.preferredDestination].filter(Boolean),
        pax:
          (Number(formData.adults) || 0) +
          (Number(formData.children12Plus) || 0) +
          (Number(formData.childrenUnder12) || 0),
        budget: formData.budgetPerAdult || '',
        transport: formData.transport || '',
        totalKES: quote.totalCostKES,
        quoteId: savedQuote?.id,
      });
    }

    const pdfBytes = await createQuotePdf({
      companyName: company.name,
      logoUrl: company.logo_url,
      settings,
      customerName,
      customerEmail,
      quote,
    });

    const attachmentContent = Buffer.from(pdfBytes);
    const resend = getResendClient();
    const quoteFileName = `${company.slug || formData.companySlug}-quote-${savedQuote?.id || Date.now()}.pdf`;
    const requestSummary = buildRequestSummary(formData);

    const customerEmailResponse = await resend.emails.send({
      from: getResendFromAddress(),
      to: [customerEmail],
      replyTo: company.contact_email || undefined,
      subject: `${settings.email.subjectPrefix}: ${company.name}`,
      html: buildCustomerQuoteEmail({
        companyName: company.name,
        companySlug: company.slug || formData.companySlug,
        logoUrl: company.logo_url || undefined,
        settings,
        customerName,
        totalCostKES: quote.totalCostKES,
      }),
      attachments: [
        {
          filename: quoteFileName,
          content: attachmentContent,
          contentType: 'application/pdf',
        },
      ],
    });

    if (customerEmailResponse.error) {
      throw new Error(customerEmailResponse.error.message);
    }

    let companyEmailId: string | null = null;
    if (company.contact_email) {
      const companyEmailResponse = await resend.emails.send({
        from: getResendFromAddress(),
        to: [company.contact_email],
        subject: `New quote request from ${customerName}`,
        html: buildCompanyLeadEmail({
          companyName: company.name,
          companySlug: company.slug || formData.companySlug,
          logoUrl: company.logo_url || undefined,
          settings,
          customerName,
          customerEmail,
          requestSummary,
        }),
        attachments: [
          {
            filename: quoteFileName,
            content: attachmentContent,
            contentType: 'application/pdf',
          },
        ],
      });

      if (companyEmailResponse.error) {
        throw new Error(companyEmailResponse.error.message);
      }

      companyEmailId = companyEmailResponse.data?.id || null;
    }

    return NextResponse.json({
      success: true,
      quote,
      quoteId: savedQuote?.id || null,
      emailedToCustomer: true,
      emailedToCompany: Boolean(company.contact_email),
      customerEmailId: customerEmailResponse.data?.id || null,
      companyEmailId,
      quoteFormUrl: getQuoteFormUrl(company.slug),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate quote.';
    console.error('Quote generation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
