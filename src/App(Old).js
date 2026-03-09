import { useState } from "react";

const RISKS = [
  { id: "R001", desc: "Schema compatibility Oracle on-prem to Azure SQL", rag: "RED", owner: "Suresh Patel", mitigation: "Azure DB Migration POC underway" },
  { id: "R004", desc: "Test environment dependency on WS3 completion", rag: "RED", owner: "Meera Iyer", mitigation: "Parallel track initiated" },
  { id: "R002", desc: "Network firewall approvals slower than planned", rag: "AMBER", owner: "Priya Nair", mitigation: "Escalated to CISO" },
  { id: "R003", desc: "3 legacy apps incompatible with lift-and-shift", rag: "AMBER", owner: "Meera Iyer", mitigation: "$180K re-architecture requested" },
];

const WORKSTREAMS = [
  { name: "WS1 — Infrastructure Setup", pct: 85, rag: "GREEN" },
  { name: "WS2 — Data Migration", pct: 32, rag: "RED" },
  { name: "WS3 — Network & Security", pct: 58, rag: "AMBER" },
  { name: "WS4 — Application Testing", pct: 71, rag: "GREEN" },
  { name: "WS5 — User Training", pct: 90, rag: "GREEN" },
  { name: "WS6 — Cutover Planning", pct: 45, rag: "AMBER" },
];

const ragColor = { RED: "#ff4d4d", AMBER: "#ffaa00", GREEN: "#00d68f" };
const ragBg = { RED: "rgba(255,77,77,0.12)", AMBER: "rgba(255,170,0,0.12)", GREEN: "rgba(0,214,143,0.12)" };

export default function App() {
  const [messages, setMessages] = useState([
    { role: "agent", text: "Good day. I am your Project Governance Agent. Ask me about risks, workstreams, milestones, or request a steering committee briefing." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_ENDPOINT}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2025-01-01-preview`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "api-key": process.env.REACT_APP_API_KEY 
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are an Intelligent Project Governance Agent for a Cloud Migration Programme. Risks: R001 (RED, Suresh Patel - Oracle schema compatibility), R002 (AMBER, Priya Nair - firewall approvals), R003 (AMBER, Meera Iyer - legacy apps, $180K budget), R004 (RED, Meera Iyer - test environment WS3 dependency). Always cite Risk IDs, RAG status, owners. Be concise and action-oriented." },
              { role: "user", content: userMsg }
            ],
            max_tokens: 500
          })
        }
      );
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Unable to retrieve response.";
      setMessages(prev => [...prev, { role: "agent", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", text: "Connection error. Please check your API key." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "#080f1a", minHeight: "100vh", color: "#e8edf3", fontFamily: "system-ui, sans-serif" }}>
      
      {/* Header */}
      <div style={{ padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(8,15,26,0.95)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #f0b429, #ff8c00)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚖️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Project Governance Dashboard</div>
            <div style={{ fontSize: 10, color: "#5a7a9a", letterSpacing: 2, textTransform: "uppercase" }}>Cloud Migration Programme · Azure AI</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.2)", padding: "5px 12px", borderRadius: 20, fontSize: 10, color: "#00d68f" }}>
          <div style={{ width: 6, height: 6, background: "#00d68f", borderRadius: "50%" }}></div>
          AGENT CONNECTED
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, padding: "24px 32px 0" }}>
        {[
          { label: "Critical Risks", value: 2, color: "#ff4d4d", sub: "RED — Immediate action" },
          { label: "Amber Risks", value: 2, color: "#ffaa00", sub: "Monitor closely" },
          { label: "On Track", value: 4, color: "#00d68f", sub: "of 6 workstreams" },
          { label: "Decisions Needed", value: 3, color: "#4dabf7", sub: "Steering committee" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, borderTop: `2px solid ${c.color}` }}>
            <div style={{ fontSize: 10, color: "#5a7a9a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: c.color, lineHeight: 1, marginBottom: 6 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "#5a7a9a" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "16px 32px" }}>

        {/* Risk Register */}
        <div style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: 13 }}>Risk Register</div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {RISKS.map(r => (
              <div key={r.id} style={{ background: "#111f30", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${ragColor[r.rag]}`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#f0b429", fontFamily: "monospace" }}>{r.id}</span>
                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: ragBg[r.rag], color: ragColor[r.rag], fontWeight: 700 }}>{r.rag}</span>
                </div>
                <div style={{ fontSize: 11, marginBottom: 4, lineHeight: 1.4 }}>{r.desc}</div>
                <div style={{ fontSize: 10, color: "#5a7a9a" }}>👤 {r.owner} · {r.mitigation}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Workstreams */}
        <div style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: 13 }}>Workstream Status</div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {WORKSTREAMS.map((ws, i) => (
              <div key={i} style={{ background: "#111f30", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{ws.name}</span>
                  <span style={{ fontSize: 11, color: ragColor[ws.rag], fontFamily: "monospace" }}>{ws.pct}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${ws.pct}%`, background: ragColor[ws.rag], borderRadius: 2 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Chat */}
        <div style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: 480 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: 13 }}>AI Governance Advisor</div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 10, fontSize: 11, lineHeight: 1.6, background: m.role === "user" ? "rgba(240,180,41,0.1)" : "#111f30", border: `1px solid ${m.role === "user" ? "rgba(240,180,41,0.2)" : "rgba(255,255,255,0.06)"}`, alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%" }}>
                {m.text}
              </div>
            ))}
            {loading && <div style={{ padding: "10px 12px", background: "#111f30", borderRadius: 10, fontSize: 11, color: "#5a7a9a" }}>Thinking...</div>}
          </div>
          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your project..."
              style={{ flex: 1, background: "#111f30", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 12px", color: "#e8edf3", fontSize: 11, outline: "none" }}
            />
            <button onClick={sendMessage} style={{ background: "#f0b429", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>➤</button>
          </div>
        </div>

      </div>
    </div>
  );
}