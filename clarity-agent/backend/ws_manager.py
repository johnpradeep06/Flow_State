from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        print(f"Dashboard connected. Total: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, event_type: str, data: dict):
        payload = json.dumps({"type": event_type, "data": data})
        print(f"WS BROADCASTING: {event_type} to {len(self.active)} clients")
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(payload)
            except Exception as e:
                print(f"WS SEND ERROR: {e}")
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)
