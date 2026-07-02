import { FULL_RULES_TEXT, retrieveSections } from "../domain/rules";
import { cloudEnabled } from "../data/supabase";

// AI runs through the Netlify function (netlify/functions/ai.mjs) so the
// Anthropic API key stays server-side. `aiAvailable` gates the UI hints; calls
// still fall back gracefully if the endpoint is unreachable (local/offline).

const ENDPOINT = "/.netlify/functions/ai";

/** AI features are available when the cloud backend is configured and online. */
export function aiAvailable(): boolean {
  return cloudEnabled && navigator.onLine;
}

export interface CatchVerification {
  speciesDetected: string;
  matchesClaim: boolean;
  measurementVisible: boolean;
  lengthPlausible: boolean;
  confidence: number; // 0-1
  notes: string;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function callFunction<T>(body: unknown): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new Error(info.error || `AI request failed (${res.status})`);
  }
  return res.json();
}

/** Vision verification: identify the species + sanity-check the claimed length. */
export async function verifyCatchPhoto(
  photo: Blob,
  claimedSpecies: string,
  claimedLength: number,
  speciesList: string[],
): Promise<CatchVerification> {
  const { verification } = await callFunction<{ verification: CatchVerification }>({
    action: "verify",
    imageBase64: await blobToBase64(photo),
    mediaType: photo.type || "image/jpeg",
    species: claimedSpecies,
    length: claimedLength,
    speciesList,
  });
  return verification;
}

/** Conversational rules assistant grounded in the official rulebook (RAG). */
export async function askRulesAssistant(
  question: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const grounding = retrieveSections(question, 5)
    .map((s) => `### ${s.title}\n${s.text}`)
    .join("\n\n");
  const { text } = await callFunction<{ text: string }>({
    action: "rules",
    question,
    grounding,
    fullRules: FULL_RULES_TEXT,
    history,
  });
  return text;
}

/** Offline / no-backend fallback: answer straight from retrieved rule text. */
export function offlineRulesAnswer(question: string): string {
  const sections = retrieveSections(question, 2);
  if (sections.length === 0) {
    return "Nothing in the Official Rules covers that. Per Section 7, anything not explicitly covered is regulated solely and without debate by E.W. Keresty, A.A.M.O.C. of the S.R.C.S.F.T.";
  }
  return sections.map((s) => `**${s.title}**\n${s.text}`).join("\n\n");
}
