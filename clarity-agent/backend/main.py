import asyncio, json, os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from agno.agent import Agent
from agno.models.google import Gemini

from buffer import TranscriptBuffer
from agents.live_swarm import live_supervisor
from agents.boardroom import session_director
from ws_manager import ConnectionManager
from bot import join_meeting, leave_meeting

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()
buffer = TranscriptBuffer(window_seconds=30)
active_bot_id = None
analysis_task = None

# --- ClarityMAS Orchestration Global State ---
customer_name = ""
all_flags = []
resolved_quotes = set()

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
    global active_bot_id, analysis_task, customer_name, all_flags, resolved_quotes
    body = await request.json()
    meet_url = body["meet_url"]
    
    # Update orchestration config and wipe old session logs
    customer_name = body.get("customer_name", "Customer")
    all_flags.clear()
    resolved_quotes.clear()
    buffer.all_entries.clear()
    buffer.entries.clear()
    
    print(f"Starting Session. Monitoring Customer: '{customer_name}'")

    # Secure & sanitize webhook destination
    public_url = os.getenv("PUBLIC_URL", "").strip()
    webhook_url = body.get("webhook_url", "").strip()
    
    if not webhook_url:
        webhook_url = public_url if public_url else "https://demote-charter-enforcer.ngrok-free.dev"
        
    # Auto-fix missing protocols
    if webhook_url and not webhook_url.startswith("http"):
        webhook_url = "https://" + webhook_url
        
    # Auto-append proper FastAPI routing path if user only provided base ngrok/railway domain
    if "/webhook/transcript" not in webhook_url:
        webhook_url = webhook_url.rstrip("/") + "/webhook/transcript"
        
    print(f"Configuring Recall.ai routing target: {webhook_url}")

    try:
        active_bot_id = await join_meeting(meet_url, webhook_url)
        print(f"✅ Bot successfully provisioned: {active_bot_id}")
    except Exception as e:
        print(f"❌ Bot deployment failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    analysis_task = asyncio.create_task(analysis_loop())
    return {"bot_id": active_bot_id}

@app.get("/")
async def health_check():
    return {"status": "ClarityOS Swarm Engine Online", "environment": "Production"}

# ── Stop a session ────────────────────────────────────────────────
@app.post("/session/stop")
async def stop_session():
    global active_bot_id, analysis_task
    if active_bot_id:
        try:
            await leave_meeting(active_bot_id)
            print(f"Bot {active_bot_id} dismissed from session.")
        except Exception as e:
            print(f"Error dismissing bot: {e}")
        active_bot_id = None
        
    if analysis_task:
        analysis_task.cancel()
        analysis_task = None
        print("Real-time analysis pipeline suspended.")
        
    return {"ok": True}
# ── Resolve ambiguity from frontend ──────────────────────────────
@app.post("/session/resolve")
async def resolve_ambiguity(request: Request):
    global resolved_quotes
    body = await request.json()
    quote = body.get("quote")
    if quote:
        resolved_quotes.add(quote)
        print(f"Flag resolved: '{quote}'. Total clarified: {len(resolved_quotes)}")
    return {"ok": True}

# ── Interactive Client Replicant Chat Sandbox ─────────────────────
@app.post("/session/persona/chat")
async def chat_with_persona(request: Request):
    body = await request.json()
    message = body.get("message", "")
    p = body.get("persona", {})
    
    if not message:
        return {"reply": "I'm sorry, I didn't hear your question."}
        
    # Construct dynamic, deep persona instructions based on Stage 2 DNA payload
    priorities = ", ".join(p.get('key_priorities', [])) if isinstance(p.get('key_priorities'), list) else str(p.get('key_priorities'))
    prefs = ", ".join(p.get('stated_preferences', [])) if isinstance(p.get('stated_preferences'), list) else str(p.get('stated_preferences'))
    worries = ", ".join(p.get('core_worries', [])) if isinstance(p.get('core_worries'), list) else str(p.get('core_worries'))
    
    persona_prompt = (
        f"You are a highly accurate, realistic AI simulation of the customer persona: '{p.get('name', 'Customer')}', "
        f"who is a {p.get('role_title', 'Stakeholder')} at {p.get('company', 'their organization')}.\n\n"
        f"YOUR PERSONALITY DNA:\n"
        f"- Communication Style: {p.get('communication_style', 'Balanced')}\n"
        f"- Domain Tech Knowledge: {p.get('domain_knowledge', 'Medium')}\n"
        f"- Top Priorities: {priorities}\n"
        f"- Stated Preferences: {prefs}\n"
        f"- Underlying Worries & Fears: {worries}\n\n"
        "INSTRUCTION:\n"
        "The Agency representative is asking you a follow-up query or feature proposal. "
        "Respond EXACTLY as this customer would. Maintain their communication style, "
        "care about their worries, and protect their stated preferences. "
        "Be conversational, authentic, and stay strictly in character. Keep your answers reasonably concise."
    )
    
    try:
        # Instantiate a fast ad-hoc simulation agent
        replicant = Agent(
            name="ClientReplicant",
            model=Gemini(id="gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY")),
            instructions=[persona_prompt]
        )
        
        resp = await replicant.arun(message)
        reply = resp.content if hasattr(resp, "content") else str(resp)
        return {"reply": reply}
    except Exception as e:
        print(f"[Replicant Sandbox Error] Agent simulation failed: {e}")
        return {"reply": f"Error simulating client: {str(e)}"}

# ── Stop a session ────────────────────────────────────────────────
@app.post("/session/stop")
async def stop_session(background_tasks: BackgroundTasks):
    global active_bot_id, analysis_task
    
    if active_bot_id:
        await leave_meeting(active_bot_id)
        active_bot_id = None
        
    if analysis_task:
        analysis_task.cancel()
        analysis_task = None
        
    # Fire Stage 2 Post-Session Report in Background
    full_history = buffer.get_full_transcript()
    flags_snapshot = list(all_flags)
    resolved_snapshot = set(resolved_quotes)
    
    print(f"Firing Session Director background task. Snapshot flags count: {len(flags_snapshot)}")
    background_tasks.add_task(
        session_director, 
        full_history, 
        flags_snapshot, 
        resolved_snapshot, 
        manager
    )
    
    return {"ok": True}

# ── Ambiguity detection loop (runs every 15 seconds) ─────────────
async def analysis_loop():
    global all_flags
    seen_quotes = set()
    while True:
        await asyncio.sleep(6)
        chunk = buffer.get_text()
        if not chunk:
            continue
            
        print(f"--- [Supervisor] Dispatching chunk for Customer: '{customer_name}' ---")
        
        try:
            # Multi-agent supervisor replaces direct Gemini call
            flags = await live_supervisor(chunk, customer_name, manager)
            
            for flag in flags:
                if flag["quote"] not in seen_quotes:
                    seen_quotes.add(flag["quote"])
                    # Persist to Stage 2 aggregator
                    all_flags.append(flag)
                    # Broadcast in real time
                    await manager.broadcast("ambiguity", flag)
        except Exception as e:
            print(f"Analysis supervisor loop error: {e}")
