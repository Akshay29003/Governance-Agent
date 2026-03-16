# Intelligent Project Governance Agent
### AI-Powered Full-Stack Portfolio Project — Stage 1 Complete

A production-deployed AI application on Microsoft Azure that acts as a **virtual PMO analyst** — reading an unstructured project knowledge base and generating live governance outputs on demand.

🔗 **Live Dashboard:** https://salmon-field-04d6f670f.4.azurestaticapps.net

---

## What It Does

No hardcoded data. No static dashboards. The system ingests a project knowledge base document and surfaces:

- **Risk Register** — live risk identification with severity, probability, owner, and mitigation
- **Workstream Status** — RAG status and progress for all active workstreams
- **Milestone Tracker** — upcoming, in-progress, and completed milestones
- **Executive Summary** — overall project health, key achievements, and next steps

All outputs are generated in real time by an Azure AI Foundry Agent.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React.js → Azure Static Web Apps |
| Middleware | Node.js + Express → Azure Container Apps |
| AI Agent | Azure AI Foundry (Agent + Knowledge Base) |
| Auth | Microsoft Entra ID — direct OAuth2 token flow |
| CI/CD | GitHub Actions → Docker → GHCR |

---

## Key Technical Decisions

**Direct OAuth2 over Azure SDK** — Replaced `ClientSecretCredential` SDK with a direct `axios` POST to Microsoft's token endpoint after diagnosing network egress restrictions inside Container Apps.

**GHCR over ACR** — Used GitHub Container Registry to stay within free-tier budget while maintaining full CI/CD capability.

**Container Apps over Azure Functions** — Selected for persistent middleware after Azure Functions quota failures, enabling reliable 3-minute AI agent polling cycles.

**Sequential API Loading** — Resolved concurrent timeout failures by loading all four governance endpoints sequentially, preventing agent thread collisions on the Foundry backend.

---

## Delivery Challenges Resolved

| Challenge | Resolution |
|-----------|-----------|
| TLS Handshake Failures | Diagnosed SSL errors calling Azure AI Foundry from containerised middleware |
| ESM/CommonJS Conflict | Fixed mixed module syntax causing silent runtime failures |
| Azure SDK Network Block | Replaced SDK auth with direct axios OAuth2 call |
| API Key Exposure | Detected accidental commit, rotated all affected credentials |
| Container Auth Failure | Resolved IMDS unreachability by switching to service principal |

---

## PM Contribution

Built as a portfolio project to demonstrate AI Delivery capability at a technical level. All architectural decisions, trade-off calls, and delivery ownership by **Akshay Kaul** (Senior IT Project Manager, 15 years experience). AI assistance used for code generation.

---

## Stage 2 Roadmap

- Dynamic document ingestion — upload any project document, dashboard auto-adapts
- Multi-project support
- Gantt-style milestone timeline
- One-click steering committee report export (PDF)
- Role-based access control

---

*Built by Akshay Kaul — Greater Noida | Targeting: Digital Transformation PM · AI Delivery Manager · Technology Consulting Manager*
