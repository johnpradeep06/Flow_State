import asyncio, json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from buffer import TranscriptBuffer
from ambiguity import detect_ambiguities
from ws_manager import ConnectionManager
from bot import join_meeting, leave_meeting

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()
buffer = TranscriptBuffer(window_seconds=30)
active_bot_id = None
analysis_task = None

# ── WebSocket endpoint for dashboard ──────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()   # keep alive
    except WebSocketDisconnect:
        manager.disconnect(ws)

# ── Recall.ai sends transcripts here ─────────────────────────────
@app.post("/webhook/transcript")
async def transcript_webhook(request: Request):
    body = await request.json()
    print("WEBHOOK RECEIVED:", json.dumps(body, indent=2))
    
    # Try to extract text depending on Recall's payload structure
    text = ""
    speaker = "Unknown"
    
    if "data" in body and "data" in body["data"]:
        inner_data = body["data"]["data"]
        # Extract the spoken words and join them into a sentence
        words = inner_data.get("words", [])
        text = " ".join([w.get("text", "") for w in words])
        
        # Extract the speaker's name
        participant = inner_data.get("participant", {})
        speaker = participant.get("name", "Unknown")
    else:
        # Fallback to old format
        text = body.get("transcript", "")
        speaker = body.get("speaker", "Unknown")
        
    print(f"EXTRACTED -> Speaker: {speaker} | Text: '{text}'")
        
    if text:
        buffer.add(speaker, text)
        await manager.broadcast("transcript", {"speaker": speaker, "text": text})
    return {"ok": True}

# ── Start a session ───────────────────────────────────────────────
@app.post("/session/start")
async def start_session(request: Request):
    global active_bot_id, analysis_task
    body = await request.json()
    meet_url = body["meet_url"]

    # Your server's public URL (use ngrok for local dev)
    webhook_url = body.get("webhook_url", "https://demote-charter-enforcer.ngrok-free.dev/webhook/transcript")

    active_bot_id = await join_meeting(meet_url, webhook_url)
    analysis_task = asyncio.create_task(analysis_loop())
    return {"bot_id": active_bot_id}

# ── Stop a session ────────────────────────────────────────────────
@app.post("/session/stop")
async def stop_session():
    global active_bot_id, analysis_task
    if active_bot_id:
        await leave_meeting(active_bot_id)
        active_bot_id = None
    if analysis_task:
        analysis_task.cancel()
        analysis_task = None
    return {"ok": True}

# ── Ambiguity detection loop (runs every 15 seconds) ─────────────
async def analysis_loop():
    seen_quotes = set()
    while True:
        await asyncio.sleep(15)
        chunk = buffer.get_text()
        if not chunk:
            continue
            
        print("--- SENDING CHUNK TO LLM ---")
        print(chunk)
        
        try:
            flags = await detect_ambiguities(chunk)
            print("--- LLM RETURNED ---")
            print(flags)
            
            for flag in flags:
                if flag["quote"] not in seen_quotes:
                    seen_quotes.add(flag["quote"])
                    await manager.broadcast("ambiguity", flag)
        except Exception as e:
            print(f"Analysis error: {e}")
