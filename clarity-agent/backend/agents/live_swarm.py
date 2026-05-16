import os, asyncio, sys
if os.path.exists("D:\\python-libs"):
    sys.path.insert(0, "D:\\python-libs")
import omium
from typing import List
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.models.google import Gemini
from dotenv import load_dotenv

load_dotenv()

# --- Pydantic Schemas for Structured Agent Output ---

class FilterDecision(BaseModel):
    relevant: bool = Field(
        description="True if the conversation discusses requirements, features, specifications, goals, or timelines. False if it is just small talk, greetings, or technical difficulties."
    )

class RoughFlag(BaseModel):
    quote: str = Field(description="The exact ambiguous phrase or sentence from the transcript.")
    type: str = Field(description="The type of ambiguity: vague_quality, missing_metric, undefined_reference, assumption, or scope.")

class FinalFlag(BaseModel):
    quote: str = Field(description="The exact ambiguous phrase.")
    type: str = Field(description="Category of ambiguity.")
    suggestion: str = Field(description="Highly professional, polite, and actionable clarification question to ask the client.")

class RoughFlagsResponse(BaseModel):
    flags: List[RoughFlag] = Field(default_factory=list, description="List of rough ambiguities found.")

class FinalFlagsResponse(BaseModel):
    flags: List[FinalFlag] = Field(default_factory=list, description="List of polished, validated ambiguity flags.")

# --- Setup Model config ---
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

# --- Agent Definitions ---

noise_filter_agent = Agent(
    name="NoiseFilter",
    model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_KEY),
    description="Filters out conversation noise and non-requirement chatter.",
    instructions=[
        "You are a topic classifier sitting in on a software requirements elicitation meeting.",
        "Determine if the given transcript chunk contains any discussions about features, functional behaviors, constraints, timelines, or designs.",
        "Return True only if developers or analysts would care about the contents for building the project. Otherwise, return False."
    ],
    output_schema=FilterDecision,
)

hunter_agent = Agent(
    name="AmbiguityHunter",
    model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_KEY),
    description="Identifies potentially vague or ambiguous statements made by a customer.",
    instructions=[
        "You are an aggressive Requirements Analyst.",
        "Find ALL statements that are potentially vague, undefined, or unmeasured.",
        "Focus categories:",
        "- Vague quality words: 'fast', 'premium', 'modern', 'clean', 'simple', 'nice'",
        "- Missing metrics: 'quickly', 'scalable', 'highly available', 'many users'",
        "- Undefined comparisons: 'like stripe', 'similar to previous one'",
        "- Unstated assumptions: 'the usual way', 'standard setup'",
        "- Scope creep hints: 'maybe also', 'would be cool to'",
        "Do NOT worry about politeness; extract everything that needs measurement."
    ],
    output_schema=RoughFlagsResponse,
)

critic_agent = Agent(
    name="CriticRefiner",
    model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_KEY), # Stronger reasoning
    description="Reviews and validates rough ambiguity flags against context and polishes them.",
    instructions=[
        "You are a Quality Gate & Technical Product Manager.",
        "Given the complete raw transcript chunk and a list of rough ambiguity flags found in it:",
        "1. Evaluate if the speaker actually clarified the ambiguity themselves in a later line of the SAME chunk.",
        "2. If it is resolved, or if it's trivial everyday talk, DROP the flag entirely.",
        "3. If it remains truly ambiguous and actionable, KEEP it.",
        "4. For all kept flags, rewrite the suggested question to be exceptionally professional, polite, and direct for use in a client call.",
        "Ensure you ONLY return truly outstanding ambiguities."
    ],
    output_schema=FinalFlagsResponse,
)

# --- Supervisor Pipeline Coordinator ---

