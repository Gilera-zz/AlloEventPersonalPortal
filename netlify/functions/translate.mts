import type { Context, Config } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface TranslatePayload {
  fields: Record<string, string>;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { fields } = (await req.json()) as TranslatePayload;

  if (!fields || Object.keys(fields).length === 0) {
    return Response.json({ translations: {} });
  }

  const entries = Object.entries(fields).filter(
    ([, v]) => typeof v === "string" && v.trim().length > 0,
  );

  if (entries.length === 0) {
    return Response.json({ translations: {} });
  }

  const fieldList = entries
    .map(([key, value]) => `<field name="${key}">\n${value}\n</field>`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Translate the following Swedish text fields to English. Keep the same tone and style. Preserve line breaks, times, and formatting. Convert Swedish date formats to English (e.g. "20 Maj 2026" → "May 20th 2026"). Do NOT translate proper nouns (company names, venue names, brand names).

Return ONLY a JSON object where keys are the field names and values are the English translations. No markdown, no explanation.

${fieldList}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const translations = JSON.parse(text.trim());
    return Response.json({ translations });
  } catch {
    return Response.json(
      { error: "Failed to parse translation response", raw: text },
      { status: 500 },
    );
  }
};

export const config: Config = {
  path: "/api/translate",
  method: "POST",
};
