# Clarity Agent

Clarity Agent is an AI-powered real-time meeting assistant designed to join Google Meet calls, transcribe conversations, and instantly detect ambiguous or vague statements so you can clarify them before the meeting ends.

## Architecture

The project consists of two main components:
1. **Backend (FastAPI)**: Manages meeting bot deployments, receives live webhooks from Recall.ai, and runs real-time analysis using the Gemini 3.1 Flash LLM.
2. **Frontend (React)**: A real-time dashboard that connects via WebSockets to display live captions and instant ambiguity alert cards.

## Features
- **Bot Deployment**: Automatically send a recording bot to Google Meet links.
- **Live Captions**: WebSockets push transcripts instantly to the UI.
- **Ambiguity Detection**: AI background loop analyzes dialogue every 15 seconds to catch vague statements (e.g., missing metrics, undefined requirements).

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js & npm
- [Recall.ai](https://www.recall.ai/) API Key
- Gemini API Key

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd clarity-agent/backend
   ```

2. **Create a virtual environment:**
   This keeps your Python packages isolated.
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment:**
   * **Windows (PowerShell):**
     ```powershell
     .\.venv\Scripts\Activate
     ```
   * **Mac/Linux:**
     ```bash
     source .venv/bin/activate
     ```
   *(You should see `(.venv)` appear in your terminal prompt)*

4. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up your environment variables:**
   Create a `.env` file in the `backend` folder and add your API keys:
   ```env
   RECALL_API_KEY=your_recall_key
   GEMINI_API_KEY=your_gemini_key
   ```

6. **Run the FastAPI server:**
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will start running at `http://localhost:8000`.*

---

### Frontend Setup

1. **Open a new terminal window** (leave the backend running in the first one).

2. **Navigate to the frontend directory:**
   *(Assuming your frontend is in a folder named `frontend` or `ui`)*
   ```bash
   cd clarity-agent/frontend
   ```

3. **Install Node dependencies:**
   ```bash
   npm install
   ```

4. **Start the React development server:**
   ```bash
   npm run dev
   ```
   *The frontend dashboard will start running (typically at `http://localhost:5173` or `3000`).*

---

## Local Webhook Testing with Ngrok

Because Recall.ai needs to send transcription data back to your server over the internet, you cannot use `localhost` for webhooks. You must expose your local port 8000 to the internet using **ngrok**.

1. **Install Ngrok** from [ngrok.com/download](https://ngrok.com/download).
2. **Open a new terminal window** and run:
   ```bash
   ngrok http 8000
   ```
3. **Copy the Forwarding URL** from the terminal output (it will look something like `https://a1b2-c3d4.ngrok-free.app`).
4. **Use this URL:** Update the hardcoded `webhook_url` in `backend/main.py` to match your new ngrok address, or pass it dynamically from your frontend when calling `/session/start`.
   *Note: Free ngrok URLs change every time you restart ngrok.*

## Deployment Notes
- **CORS origins** in `main.py` to match your frontend domain.
- **Webhook Fallback URL** in `main.py` to your backend's public HTTPS URL.
- Use `wss://` instead of `ws://` in your frontend WebSocket connection.
