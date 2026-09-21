// AI suggestions for a garland's name and description, written from its photos.
// Server only. Needs ANTHROPIC_API_KEY. Never import this file from a client component.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Suggestion } from "./suggestion";

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

const Languages = z.object({
  en: z.string(),
  hi: z.string(),
  te: z.string(),
  ur: z.string(),
});

const ListingSchema = z.object({
  name: Languages,
  description: Languages,
});

const SYSTEM = `You write product listings for Aarifa Flowers, a small shop in India that sells fresh handmade flower garlands for weddings, pooja, events and special occasions.

You will see photos of one garland. Write its listing: a name and a short description, each in English, Hindi, Telugu and Urdu.

The name appears on the product card. Make it specific and short, like "Premium Rose & Jasmine Bridal Garland" or "Festive Marigold Door Toran".
The description is two short sentences about how the garland looks and where it suits.

Describe only what the photos show. Use the flowers and colours you can actually see. Do not invent sizes, prices, delivery promises, or claims such as "same day". The shop owner may add hints about the occasion, type or flowers. Treat hints as likely but let the photo win if they disagree.

Write Hindi in Devanagari, Telugu in Telugu script, and Urdu in Urdu script. Use natural everyday wording that a customer would say, not a word-for-word translation. Keep "WhatsApp" out of the text.`;

export type SuggestHints = { occasions: string[]; types: string[]; flowers: string[] };

export class SuggestError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

/** `images` are base64 JPEG strings without the data: prefix. */
export async function suggestListing(images: string[], hints: SuggestHints): Promise<Suggestion> {
  if (!aiConfigured()) {
    throw new SuggestError("AI suggestions are not turned on yet. Add ANTHROPIC_API_KEY in the settings. See the README.", 503);
  }

  const hintLines = [
    hints.occasions.length ? `Occasion: ${hints.occasions.join(", ")}` : "",
    hints.types.length ? `Type: ${hints.types.join(", ")}` : "",
    hints.flowers.length ? `Flowers: ${hints.flowers.join(", ")}` : "",
  ].filter(Boolean);

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            ...images.map(
              (data) =>
                ({
                  type: "image",
                  source: { type: "base64", media_type: "image/jpeg", data },
                }) as const,
            ),
            {
              type: "text",
              text: hintLines.length
                ? `Write the listing for this garland.\n\nHints from the shop owner:\n${hintLines.join("\n")}`
                : "Write the listing for this garland.",
            },
          ],
        },
      ],
      output_config: { effort: "medium", format: zodOutputFormat(ListingSchema) },
    });

    if (response.stop_reason === "refusal") {
      throw new SuggestError("The AI could not write a suggestion for these photos. Please write the text yourself.", 422);
    }
    const out = response.parsed_output;
    if (!out) throw new SuggestError("The AI answer could not be read. Please try again.", 502);

    const clean = (s: string, max: number) => s.trim().slice(0, max);
    return {
      name: { en: clean(out.name.en, 120), hi: clean(out.name.hi, 120), te: clean(out.name.te, 120), ur: clean(out.name.ur, 120) },
      description: {
        en: clean(out.description.en, 600),
        hi: clean(out.description.hi, 600),
        // Telugu ends sentences with a plain full stop. The model sometimes uses the Hindi danda.
        te: clean(out.description.te, 600).replace(/।/g, "."),
        ur: clean(out.description.ur, 600),
      },
    };
  } catch (err) {
    if (err instanceof SuggestError) throw err;
    if (err instanceof Anthropic.AuthenticationError) {
      throw new SuggestError("The AI key is not valid. Check ANTHROPIC_API_KEY.", 502);
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new SuggestError("The AI is busy right now. Please try again in a minute.", 429);
    }
    if (err instanceof Anthropic.APIError) {
      console.error("AI request failed", err.status, err.message);
      throw new SuggestError("The AI request failed. Please try again.", 502);
    }
    throw err;
  }
}
