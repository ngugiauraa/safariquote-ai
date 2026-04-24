import OpenAI from 'openai';

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

export async function generateSafariQuote(company: any, formData: any) {
  const systemPrompt = `You are an expert Kenyan safari planner for ${company.name}.
Use ONLY the following company rates:
Vehicles: ${JSON.stringify(company.vehicles || [])}
Hotels: ${JSON.stringify(company.hotels || [])}

Customer request: ${JSON.stringify(formData)}

Rules:
- Create a logical day-by-day itinerary respecting start/end dates, transport type, and multiple destinations.
- If no destinations are selected, suggest a perfect custom trip based on budget, pax, and days.
- Include realistic park fees, meals, and transfers.
- Recommend exactly 3 hotels from the company's list with short reasons.
- Output ONLY valid JSON with these keys: 
  itinerary (array of days), 
  pricingBreakdown (object), 
  totalCostKES (number), 
  top3Hotels (array), 
  notes (string).`;

  const completion = await grok.chat.completions.create({
    model: "grok-4.20-reasoning",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate the quote now." }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content!);
}