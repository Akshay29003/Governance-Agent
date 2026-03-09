// server.js — Azure AI Foundry Agent Middleware
// Auth: Entra ID via DefaultAzureCredential (auto-refresh, no stored secrets)
// Endpoints: /api/risks, /api/workstreams, /api/milestones, /api/summary

import express from "express";
import cors from "cors";
import { DefaultAzureCredential } from "@azure/identity";
import https from "https";
const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });
import axios from "axios";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
app.use(cors());
app.use(express.json());

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const BASE_URL =
  "https://eastus.api.azureml.ms/agents/v1.0/subscriptions/157a8051-8b29-4fca-86bb-b4fe44590081/resourceGroups/akshay_testrg/providers/Microsoft.MachineLearningServices/workspaces/akshay_testaiprj1";

const AGENT_ID = "asst_h0OPGKuqjpsFMnLqWzCEskPF";
const API_VERSION = "2025-01-01-preview";
const TOKEN_SCOPE = "https://ai.azure.com/.default";

const credential = new DefaultAzureCredential();

// ─── AUTH HELPER ─────────────────────────────────────────────────────────────

async function getBearerToken() {
  const tokenResponse = await credential.getToken(TOKEN_SCOPE);
  if (!tokenResponse?.token) {
    throw new Error("Failed to acquire Entra ID token");
  }
  return tokenResponse.token;
}

// ─── FOUNDRY API HELPERS ─────────────────────────────────────────────────────

async function foundryFetch(path, options = {}) {
  const token = await getBearerToken();
  const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}api-version=${API_VERSION}`;

  const response = await axios({
    method: options.method || "GET",
    url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: options.body ? JSON.parse(options.body) : undefined,
    timeout: 90000,
    httpsAgent,
  });

  return response.data;
}

async function createThread() {
  const data = await foundryFetch("/threads", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return data.id;
}

async function postMessage(threadId, content) {
  await foundryFetch(`/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ role: "user", content }),
  });
}

async function createRun(threadId) {
  const data = await foundryFetch(`/threads/${threadId}/runs`, {
    method: "POST",
    body: JSON.stringify({ assistant_id: AGENT_ID }),
  });
  return data.id;
}

async function pollRunUntilComplete(threadId, runId, { intervalMs = 1500, timeoutMs = 120_000 } = {}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const run = await foundryFetch(`/threads/${threadId}/runs/${runId}`);

    if (run.status === "completed") return run;

    if (["failed", "cancelled", "expired"].includes(run.status)) {
      throw new Error(`Run ended with status: ${run.status} — ${run.last_error?.message || "no details"}`);
    }

    // Status is queued | in_progress | requires_action — keep polling
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(`Run timed out after ${timeoutMs / 1000}s`);
}

async function getLatestAssistantMessage(threadId) {
  const data = await foundryFetch(`/threads/${threadId}/messages?limit=10&order=desc`);
  const assistantMsg = data.data?.find((m) => m.role === "assistant");

  if (!assistantMsg) throw new Error("No assistant message found in thread");

  // Flatten content blocks into a single string
  return assistantMsg.content
    .filter((block) => block.type === "text")
    .map((block) => block.text?.value ?? "")
    .join("\n")
    .trim();
}

// ─── CORE: ASK AGENT ─────────────────────────────────────────────────────────
// Each request gets a fresh thread (stateless, safe for concurrent users)

async function askAgent(prompt) {
  const threadId = await createThread();
  await postMessage(threadId, prompt);
  const runId = await createRun(threadId);
  await pollRunUntilComplete(threadId, runId);
  return getLatestAssistantMessage(threadId);
}

// ─── GOVERNANCE PROMPTS ───────────────────────────────────────────────────────

const PROMPTS = {
  risks: `You are a project governance assistant. 
Analyse the project knowledge base and return the current risk register as a JSON array.
Each risk object must have exactly these fields:
  id (string), title (string), description (string),
  severity ("High"|"Medium"|"Low"), probability ("High"|"Medium"|"Low"),
  status ("Open"|"Mitigated"|"Closed"), owner (string), mitigation (string).
Respond ONLY with the raw JSON array — no markdown, no explanation.`,

  workstreams: `You are a project governance assistant.
Analyse the project knowledge base and return all active workstreams as a JSON array.
Each workstream object must have exactly these fields:
  id (string), name (string), description (string), lead (string),
  status ("On Track"|"At Risk"|"Delayed"|"Complete"),
  progress (integer 0-100), startDate (ISO date string), endDate (ISO date string).
Respond ONLY with the raw JSON array — no markdown, no explanation.`,

  milestones: `You are a project governance assistant.
Analyse the project knowledge base and return all project milestones as a JSON array.
Each milestone object must have exactly these fields:
  id (string), title (string), description (string), dueDate (ISO date string),
  status ("Upcoming"|"In Progress"|"Complete"|"Overdue"),
  workstream (string), owner (string).
Respond ONLY with the raw JSON array — no markdown, no explanation.`,

  summary: `You are a project governance assistant.
Analyse the project knowledge base and return an executive summary as a single JSON object.
The object must have exactly these fields:
  projectName (string), overallStatus ("Green"|"Amber"|"Red"),
  lastUpdated (ISO date string), headline (string, ≤ 2 sentences),
  keyAchievements (array of strings), topRisks (array of strings, max 3),
  nextSteps (array of strings, max 3), openActions (integer), completedMilestones (integer),
  totalMilestones (integer).
Respond ONLY with the raw JSON object — no markdown, no explanation.`,
};

// ─── ROUTE FACTORY ───────────────────────────────────────────────────────────

function makeGovernanceRoute(promptKey) {
  return async (req, res) => {
    res.setTimeout(200000);
    console.log(`[${promptKey.toUpperCase()}] request received`);
    try {
      console.log("1. creating thread...");
      const threadId = await createThread();
      console.log("2. thread created:", threadId);
      await postMessage(threadId, PROMPTS[promptKey]);
      console.log("3. message posted");
      const runId = await createRun(threadId);
      console.log("4. run created:", runId);
      await pollRunUntilComplete(threadId, runId, {
        intervalMs: 2000,
        timeoutMs: 180000,  // 3 minutes — was implicitly 120s
      });
      console.log("5. run complete");
      const raw = await getLatestAssistantMessage(threadId);
      console.log("6. got message");
      console.log("RAW RESPONSE:", raw);
      
      // Strip accidental markdown fences before parsing
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(clean);

      res.json({ success: true, data: parsed, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error(`[${promptKey.toUpperCase()}] error:`, err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

// ─── GOVERNANCE ENDPOINTS ─────────────────────────────────────────────────────

app.get("/api/risks",        makeGovernanceRoute("risks"));
app.get("/api/workstreams",  makeGovernanceRoute("workstreams"));
app.get("/api/milestones",   makeGovernanceRoute("milestones"));
app.get("/api/summary",      makeGovernanceRoute("summary"));

// ─── GENERIC CHAT ENDPOINT (optional — for free-form dashboard queries) ───────

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ success: false, error: "message is required" });
  }
  console.log("[CHAT] request:", message.slice(0, 80));
  try {
    const reply = await askAgent(message);
    res.json({ success: true, reply, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[CHAT] error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get("/api/health", async (_req, res) => {
  try {
    await getBearerToken(); // Confirms credential chain is working
    res.json({ status: "ok", agent: AGENT_ID, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "error", error: err.message });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Governance middleware running on http://localhost:${PORT}`);
  console.log(`   Agent: ${AGENT_ID}`);
  console.log(`   Auth:  DefaultAzureCredential (Entra ID)`);
});
