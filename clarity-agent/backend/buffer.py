from collections import deque
import time

class TranscriptBuffer:
    def __init__(self, window_seconds=30):
        self.window = window_seconds
        self.entries = deque()

    def add(self, speaker: str, text: str):
        self.entries.append({
            "speaker": speaker,
            "text": text,
            "ts": time.time()
        })
        self._prune()

    def _prune(self):
        cutoff = time.time() - self.window
        while self.entries and self.entries[0]["ts"] < cutoff:
            self.entries.popleft()

    def get_text(self) -> str:
        return "\n".join(
            f"{e['speaker']}: {e['text']}" for e in self.entries
        )
