import os
import requests
import json

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://ollama:11434")
# OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "deepseek-r1:1.5b")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")

def ask_llm(prompt: str):
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        # If supported, ask for JSON output:
        "format": "json"
    }
    r = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout=120)
    r.raise_for_status()
    data = r.json()
    # depending on the model, the text may be in `data["response"]`
    raw = data.get("response", "")
    return json.loads(raw)
