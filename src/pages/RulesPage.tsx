import { useRef, useState } from "react";
import { aiAvailable, askRulesAssistant, offlineRulesAnswer } from "../ai/claude";
import { RULE_SECTIONS } from "../domain/rules";
import { findAnglerLore } from "../domain/anglerLore";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "What is the DQ time for Saturday?",
  "Can I fish from the jetty?",
  "How are skates measured?",
  "What happens if I leave early?",
  "What does the Champion have to do next year?",
];

export function RulesPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");

    const lore = findAnglerLore(q);
    if (lore) {
      setMessages((m) => [...m, { role: "assistant", content: lore }]);
      setTimeout(() => logRef.current?.scrollIntoView({ block: "end" }), 50);
      return;
    }

    setBusy(true);
    try {
      let answer: string;
      if (aiAvailable()) {
        try {
          answer = await askRulesAssistant(q, history);
        } catch {
          answer = offlineRulesAnswer(q);
        }
      } else {
        answer = offlineRulesAnswer(q);
      }
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } finally {
      setBusy(false);
      setTimeout(() => logRef.current?.scrollIntoView({ block: "end" }), 50);
    }
  };

  return (
    <div className="page">
      <div className="page-kicker">Official Rules &amp; Regulations</div>
      <h2 className="page-title">Rules &amp; Question Assistant</h2>
      <p className="page-sub">
        Grounded in the Official S.R.C.S.F.T. Rules and Regulations. The M.O.C.'s decision is always
        final.
      </p>

      {messages.length === 0 && (
        <div className="card">
          <h3>Try asking</h3>
          {STARTERS.map((s) => (
            <button
              key={s}
              className="btn ghost small"
              style={{ margin: "0 6px 8px 0" }}
              onClick={() => ask(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="chat-log" ref={logRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content.replace(/\*\*/g, "")}
          </div>
        ))}
        {busy && <div className="bubble assistant">Consulting our SRC gods…</div>}
      </div>

      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(input)}
          placeholder="Ask about tackle, boundaries, scoring…"
        />
        <button className="btn" onClick={() => ask(input)} disabled={busy}>
          Ask
        </button>
      </div>
      {!aiAvailable() && (
        <p style={{ color: "var(--sand-faint)", fontSize: 12.5, marginTop: 8 }}>
          Offline rulebook mode — answers quote the rules directly. The full AI assistant activates
          when the backend is deployed and you're online.
        </p>
      )}

      <button className="btn ghost" style={{ marginTop: 18 }} onClick={() => setShowBook(!showBook)}>
        {showBook ? "Hide" : "Read"} the full rulebook
      </button>
      {showBook &&
        RULE_SECTIONS.map((s) => (
          <div className="card" key={s.id} style={{ marginTop: 10 }}>
            <h3>{s.title}</h3>
            <p style={{ fontSize: 14, color: "var(--sand-dim)" }}>{s.text}</p>
          </div>
        ))}
    </div>
  );
}
