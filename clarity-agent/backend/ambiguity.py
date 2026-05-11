import httpx, os, json
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_PROMPT = """
You are an expert requirement analyst listening to a software elicitation call.
Your job: detect ambiguous statements the customer makes that a developer
cannot act on without clarification.

Ambiguous patterns to catch:
- Vague quality words: "premium", "fast", "modern", "clean", "simple", "nice"
- Missing metrics: "should load quickly" (how fast?), "many users" (how many?)
- Undefined comparisons: "like Airbnb", "similar to Stripe"
- Unstated assumptions: "the usual flow", "standard process"
- Scope creep hints: "and maybe also...", "it would be nice if..."

Return ONLY a raw JSON array, no markdown, no preamble.
Each item must have exactly these keys:
{
  "quote": "exact phrase from transcript",
  "type": "vague_quality | missing_metric | undefined_reference | assumption | scope",
  "suggestion": "Suggested clarification question to ask right now"
}
If nothing is ambiguous, return [].
"""

async def detect_ambiguities(transcript_chunk: str) -> list:
    if not transcript_chunk.strip():
        return []
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "system_instruction": {
            "parts": {"text": SYSTEM_PROMPT}
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"Transcript chunk:\n\n{transcript_chunk}"}]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "maxOutputTokens": 800
        }
    }
    
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(
            url,
            headers={"Content-Type": "application/json"},
            json=payload
        )
        
    data = res.json()
    
    if "error" in data:
        print(f"GEMINI API ERROR: {data['error']}")
        return []
        
    try:
        raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        # Strip markdown fences if the model still adds them despite JSON mime type
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        print(f"UNEXPECTED GEMINI API RESPONSE OR DECODE ERROR: {data} - Exception: {e}")
        return []
