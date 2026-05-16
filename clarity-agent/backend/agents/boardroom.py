import os, asyncio, sys
sys.path.insert(0, "D:\\python-libs")
import omium
from typing import List, Set
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.models.google import Gemini
from dotenv import load_dotenv

load_dotenv()

# --- Pydantic Schemas for Boardroom Agents ---

class RequirementsDoc(BaseModel):
    features: List[str] = Field(description="List of high-level user stories or product features requested (e.g., 'Google Auth Integration').")
    functional_reqs: List[str] = Field(description="Detailed functional requirements (e.g., 'System must send email after user signup').")
    non_functional_reqs: List[str] = Field(description="Detailed non-functional requirements like performance, security, scale (e.g., 'Page must load in under 2 seconds').")

class ActionItem(BaseModel):
    who: str = Field(description="Person responsible for the task.")
    what: str = Field(description="Task/Action detailed description.")
    by_when: str = Field(description="Due date or timeline mentioned, or 'Unspecified'.")

class MeetingReport(BaseModel):
    summary: str = Field(description="A concise 3-5 sentence executive paragraph summarizing the entire meeting's objective and outcome.")
    decisions: List[str] = Field(description="Bullet-pointed list of explicit agreements, mandates, or confirmations made during the call.")
    action_items: List[ActionItem] = Field(description="List of specifically assigned action items.")

class CustomerPersona(BaseModel):
    name: str = Field(description="The full name of the customer.")
    role_title: str = Field(description="Their role or title (e.g., VP, CEO) if mentioned, otherwise 'Customer'.")
    company: str = Field(description="Company name or project name.")
    key_priorities: List[str] = Field(description="Their top 3-4 core priorities for the project (e.g., Security, Budget).")
    communication_style: str = Field(description="Their psychological profile (Direct, verbose, formal, casual).")
    domain_knowledge: str = Field(description="High, Medium, or Low technical familiarity.")
    stated_preferences: List[str] = Field(description="Specific things they explicitly like, dislike, or requested.")
    core_worries: List[str] = Field(description="Core fears, concerns, or risks they mentioned.")

# --- Setup Model Config ---
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

# --- Agent Definitions ---

req_architect_agent = Agent(
    name="RequirementsArchitect",
    model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_KEY),
    description="Technical Product Owner that synthesizes transcripts into structured specifications.",
    instructions=[
        "You are a Senior Technical Product Owner.",
        "Analyze the provided full meeting transcript between a customer and agency reps.",
        "Isolate all technical deliverables and map them into three clear categories:",
        "1. Features: The core modules/pages/capabilities requested.",
        "2. Functional Requirements: Exact behaviors of how the system must react.",
        "3. Non-Functional Requirements: Expectations regarding speed, load, usability, look-and-feel metrics.",
        "Ensure statements are actionable for developers."
    ],
    output_schema=RequirementsDoc,
)

historian_agent = Agent(
    name="ChiefHistorian",
    model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_KEY),
    description="Executive Assistant that extracts key summaries, decisions, and actions.",
    instructions=[
        "You are a Chief of Staff and Executive Assistant.",
        "Synthesize the complete meeting transcript into a high-level overview.",
        "Produce a professional, narrative-style executive summary.",
        "Extract all formal decisions made (agreements).",
        "Identify every assigned task, identifying who is responsible, what needs doing, and the expected deadline."
    ],
    output_schema=MeetingReport,
)

profile_replicator_agent = Agent(
    name="ProfileReplicator",
    model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_KEY),
    description="Expert psychological profiler that synthesizes user personas from transcripts.",
    instructions=[
        "You are a Senior Behavioral Profiler.",
        "Analyze the entire transcript focusing purely on the CUSTOMER side of the conversation.",
        "Extract their full name, job role, key motivations, communication style, domain comfort, explicit preferences, and underlying worries.",
        "The purpose is to build an accurate psychological DNA to power future interactive simulations of them."
    ],
    output_schema=CustomerPersona,
)

# --- Quantitative Analytics Scorer ---

def clarity_scorer(all_flags: List[dict], resolved_quotes: Set[str], full_transcript: str) -> dict:
    """
    Calculates the Quantitative Clarity Score (0-100) instantly in Python.
    """
    total_flags = len(all_flags)
    resolved_count = len(resolved_quotes)
    
    # Component 1: Resolution Rate (40%)
    # How many detected ambiguities did the user successfully clarify?
    resolution_rate = 1.0
    if total_flags > 0:
        resolution_rate = min(resolved_count / total_flags, 1.0)
    
    res_score = resolution_rate * 40
    
    # Component 2: Metric Density (40%)
    # How frequently are numbers, units, percentages, dates used in the conversation?
    words = full_transcript.split()
    word_count = len(words)
    
    metric_density = 0
    if word_count > 0:
        # Count numeric tokens (contains digit) or currency symbols
        metric_markers = sum(1 for w in words if any(c.isdigit() for c in w) or '$' in w or '%' in w)
        # Standard target: 1 metric every 40 words is highly precise
        target_density = 0.025 
        actual_density = metric_markers / word_count
        metric_density = min(actual_density / target_density, 1.0)
        
    metric_score = metric_density * 40
    
    # Component 3: Base Precision & Fluency (20%)
    # Automatically give partial base points for successful communication, minus unresolved ambiguity penalty.
    unresolved_penalty = min((total_flags - resolved_count) * 2, 15)
    fluency_score = 20 - unresolved_penalty
    
    final_score = max(0, min(round(res_score + metric_score + fluency_score), 100))
    
    # Assign Letter Grade
    if final_score >= 90:
        grade = "A+"
    elif final_score >= 80:
        grade = "A"
    elif final_score >= 70:
        grade = "B"
    elif final_score >= 60:
        grade = "C"
    else:
        grade = "D"
        
    return {
        "score": final_score,
        "grade": grade,
        "stats": {
            "total_ambiguities": total_flags,
            "clarified": resolved_count,
            "resolution_rate_pct": round(resolution_rate * 100),
            "metric_density_pct": round((metric_markers / word_count) * 100) if word_count > 0 else 0
        }
    }

