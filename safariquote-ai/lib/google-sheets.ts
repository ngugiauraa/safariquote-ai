import { google } from 'googleapis';
export async function appendToGoogleSheet(sheetId: string, data: any) {
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