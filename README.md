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
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your `.env` file:
   ```env
   RECALL_API_KEY=your_recall_key
   GEMINI_API_KEY=your_gemini_key
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to your frontend directory.
2. Install dependencies (e.g., `npm install`).
3. Start the development server (`npm run dev`).

## Deployment Notes
Before deploying to production, make sure to update:
- **CORS origins** in `main.py` to match your frontend domain.
- **Webhook Fallback URL** in `main.py` to your backend's public HTTPS URL.
- Use `wss://` instead of `ws://` in your frontend WebSocket connection.
