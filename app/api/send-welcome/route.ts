import { NextRequest, NextResponse } from 'next/server';

import { buildWelcomeEmail } from '@/lib/email';
import { getResendClient, getResendFromAddress } from '@/lib/resend';
import { normalizeCompanySettings } from '@/lib/company-settings';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { companyName, contactEmail, quoteSlug, logoUrl, customizationSettings } =
      await req.json();

    if (!companyName || !contactEmail || !quoteSlug) {
      return NextResponse.json(
        { error: 'companyName, contactEmail, and quoteSlug are required.' },
        { status: 400 }
      );
    }

    const settings = normalizeCompanySettings(customizationSettings, {
      logoUrl,
      contactEmail,
    });

    const resend = getResendClient();
    const response = await resend.emails.send({
      from: getResendFromAddress(),
      to: [contactEmail],
      subject: `Welcome to SafariQuote AI - ${companyName}`,
      html: buildWelcomeEmail({
        companyName,
        companySlug: quoteSlug,
        logoUrl,
        settings,
      }),
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return NextResponse.json({ success: true, id: response.data?.id || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send welcome email.';
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
