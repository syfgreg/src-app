import Anthropic from "@anthropic-ai/sdk";

// Server-side AI proxy. The Anthropic API key lives only in the Netlify
// environment (ANTHROPIC_API_KEY) — it is never shipped to the browser.
// Two actions: "verify" (vision catch check) and "rules" (grounded chat).

const MODEL = "claude-opus-4-8";

const json = (status, body) => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(503, { error: "AI not configured (no ANTHROPIC_API_KEY)." });

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const client = new Anthropic({ apiKey });

  try {
    if (payload.action === "verify") {
      return json(200, { verification: await verify(client, payload) });
    }
    if (payload.action === "rules") {
      return json(200, { text: await rules(client, payload) });
    }
    return json(400, { error: "Unknown action." });
  } catch (err) {
    return json(502, { error: String(err?.message || err) });
  }
}

async function verify(client, { imageBase64, mediaType, species, length, speciesList }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            speciesDetected: { type: "string" },
            matchesClaim: { type: "boolean" },
            measurementVisible: { type: "boolean" },
            lengthPlausible: { type: "boolean" },
            confidence: { type: "number" },
            notes: { type: "string" },
          },
          required: [
            "speciesDetected",
            "matchesClaim",
            "measurementVisible",
            "lengthPlausible",
            "confidence",
            "notes",
          ],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
          {
            type: "text",
            text: `You are the catch-verification judge for the Sea Robin Classic surf fishing tournament (Mid-Atlantic surf, Delaware/Maryland beaches).

Angler's claim: species = "${species}", length = ${length} inches.
Tournament species list: ${(speciesList || []).join(", ")}.

1. Identify the fish in the photo. Pick the closest match from the species list (or name what you actually see if it is not on the list).
2. Check whether a measuring device (tape measure, yardstick, ruler) is visible, and whether the claimed length is plausible given the photo. Skates are measured wingtip to wingtip.
3. Give confidence 0-1 in your species identification, and short notes for the M.O.C.`,
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Verification declined — flag for manual M.O.C. review.");
  }
  const text = response.content.find((b) => b.type === "text");
  if (!text) throw new Error("No verification result returned.");
  return JSON.parse(text.text);
}

async function rules(client, { question, grounding, fullRules, history }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are the official Rules Assistant of the Sea Robin Classic Surf Fishing Tournament (S.R.C.S.F.T.). Answer ONLY from the Official Rules and Regulations provided below. Be direct, cite the relevant rule section by name, and keep the tournament's tongue-in-cheek ceremonial tone (the M.O.C.'s word is final). If the rules don't cover something, say the M.O.C. will regulate it "solely and without debate."

MOST RELEVANT SECTIONS FOR THIS QUESTION:
${grounding || ""}

FULL RULEBOOK:
${fullRules || ""}`,
    messages: [...(history || []), { role: "user", content: question }],
  });

  if (response.stop_reason === "refusal") {
    return "The Assistant declines to answer that one. Take it up with the M.O.C.";
  }
  const text = response.content.find((b) => b.type === "text");
  return text ? text.text : "No answer returned.";
}
