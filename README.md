# 🛰️ ClarityOS: The Autonomous Meeting Swarm
> **Eliminating Ambiguity. Shipping Clarity. End-to-End.**

ClarityOS is a high-fidelity, autonomous multi-agent platform designed to audit live corporate meetings, neutralize ambiguity in real-time, and generate actionable, high-grade analytical reports without human intervention.

---

## 🏛️ System Architecture

ClarityOS operates on a **Distributed Agentic Architecture**, leveraging a multi-agent swarm to process live audio streams and synthesize complex requirements.

### 1. The Live Swarm (Real-time Audit)
Powered by **Agno (formerly Phidata)**, the live swarm consists of three specialized agents working in a short-circuit pipeline:
*   **The Supervisor**: Orchestrates the live transcript stream, filtering noise and identifying "Ambiguity Windows."
*   **The Analyst**: Performs deep-reasoning on specific dialogue segments to identify vague quality metrics, undefined references, or scope gaps.
*   **The Critic**: Cross-references Analyst flags against the broader meeting context to ensure high-precision alerts and polite neutralization strategies.

### 2. The Analytical Boardroom (Post-Meeting)
After a session concludes, the **Session Director** agent takes over to perform a holistic synthesis:
*   **Clarity Scoring**: Mathematically calculates a grade for the meeting based on the density of resolved vs. unresolved flags.
*   **Customer DNA Profiling**: Reconstructs a psychological and technical profile of the stakeholders (Priorities, Worries, Preferences).
*   **Digital Replicant Sandbox**: Generates a chatable simulation of the meeting persona for follow-up testing.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Intelligence** | Gemini 1.5 Flash (Live), Gemini 1.5 Pro (Analytical), Agno Swarm Framework |
| **Backend** | FastAPI, Uvicorn, Python 3.12, Omium Tracing |
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion, Zustand |
| **Integrations** | Recall.ai (Video Bridge), Deepgram (Transcription), Firebase (Cloud Registry) |
| **Infrastructure** | Railway (Backend), Vercel (Frontend) |

---

## 🚀 Deployment & Environment

ClarityOS is optimized for **Zero-Configuration Deployment** using a "No-Ngrok" architecture.

### Backend (Railway)
The backend autonomously resolves its own callback URLs for Recall.ai webhooks.

**Required Variables:**
*   `GEMINI_API_KEY`: Google AI Studio key.
*   `RECALL_API_KEY`: Recall.ai API token.
*   `RECALL_REGION`: (e.g., `us-west-2`) Points to your Recall account region.
*   `PUBLIC_URL`: Set to `https://${{RAILWAY_PUBLIC_DOMAIN}}`.
*   `OMIUM_API_KEY`: For AI observability and tracing.

### Frontend (Vercel)
The frontend connects to the production swarm via environment-aware protocol resolution.

**Required Variables:**
*   `VITE_API_BASE_URL`: Your Railway production URL.
*   `VITE_FIREBASE_*`: Full set of Firebase configuration keys.

---

## 💻 Local Development

### 1. Backend Setup
```bash
cd clarity-agent/backend
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd clarity-agent/frontend
npm install
npm run dev
```

---

## 📊 Key Features & Workflows

### Autonomous Join (Calendar Bridge)
While the demo supports manual URL entry, the production architecture is designed to autonomously bridge with Google Calendar, provisioning bots for scheduled syncs without user oversight.

### The Ambiguity Matrix
Live alerts are streamed via WebSockets. Each alert contains:
*   **The Quote**: The exact phrase that triggered the flag.
*   **The Type**: (e.g., `vague_quality`, `missing_metric`).
*   **Neutralization Strategy**: A polite, actionable question the user can ask right now to fix the ambiguity.

### Real-time Agent Tracing
Integrated with **Omium**, providing a "Trace Hub" where users can see the swarm's internal dialogue and reasoning process in real-time.

---

## ⚖️ License
ClarityOS is proprietary software built for the [Hackathon Name] competition. 

**Developed by John Pradeep.**
