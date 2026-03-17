import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

const ragColor = { RED: "#ff4d4d", AMBER: "#ffaa00", GREEN: "#00d68f" };
const ragBg   = { RED: "rgba(255,77,77,0.12)", AMBER: "rgba(255,170,0,0.12)", GREEN: "rgba(0,214,143,0.12)" };

function toRag(status) {
  if (!status) return "AMBER";
  const s = status.toLowerCase();
  if (s === "red"   || s === "delayed"  || s === "overdue" || s === "high")   return "RED";
  if (s === "green" || s === "complete" || s === "on track")                  return "GREEN";
  return "AMBER";
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{
        width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)",
        borderTop: "2px solid #f0b429", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const [risks,       setRisks]       = useState([]);
  const [workstreams, setWorkstreams] = useState([]);
  const [milestones,  setMilestones]  = useState([]);
  const [summary,     setSummary]     = useState(null);

  const [loadingRisks,       setLoadingRisks]       = useState(true);
  const [loadingWorkstreams, setLoadingWorkstreams] = useState(true);
  const [loadingMilestones,  setLoadingMilestones]  = useState(true);
  const [loadingSummary,     setLoadingSummary]     = useState(true);

  const [errors, setErrors] = useState({});

  const [messages, setMessages] = useState([
    { role: "agent", text: "Good day. I am your Project Governance Agent. Ask me about risks, workstreams, milestones, or request a steering committee briefing." }
  ]);
  const [input,   setInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const loadAll = async () => {
      await fetchSummary();
      await fetchRisks();
      await fetchWorkstreams();
      await fetchMilestones();
    };
    loadAll();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  async function fetchRisks() {
    setLoadingRisks(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/risks`);
      if (data.success) setRisks(data.data);
      else throw new Error(data.error);
    } catch (err) {
      setErrors(e => ({ ...e, risks: err.message }));
    }
    setLoadingRisks(false);
  }

  async function fetchWorkstreams() {
    setLoadingWorkstreams(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/workstreams`);
      if (data.success) setWorkstreams(data.data);
      else throw new Error(data.error);
    } catch (err) {
      setErrors(e => ({ ...e, workstreams: err.message }));
    }
    setLoadingWorkstreams(false);
  }

  async function fetchMilestones() {
    setLoadingMilestones(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/milestones`);
      if (data.success) setMilestones(data.data);
      else throw new Error(data.error);
    } catch (err) {
      setErrors(e => ({ ...e, milestones: err.message }));
    }
    setLoadingMilestones(false);
  }

  async function fetchSummary() {
    setLoadingSummary(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/summary`);
      if (data.success) setSummary(data.data);
      else throw new Error(data.error);
    } catch (err) {
      setErrors(e => ({ ...e, summary: err.message }));
    }
    setLoadingSummary(false);
  }

  async function sendMessage() {
    if (!input.trim() || chatLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/chat`, { message: userMsg });
      const reply = data.success ? data.reply : "Unable to retrieve response.";
      setMessages(prev => [...prev, { role: "agent", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", text: "Connection error. Is the middleware running on port 3001?" }]);
    }
    setChatLoading(false);
  }

  const criticalRisks   = risks.filter(r => toRag(r.severity || r.rag) === "RED").length;
  const amberRisks      = risks.filter(r => toRag(r.severity || r.rag) === "AMBER").length;
  const onTrackWS       = workstreams.filter(ws => toRag(ws.status) === "GREEN").length;
  const decisionsNeeded = summary?.openActions ?? "—";

  const summaryCards = [
    { label: "Critical Risks",   value: criticalRisks,   color: "#ff4d4d", sub: "RED — Immediate action" },
    { label: "Amber Risks",      value: amberRisks,      color: "#ffaa00", sub: "Monitor closely" },
    { label: "On Track",         value: onTrackWS,       color: "#00d68f", sub: `of ${workstreams.length} workstreams` },
    { label: "Decisions Needed", value: decisionsNeeded, color: "#4dabf7", sub: "Open actions" },
  ];

  return (
    <div style={{ background: "#080f1a", minHeight: "100vh", color: "#e8edf3", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(8,15,26,0.95)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #f0b429, #ff8c00)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚖️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Project Governance Dashboard</div>
            <div style={{ fontSize: 10, color: "#5a7a9a", letterSpacing: 2, textTransform: "uppercase" }}>Cloud Migration Programme · Azure AI Foundry</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { fetchRisks(); fetchWorkstreams(); fetchMilestones(); fetchSummary(); }}
            style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.2)", padding: "5px 14px", borderRadius: 20, fontSize: 10, color: "#f0b429", cursor: "pointer" }}
          >
            ↻ Refresh
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.2)", padding: "5px 12px", borderRadius: 20, fontSize: 10, color: "#00d68f" }}>
            <div style={{ width: 6, height: 6, background: "#00d68f", borderRadius: "50%" }} />
            AGENT CONNECTED
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      {summary && !loadingSummary && (
        <div style={{ margin: "16px 32px 0", padding: "12px 18px", background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${ragColor[toRag(summary.overallStatus)]}`, borderRadius: 10, fontSize: 12, color: "#a0b4c8", lineHeight: 1.6 }}>
          <span style={{ color: ragColor[toRag(summary.overallStatus)], fontWeight: 700, marginRight: 8 }}>{summary.overallStatus}</span>
          {summary.headline}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, padding: "16px 32px 0" }}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, borderTop: `2px solid ${c.color}` }}>
            <div style={{ fontSize: 10, color: "#5a7a9a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: c.color, lineHeight: 1, marginBottom: 6 }}>
              {loadingSummary && i === 3 ? "—" : c.value}
            </div>
            <div style={{ fontSize: 11, color: "#5a7a9a" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Grid — Row 1: Risks, Workstreams, Chat */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "16px 32px 0" }}>

        {/* Risk Register */}
        <div style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Risk Register
            {errors.risks && <span style={{ fontSize: 10, color: "#ff4d4d" }}>⚠ {errors.risks}</span>}
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
            {loadingRisks ? <Spinner /> : risks.length === 0 ? (
              <div style={{ fontSize: 11, color: "#5a7a9a", padding: 12 }}>No risks returned.</div>
            ) : risks.map((r, i) => {
              const rag = toRag(r.severity || r.rag);
              return (
                <div key={r.id || i} style={{ background: "#111f30", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${ragColor[rag]}`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f0b429", fontFamily: "monospace" }}>{r.id}</span>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: ragBg[rag], color: ragColor[rag], fontWeight: 700 }}>{rag}</span>
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 4, lineHeight: 1.4 }}>{r.title || r.description}</div>
                  <div style={{ fontSize: 10, color: "#5a7a9a" }}>👤 {r.owner} · {r.mitigation}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workstream Status */}
        <div style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Workstream Status
            {errors.workstreams && <span style={{ fontSize: 10, color: "#ff4d4d" }}>⚠ {errors.workstreams}</span>}
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
            {loadingWorkstreams ? <Spinner /> : workstreams.length === 0 ? (
              <div style={{ fontSize: 11, color: "#5a7a9a", padding: 12 }}>No workstreams returned.</div>
            ) : workstreams.map((ws, i) => {
              const rag = toRag(ws.status);
              const pct = ws.progress ?? 0;
              return (
                <div key={ws.id || i} style={{ background: "#111f30", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{ws.name}</span>
                    <span style={{ fontSize: 11, color: ragColor[rag], fontFamily: "monospace" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: ragColor[rag], borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#5a7a9a", marginTop: 4 }}>👤 {ws.lead} · {ws.status}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Chat */}
        <div style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: 480 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: 13 }}>AI Governance Advisor</div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 10, fontSize: 11, lineHeight: 1.6, background: m.role === "user" ? "rgba(240,180,41,0.1)" : "#111f30", border: `1px solid ${m.role === "user" ? "rgba(240,180,41,0.2)" : "rgba(255,255,255,0.06)"}`, alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%", whiteSpace: "pre-wrap" }}>
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div style={{ padding: "10px 12px", background: "#111f30", borderRadius: 10, fontSize: 11, color: "#5a7a9a" }}>Thinking...</div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your project..."
              style={{ flex: 1, background: "#111f30", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 12px", color: "#e8edf3", fontSize: 11, outline: "none" }}
            />
            <button
              onClick={sendMessage}
              disabled={chatLoading}
              style={{ background: chatLoading ? "#555" : "#f0b429", border: "none", borderRadius: 8, width: 32, height: 32, cursor: chatLoading ? "default" : "pointer", fontSize: 14 }}
            >➤</button>
          </div>
        </div>
      </div>

      {/* Row 2: Milestones + Executive Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "16px 32px 32px" }}>

        {/* Milestones */}
        <div style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Milestones
            {errors.milestones && <span style={{ fontSize: 10, color: "#ff4d4d" }}>⚠ {errors.milestones}</span>}
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
            {loadingMilestones ? <Spinner /> : milestones.length === 0 ? (
              <div style={{ fontSize: 11, color: "#5a7a9a", padding: 12 }}>No milestones returned.</div>
            ) : milestones.map((m, i) => {
              const rag = toRag(m.status);
              return (
                <div key={m.id || i} style={{ background: "#111f30", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${ragColor[rag]}`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{m.title}</span>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: ragBg[rag], color: ragColor[rag], fontWeight: 700 }}>{m.status}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#5a7a9a" }}>📅 {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—"} · 👤 {m.owner} · {m.workstream}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{ background: "#0d1825", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: 13 }}>
            Executive Summary
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, maxHeight: 340, overflowY: "auto" }}>
            {loadingSummary ? <Spinner /> : !summary ? (
              <div style={{ fontSize: 11, color: "#5a7a9a", padding: 12 }}>No summary returned.</div>
            ) : (
              <>
                {summary.keyAchievements?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: "#f0b429", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Key Achievements</div>
                    {summary.keyAchievements.map((a, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#a0b4c8", lineHeight: 1.6, paddingLeft: 8, borderLeft: "2px solid rgba(0,214,143,0.3)", marginBottom: 4 }}>✓ {a}</div>
                    ))}
                  </div>
                )}
                {summary.topRisks?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: "#ff4d4d", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Top Risks</div>
                    {summary.topRisks.map((r, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#a0b4c8", lineHeight: 1.6, paddingLeft: 8, borderLeft: "2px solid rgba(255,77,77,0.3)", marginBottom: 4 }}>⚠ {r}</div>
                    ))}
                  </div>
                )}
                {summary.nextSteps?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: "#4dabf7", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Next Steps</div>
                    {summary.nextSteps.map((s, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#a0b4c8", lineHeight: 1.6, paddingLeft: 8, borderLeft: "2px solid rgba(77,171,247,0.3)", marginBottom: 4 }}>→ {s}</div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#5a7a9a", marginTop: 4 }}>
                  {summary.completedMilestones ?? 0} of {summary.totalMilestones ?? 0} milestones complete · {summary.openActions ?? 0} open actions
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}