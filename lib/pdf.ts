import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import {
  CompanyCustomizationSettings,
  SAFARIQUOTE_COPYRIGHT,
  getCompanyDisplayLogo,
  getContactLines,
} from '@/lib/company-settings';

type QuotePdfInput = {
  companyName: string;
  logoUrl?: string | null;
  settings: CompanyCustomizationSettings;
  customerName: string;
  customerEmail: string;
  quote: {
    itinerary: Array<{ day: number; title: string; description: string }>;
    pricingBreakdown: Record<string, number>;
    totalCostKES: number;
    top3Hotels: Array<{ name: string; reason: string }>;
    notes: string;
  };
};

function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const int = Number.parseInt(sanitized, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  return rgb(r, g, b);
}

async function fetchLogoBytes(logoUrl: string) {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    const bytes = await response.arrayBuffer();
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export async function createQuotePdf(input: QuotePdfInput) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const theme = input.settings.itinerary.theme;
  const primaryColor = hexToRgb(theme.primaryColor);
  const accentColor = hexToRgb(theme.accentColor);
  const textColor = hexToRgb(theme.textColor);

  page.drawRectangle({
    x: 0,
    y: height - 130,
    width,
    height: 130,
    color: primaryColor,
  });

  let logoBottom = height - 60;
  const logoUrl = getCompanyDisplayLogo(input.settings, input.logoUrl, 'itinerary');
  if (logoUrl) {
    const logoAsset = await fetchLogoBytes(logoUrl);
    if (logoAsset) {
      try {
        const logoImage = logoAsset.contentType.includes('png')
          ? await pdfDoc.embedPng(logoAsset.bytes)
          : await pdfDoc.embedJpg(logoAsset.bytes);
        const dims = logoImage.scale(0.25);
        page.drawImage(logoImage, {
          x: 40,
          y: height - 90,
          width: Math.min(dims.width, 120),
          height: Math.min(dims.height, 50),
        });
        logoBottom = height - 98;
      } catch {
        // If a logo cannot be embedded we still generate the PDF.
      }
    }
  }

  page.drawText(input.companyName, {
    x: 40,
    y: logoBottom - 18,
    font: bold,
    size: 22,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Safari Itinerary for ${input.customerName}`, {
    x: 40,
    y: height - 112,
    font,
    size: 11,
    color: rgb(1, 1, 1),
  });

  let cursorY = height - 160;

  const sections: Array<{ title: string; lines: string[] }> = [
    {
      title: 'Overview',
      lines: [
        input.settings.itinerary.customIntro,
        `Traveler: ${input.customerName} (${input.customerEmail})`,
        `Estimated total: KES ${input.quote.totalCostKES.toLocaleString()}`,
      ],
    },
    {
      title: 'Day by Day Itinerary',
      lines: input.quote.itinerary.map(
        (day) => `Day ${day.day}: ${day.title} - ${day.description}`
      ),
    },
    {
      title: 'Recommended Hotels',
      lines: input.quote.top3Hotels.map((hotel) => `${hotel.name} - ${hotel.reason}`),
    },
    {
      title: 'Pricing Breakdown',
      lines: Object.entries(input.quote.pricingBreakdown).map(
        ([key, value]) => `${key.replace(/_/g, ' ')}: KES ${Number(value).toLocaleString()}`
      ),
    },
    {
      title: 'Notes',
      lines: [input.quote.notes, input.settings.itinerary.footerNote],
    },
  ];

  if (input.settings.itinerary.includeContactInfo) {
    sections.push({
      title: 'Contact Information',
      lines: getContactLines(input.settings.contactInfo),
    });
  }

  for (const section of sections) {
    page.drawText(section.title, {
      x: 40,
      y: cursorY,
      font: bold,
      size: 15,
      color: accentColor,
    });
    cursorY -= 22;

    for (const line of section.lines) {
      const safeLine = line || '-';
      const wrapped = safeLine.match(/.{1,88}(\s|$)/g) || [safeLine];
      for (const segment of wrapped) {
        page.drawText(segment.trim(), {
          x: 46,
          y: cursorY,
          font,
          size: 10.5,
          color: textColor,
        });
        cursorY -= 15;
      }
      cursorY -= 4;
    }

    cursorY -= 8;
  }

  if (input.settings.itinerary.includeCopyright) {
    page.drawText(SAFARIQUOTE_COPYRIGHT, {
      x: 40,
      y: 26,
      font,
      size: 9,
      color: rgb(0.42, 0.45, 0.5),
    });
  }

  return pdfDoc.save();
}
