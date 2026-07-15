// Server-side AI proxy — Google Gemini (free tier). The API key lives only in
// the Netlify environment (GEMINI_API_KEY); it is never shipped to the browser.
// Two actions: "verify" (vision catch check) and "rules" (grounded chat).

const MODEL = "gemini-flash-lite-latest";
// Disable Gemini 2.5's default "thinking" — unneeded for species ID / rules Q&A,
// and it conserves the free-tier token budget over a weekend of catches.
const NO_THINKING = { thinkingConfig: { thinkingBudget: 0 } };
const ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

const json = (status, body) => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(503, { error: "AI not configured (no GEMINI_API_KEY)." });

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  try {
    if (payload.action === "verify") {
      return json(200, { verification: await verify(apiKey, payload) });
    }
    if (payload.action === "rules") {
      return json(200, { text: await rules(apiKey, payload) });
    }
    return json(400, { error: "Unknown action." });
  } catch (err) {
    return json(502, { error: String(err?.message || err) });
  }
}

async function callGemini(apiKey, requestBody) {
  const res = await fetch(ENDPOINT(apiKey), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini request failed (${res.status})`);
  }
  const cand = data.candidates?.[0];
  if (!cand || cand.finishReason === "SAFETY") {
    throw new Error("Gemini declined the request — flag for manual M.O.C. review.");
  }
  return cand.content?.parts?.map((p) => p.text || "").join("") || "";
}

async function verify(apiKey, { imageBase64, mediaType, species, length, speciesList }) {
  const text = await callGemini(apiKey, {
    contents: [
      {
        role: "user",
        parts: [
          { inline_data: { mime_type: mediaType || "image/jpeg", data: imageBase64 } },
          {
            text: `You are the catch-verification judge for the Sea Robin Classic surf fishing tournament (Mid-Atlantic surf, Delaware/Maryland beaches).

Angler's claim: species = "${species}", length = ${length} inches.
Tournament species list: ${(speciesList || []).join(", ")}.

1. Identify the fish in the photo. Pick the closest match from the species list (or name what you actually see if it is not on the list).
2. Check whether a measuring device (tape measure, yardstick, ruler) is visible, and whether the claimed length is plausible given the photo. Skates and rays are measured wingtip to wingtip; all other fish nose to tail.
3. Give confidence 0-1 in your species identification, and short notes for the M.O.C.`,
          },
        ],
      },
    ],
    generationConfig: {
      ...NO_THINKING,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          speciesDetected: { type: "STRING" },
          matchesClaim: { type: "BOOLEAN" },
          measurementVisible: { type: "BOOLEAN" },
          lengthPlausible: { type: "BOOLEAN" },
          confidence: { type: "NUMBER" },
          notes: { type: "STRING" },
        },
        required: [
          "speciesDetected",
          "matchesClaim",
          "measurementVisible",
          "lengthPlausible",
          "confidence",
          "notes",
        ],
      },
    },
  });
  return JSON.parse(text);
}

async function rules(apiKey, { question, grounding, fullRules, history }) {
  const contents = (history || []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  contents.push({ role: "user", parts: [{ text: question }] });

  return callGemini(apiKey, {
    systemInstruction: {
      parts: [
        {
          text: `You are the official Rules Assistant of the Sea Robin Classic Surf Fishing Tournament (S.R.C.S.F.T.). Answer ONLY from the Official Rules and Regulations provided below. Be direct, cite the relevant rule section by name, and keep the tournament's tongue-in-cheek ceremonial tone (the M.O.C.'s word is final). If the rules don't cover something, say the M.O.C. will regulate it "solely and without debate."

THE UNOFFICIAL LEGENDS: When the question is about one of the tournament's unofficial legends (any section titled "... (Unofficial Legend)" — e.g. the Derek Clause, the Sandimas Cheeseburger Phenomenon, the 3-Room Vacation Home), keep the tone playful and ceremonial but keep it SHORT and funny — a punchy few sentences that hit the key beats and named characters. Never pad it into a wall of text.

MOST RELEVANT SECTIONS FOR THIS QUESTION:
${grounding || ""}

FULL RULEBOOK:
${fullRules || ""}`,
        },
      ],
    },
    generationConfig: { ...NO_THINKING },
    contents,
  });
}
