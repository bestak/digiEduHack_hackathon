import os
import math
from typing import Dict, Any
from sqlmodel import Session
from .models import FileMeta
from .ollama_client import ask_llm  # helper for calling ollama

UPLOAD_DIR = "/data/uploads"  # or whatever tusd uses inside /data

def extract_text_from_file(path: str) -> str:
    # Very rough sketch, you can branch by extension
    if path.lower().endswith(".pdf"):
        from pypdf import PdfReader
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    elif path.lower().endswith(".docx"):
        import docx
        doc = docx.Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    else:
        # assume plaintext
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

def compute_basic_stats(text: str) -> Dict[str, Any]:
    words = text.split()
    word_count = len(words)
    sentences = [s for s in text.replace("\n", " ").split(".") if s.strip()]
    sentence_count = max(len(sentences), 1)
    avg_words_per_sentence = word_count / sentence_count
    char_count = len(text)
    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_words_per_sentence": avg_words_per_sentence,
        "char_count": char_count,
    }

def build_llm_prompt(text: str) -> str:
    # Truncate huge docs for now; later you can do chunking
    MAX_CHARS = 8000
    sample = text[:MAX_CHARS]

    return f"""
You are a teacher-assistant analyzing educational documents.

Given the following document content, extract structured information and return **ONLY valid JSON** with keys:
- "summary": short summary of the document
- "topics": list of main topics (strings)
- "grade_level": approximate grade level (e.g. "1–5", "6–9", "high school", "university")
- "difficulty": "easy" | "medium" | "hard"
- "estimated_time_minutes": integer, how long it would take a student to read/study it
- "key_concepts": list of important concepts or skills

Document content (possibly truncated):

\"\"\"{sample}\"\"\"
"""

def analyze_file(session: Session, file_meta: FileMeta) -> None:
    # resolve path from tus_id (depends on how tusd stores files; adjust)
    path = os.path.join(UPLOAD_DIR, file_meta.tus_id)
    if not os.path.exists(path):
        raise FileNotFoundError(path)

    text = extract_text_from_file(path)
    basic_stats = compute_basic_stats(text)

    prompt = build_llm_prompt(text)
    llm_json = ask_llm(prompt)

    file_meta.extracted_text = text  # optional, maybe store only if small
    file_meta.basic_stats = basic_stats
    file_meta.llm_summary = llm_json

    session.add(file_meta)