# --- Post-Session Coordinator (FastAPI Background Task Target) ---

@omium.trace()
async def session_director(full_transcript: str, all_flags: List[dict], resolved_quotes: Set[str], manager) -> None:
    """
    Generates the final post-meeting report asynchronously and broadcasts it via WebSocket.
    """
    print(f"[Director] Processing Stage 2 Boardroom analysis. Transcript length: {len(full_transcript)} chars.")
    
    if not full_transcript.strip():
        print("[Director Warning] Full transcript is empty. Aborting report.")
        return

    async def set_status(agent: str, status: str, state: str):
        try:
            await manager.broadcast("agent_status", {"agent": agent, "status": status, "state": state})
        except Exception:
            pass
        
    try:
        # 1. Score the session instantly
        await set_status("ClarityScorer", "Tabulating ambiguity resolution velocities and numeric densities...", "running")
        await asyncio.sleep(1) # Tiny delay so the user reads the trace
        
        score = clarity_scorer(all_flags, resolved_quotes, full_transcript)
        print(f"[Director] Clarity Score calculated: {score['score']} ({score['grade']})")
        await set_status("ClarityScorer", f"Graded: {score['grade']} ({score['score']}%)", "success")
        
        # 2. Kick off all 3 boardroom agents concurrently for performance
        await set_status("RequirementsArchitect", "Distilling core product specifications...", "running")
        await set_status("ChiefHistorian", "Drafting executive summaries...", "running")
        await set_status("ProfileReplicator", "Extracting client psychological DNA...", "running")
        
        req_task = req_architect_agent.arun(f"TRANSCRIPT:\n{full_transcript}")
        hist_task = historian_agent.arun(f"TRANSCRIPT:\n{full_transcript}")
        persona_task = profile_replicator_agent.arun(f"TRANSCRIPT:\n{full_transcript}")
        
        # Run all 3 concurrently
        reqs_resp, hist_resp, persona_resp = await asyncio.gather(req_task, hist_task, persona_task)
        
        # Extract structured data safely
        requirements_doc = reqs_resp.content if hasattr(reqs_resp, "content") else None
        meeting_report = hist_resp.content if hasattr(hist_resp, "content") else None
        persona_profile = persona_resp.content if hasattr(persona_resp, "content") else None
        
        if not requirements_doc or not meeting_report or not persona_profile:
            await set_status("RequirementsArchitect", "Execution stalled.", "failed")
            raise Exception("One or more boardroom agents failed synthesis.")
            
        await set_status("RequirementsArchitect", f"Synthesized PRD ({len(getattr(requirements_doc, 'features', []))} features).", "success")
        await set_status("ChiefHistorian", "Compiled narrative & deliverables.", "success")
        await set_status("ProfileReplicator", f"Successfully cloned {getattr(persona_profile, 'name', 'Customer')} Persona.", "success")
 
        # 3. Compile absolute final report package
        final_payload = {
            "clarity": score,
            "requirements": {
                "features": getattr(requirements_doc, "features", []),
                "functional_reqs": getattr(requirements_doc, "functional_reqs", []),
                "non_functional_reqs": getattr(requirements_doc, "non_functional_reqs", [])
            },
            "summary": {
                "summary_paragraph": getattr(meeting_report, "summary", "No summary generated."),
                "decisions": getattr(meeting_report, "decisions", []),
                "action_items": [
                    {"who": item.who, "what": item.what, "by_when": item.by_when} 
                    for item in getattr(meeting_report, "action_items", [])
                ]
            },
            "persona": {
                "name": getattr(persona_profile, "name", "Client Replicant"),
                "role_title": getattr(persona_profile, "role_title", "Customer"),
                "company": getattr(persona_profile, "company", "Unspecified"),
                "key_priorities": getattr(persona_profile, "key_priorities", []),
                "communication_style": getattr(persona_profile, "communication_style", "Balanced"),
                "domain_knowledge": getattr(persona_profile, "domain_knowledge", "Medium"),
                "stated_preferences": getattr(persona_profile, "stated_preferences", []),
                "core_worries": getattr(persona_profile, "core_worries", [])
            }
        }
        
        print("[Director] Boardroom compiled successfully. Broadcasting session_report.")
        await manager.broadcast("session_report", final_payload)
        
    except Exception as e:
        print(f"[Director Error] Post-session processing failed: {e}")
        await manager.broadcast("session_report_error", {"error": str(e)})
