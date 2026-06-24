"""FastAPI main application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import init_db
from websocket_manager import manager
from routers import auth, sessions, teams, keywords, game


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield


app = FastAPI(
    title="Đoán Từ Khóa Đồng Đội",
    description="Web App Trò Chơi Team Building",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(teams.router)
app.include_router(keywords.router)
app.include_router(game.router)


from game_state import game
import json

# WebSocket endpoints
@app.websocket("/ws/admin")
async def websocket_admin(websocket: WebSocket):
    """WebSocket endpoint for admin/MC clients."""
    await manager.connect(websocket, "admin")
    
    # Send initial state
    state_data = await game.get_full_state()
    await websocket.send_text(json.dumps({
        "type": "state_update",
        "data": state_data
    }, ensure_ascii=False))
    
    try:
        while True:
            # Keep connection alive, receive any messages from admin
            data = await websocket.receive_text()
            # Can handle admin commands via WebSocket if needed
    except WebSocketDisconnect:
        await manager.disconnect(websocket, "admin")


@app.websocket("/ws/display")
async def websocket_display(websocket: WebSocket):
    """WebSocket endpoint for display/stage clients."""
    await manager.connect(websocket, "display")
    
    # Send initial state
    state_data = await game.get_full_state()
    display_data = {**state_data}
    display_data.pop("current_keyword", None)
    display_data.pop("current_answer", None)
    if not display_data.get("hint_visible", False):
        display_data.pop("current_hint", None)
        display_data.pop("current_hint_image_url", None)
        
    await websocket.send_text(json.dumps({
        "type": "state_update",
        "data": display_data
    }, ensure_ascii=False))
    
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket, "display")


# Serve uploaded images
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Serve frontend static files in production
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")


@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "Đoán Từ Khóa Đồng Đội - Server Running"}
