import { google } from 'googleapis';

type SheetAppendPayload = {
  customerName?: string;
  customerEmail?: string;
  destinations?: string[];
  pax?: number;
  budget?: string;
  transport?: string;
  totalKES?: number;
  quoteId?: string | null;
};

export async function appendToGoogleSheet(sheetId: string, data: SheetAppendPayload) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A:Z',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        new Date().toISOString(),
        data.customerName || '',
        data.customerEmail || '',
        JSON.stringify(data.destinations || []),
        data.pax || '',
        data.budget || '',
        data.transport || '',
        data.totalKES || '',
        data.quoteId || ''
      ]]
    }
  });
}
