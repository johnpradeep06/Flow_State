from collections import deque
import time

class TranscriptBuffer:
    def __init__(self, window_seconds=30):
        self.window = window_seconds
        self.entries = deque()
        self.all_entries = []

    def add(self, speaker: str, text: str):
        entry = {
            "speaker": speaker,
            "text": text,
            "ts": time.time()
        }
        self.entries.append(entry)
        self.all_entries.append(entry)
        self._prune()

    def _prune(self):
        cutoff = time.time() - self.window
        while self.entries and self.entries[0]["ts"] < cutoff:
            self.entries.popleft()

    def get_text(self) -> str:
        return "\n".join(
            f"{e['speaker']}: {e['text']}" for e in self.entries
        )

    def get_full_transcript(self) -> str:
        return "\n".join(
            f"{e['speaker']}: {e['text']}" for e in self.all_entries
        )
