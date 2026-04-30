import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to send welcome email';
}

export async function POST(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is required.');
    }

    const resend = new Resend(resendApiKey);
    const { companyName, contactEmail, quoteSlug, dashboardLink } = await req.json();

    await resend.emails.send({
      from: 'SafariQuote AI <quotes@safariquote-ai.vercel.app>',
      to: contactEmail,
      subject: `Welcome to SafariQuote AI - ${companyName}`,
      html: `
        <h1>Welcome to SafariQuote AI!</h1>
        <p>Dear ${companyName} team,</p>
        <p>Thank you for joining. Your company is now set up.</p>
        
        <p><strong>Your Dashboard:</strong><br>
        <a href="${dashboardLink}">${dashboardLink}</a></p>
        
        <p><strong>Your Customer Quote Link:</strong><br>
        <a href="https://safariquote-ai.vercel.app/quote/${quoteSlug}">https://safariquote-ai.vercel.app/quote/${quoteSlug}</a></p>
        
        <p>Your customers can now get instant quotes using your own vehicles and hotels.</p>
        
        <p>If you need any help, just reply to this email.</p>
        <p>Best regards,<br>The SafariQuote AI Team</p>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Email error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
