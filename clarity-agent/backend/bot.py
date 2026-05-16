import httpx, os, sys
sys.path.insert(0, "D:\\python-libs")
import omium
from dotenv import load_dotenv
load_dotenv()

RECALL_KEY = os.getenv("RECALL_API_KEY")
RECALL_REGION = os.getenv("RECALL_REGION", "us-west-2").strip()
BASE = f"https://{RECALL_REGION}.recall.ai/api/v1"

@omium.trace()
async def join_meeting(meet_url: str, webhook_url: str) -> str:
    """Send a bot to a Google Meet. Returns bot_id."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{BASE}/bot",
            headers={"Authorization": f"Token {RECALL_KEY}"},
            json={
                "meeting_url": meet_url,
                "bot_name": "Agent Flow",
                "recording_config": {
                    "transcript": {
                        "provider": {
                            "recallai_streaming": {
                                "mode": "prioritize_low_latency",
                                "language_code": "en"
                            }
                        }
                    },
                    "realtime_endpoints": [
                        {
                            "type": "webhook",
                            "url": webhook_url,
                            "events": ["transcript.data"]
                        }
                    ]
                }
            }
        )
        if res.is_error:
            raise Exception(f"Recall API Error: {res.status_code} - {res.text}")
    return res.json()["id"]

@omium.trace()
async def leave_meeting(bot_id: str):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{BASE}/bot/{bot_id}/leave_call",
            headers={"Authorization": f"Token {RECALL_KEY}"}
        )