@omium.trace()
async def live_supervisor(chunk: str, customer_name: str, manager) -> List[dict]:
    """
    Coordinates the Live Swarm Agents using an optimized short-circuit pipeline.
    Broadcasts agent statuses to frontend for real-time execution tracing.
    """
    if not chunk.strip() or not customer_name:
        return []

    async def set_status(agent: str, status: str, state: str):
        try:
            await manager.broadcast("agent_status", {"agent": agent, "status": status, "state": state})
        except Exception:
            pass

    # Initialize all to neutral standby first
    await set_status("NoiseFilter", "Awaiting next conversation window...", "idle")
    await set_status("AmbiguityHunter", "Waiting for customer input...", "idle")
    await set_status("CriticRefiner", "Waiting for raw flags...", "idle")

    # Step 1: Noise Filter
    await set_status("NoiseFilter", "Analyzing conversation for requirements...", "running")
    try:
        filter_resp = await noise_filter_agent.arun(f"Transcript chunk:\n{chunk}")
        
        if not filter_resp or not filter_resp.content or not filter_resp.content.relevant:
            print("[Supervisor] Noise filter: No requirements found. Short-circuiting.")
            await set_status("NoiseFilter", "No requirements detected. Skipping swarm.", "idle")
            return []
            
        await set_status("NoiseFilter", "Found requirements. Proceeding to analysis.", "success")
    except Exception as e:
        print(f"[Supervisor Error] Noise filter failed: {e}")
        await set_status("NoiseFilter", f"Bypass filter due to: {e}", "success")
        pass

    # Step 2: Filter out non-customer lines
    customer_lines = []
    for line in chunk.split("\n"):
        if ":" in line:
            speaker, text = line.split(":", 1)
            if customer_name.strip().lower() in speaker.lower():
                customer_lines.append(line.strip())
        
    customer_text = "\n".join(customer_lines)
    if not customer_text.strip():
        print(f"[Supervisor] No lines spoken by customer '{customer_name}'. Skipping Hunter.")
        await set_status("AmbiguityHunter", f"No text spoken by {customer_name} in this window.", "idle")
        return []

    # Step 3: Run Hunter on customer text only
    await set_status("AmbiguityHunter", f"Scanning {customer_name}'s statements for unmeasured parameters...", "running")
    try:
        hunter_resp = await hunter_agent.arun(f"Customer transcript lines:\n{customer_text}")
        if not hunter_resp or not hunter_resp.content:
            print("[Supervisor] Ambiguity Hunter: No rough flags found.")
            await set_status("AmbiguityHunter", "Zero ambiguity flags detected.", "success")
            return []
            
        # Safely extract flags from wrapper or handle error strings
        rough_flags = []
        if hasattr(hunter_resp.content, "flags"):
            rough_flags = hunter_resp.content.flags
        elif isinstance(hunter_resp.content, dict) and "flags" in hunter_resp.content:
            rough_flags = hunter_resp.content["flags"]
            
        if not rough_flags:
            await set_status("AmbiguityHunter", "Ambiguity Hunter found 0 potential flags.", "success")
            return []
            
        await set_status("AmbiguityHunter", f"Extracted {len(rough_flags)} rough ambiguity markers.", "success")
    except Exception as e:
        print(f"[Supervisor Error] Ambiguity Hunter failed: {e}")
        await set_status("AmbiguityHunter", "Hunter failed.", "failed")
        return []

    # Step 4: Critic refines candidates using full context
    await set_status("CriticRefiner", "Validating raw flags against full window & cleaning phrasing...", "running")
    context_payload = f"FULL CONTEXT CHUNK:\n{chunk}\n\nCANDIDATE FLAGS FOUND:\n"
    for flag in rough_flags:
        # Ensure flag is an object before reading properties
        quote = getattr(flag, "quote", getattr(flag, "get", lambda k, d: "")("quote", ""))
        flag_type = getattr(flag, "type", getattr(flag, "get", lambda k, d: "")("type", ""))
        context_payload += f"- Quote: \"{quote}\" | Type: {flag_type}\n"

    try:
        critic_resp = await critic_agent.arun(context_payload)
        
        if not critic_resp or not critic_resp.content:
            print("[Supervisor] Critic dropped all candidate flags.")
            await set_status("CriticRefiner", "Critic determined all items were already clarified.", "success")
            asyncio.create_task(delayed_idle_reset(manager))
            return []
            
        # Safely extract final polished flags
        final_flags = []
        if hasattr(critic_resp.content, "flags"):
            final_flags = critic_resp.content.flags
        elif isinstance(critic_resp.content, dict) and "flags" in critic_resp.content:
            final_flags = critic_resp.content["flags"]
        
        if not final_flags:
            await set_status("CriticRefiner", "Critic filtered out all candidate flags.", "success")
            asyncio.create_task(delayed_idle_reset(manager))
            return []
            
        await set_status("CriticRefiner", f"Successfully polished {len(final_flags)} actionable questions.", "success")
        
        asyncio.create_task(delayed_idle_reset(manager))
        return [{"quote": f.quote, "type": f.type, "suggestion": f.suggestion} for f in final_flags]
    except Exception as e:
        print(f"[Supervisor Error] Critic failed: {e}")
        await set_status("CriticRefiner", "Validator failed. Bypassing refinement.", "failed")
        asyncio.create_task(delayed_idle_reset(manager))
        # Safe extraction fallback to prevent attribute errors in iteration
        output_fallback = []
        for f in rough_flags:
            q = getattr(f, "quote", "")
            t = getattr(f, "type", "assumption")
            if q:
                output_fallback.append({"quote": q, "type": t, "suggestion": f"Could you clarify what you mean by '{q}'?"})
        return output_fallback

async def delayed_idle_reset(manager):
    """Cleanses front-end traces back to neutral after some visual persistence."""
    await asyncio.sleep(6)
    try:
        await manager.broadcast("agent_status", {"agent": "NoiseFilter", "status": "Listening...", "state": "idle"})
        await manager.broadcast("agent_status", {"agent": "AmbiguityHunter", "status": "Standing by...", "state": "idle"})
        await manager.broadcast("agent_status", {"agent": "CriticRefiner", "status": "Standing by...", "state": "idle"})
    except Exception:
        pass
