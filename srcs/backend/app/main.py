from typing import Union

from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from api import chat

app = FastAPI()

app.include_router(chat.router)

static_path = Path(__file__).parent / "static"
print(static_path)
app.mount("/static", StaticFiles(directory=static_path), name="static")