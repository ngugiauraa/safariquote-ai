import {
  CompanyCustomizationSettings,
  SAFARIQUOTE_COPYRIGHT,
  getCompanyDisplayLogo,
  getContactLines,
  getDashboardUrl,
  getQuoteFormUrl,
} from '@/lib/company-settings';

type CompanyEmailContext = {
  companyName: string;
  companySlug: string;
  logoUrl?: string | null;
  settings: CompanyCustomizationSettings;
};

function buildEmailShell({
  heading,
  intro,
  body,
  companyName,
  logoUrl,
  settings,
}: {
  heading: string;
  intro: string;
  body: string;
} & CompanyEmailContext) {
  const theme = settings.itinerary.theme;
  const showLogo = Boolean(getCompanyDisplayLogo(settings, logoUrl, 'email'));
  const emailLogo = getCompanyDisplayLogo(settings, logoUrl, 'email');
  const contactLines = settings.email.includeContactInfo
    ? getContactLines(settings.contactInfo)
    : [];
  const copyrightLine = settings.email.includeCopyright ? SAFARIQUOTE_COPYRIGHT : '';

  return `
    <div style="background:${theme.backgroundColor};padding:32px 16px;font-family:Arial,sans-serif;color:${theme.textColor}">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:${theme.primaryColor};color:#ffffff;padding:24px 28px">
          ${showLogo ? `<img src="${emailLogo}" alt="${companyName} logo" style="max-height:56px;max-width:180px;display:block;margin-bottom:16px" />` : ''}
          <div style="font-size:28px;font-weight:700">${heading}</div>
          <div style="font-size:15px;opacity:.92;margin-top:8px">${intro}</div>
        </div>
        <div style="padding:28px">
          ${body}
          ${
            contactLines.length > 0
              ? `<div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:14px;line-height:1.6">
                  <strong>${companyName}</strong><br />
                  ${contactLines.join('<br />')}
                </div>`
              : ''
          }
          <div style="margin-top:20px;font-size:13px;color:#6b7280">
            ${settings.email.footerNote}
            ${copyrightLine ? `<br /><br />${copyrightLine}` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function buildWelcomeEmail(context: CompanyEmailContext) {
  const quoteUrl = getQuoteFormUrl(context.companySlug);
  const dashboardUrl = getDashboardUrl();

  return buildEmailShell({
    ...context,
    heading: `Welcome to SafariQuote AI, ${context.companyName}`,
    intro: 'Your account is ready and your quote request page is live.',
    body: `
      <p>Hello ${context.companyName} team,</p>
      <p>Your SafariQuote AI workspace is ready. Here are your key links:</p>
      <p>
        <strong>Dashboard:</strong><br />
        <a href="${dashboardUrl}">${dashboardUrl}</a>
      </p>
      <p>
        <strong>Quote form URL:</strong><br />
        <a href="${quoteUrl}">${quoteUrl}</a>
      </p>
      <p>Customers can now submit safari requests through your branded form.</p>
    `,
  });
}

export function buildCustomerQuoteEmail(
  context: CompanyEmailContext & {
    customerName: string;
    totalCostKES: number;
  }
) {
  return buildEmailShell({
    ...context,
    heading: `${context.settings.email.subjectPrefix}: ${context.companyName}`,
    intro: `Hello ${context.customerName}, your itinerary PDF is attached.`,
    body: `
      <p>Hi ${context.customerName},</p>
      <p>${context.settings.email.customMessage}</p>
      <p><strong>Total estimate:</strong> KES ${context.totalCostKES.toLocaleString()}</p>
      <p>Please review the attached itinerary PDF and reply to this email if you would like any adjustments.</p>
    `,
  });
}

export function buildCompanyLeadEmail(
  context: CompanyEmailContext & {
    customerName: string;
    customerEmail: string;
    requestSummary: string;
  }
) {
  return buildEmailShell({
    ...context,
    heading: `New Quote Request for ${context.companyName}`,
    intro: 'A traveler has submitted a new safari request.',
    body: `
      <p><strong>Customer:</strong> ${context.customerName}</p>
      <p><strong>Email:</strong> ${context.customerEmail}</p>
      <p><strong>Request summary:</strong><br />${context.requestSummary}</p>
      <p>The generated itinerary PDF is attached so your team can review exactly what was sent.</p>
    `,
  });
}
