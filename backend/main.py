"""FastAPI main application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import init_db
from websocket_manager import manager
from routers import auth, sessions, teams, keywords, game, songs, humming, matrix

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
app.include_router(songs.router)
app.include_router(humming.router)
app.include_router(matrix.router)


from game_state import game
from humming_game_state import humming_game
from matrix_game_state import matrix_game

# WebSocket endpoints
@app.websocket("/ws/admin")
async def websocket_admin_endpoint(websocket: WebSocket):
    await manager.connect(websocket, "admin")
    try:
        while True:
            # Broadcast the active game's state
            if game.state != "WAITING":
                state_data = await game.get_full_state()
            elif humming_game.state != "WAITING":
                state_data = await humming_game.get_full_state()
            elif matrix_game.state != "WAITING":
                state_data = await matrix_game.get_full_state()
            else:
                # Default to main game if all are WAITING
                state_data = await game.get_full_state()
                
            await websocket.send_json({"type": "state_update", "data": state_data})
            await asyncio.sleep(1) # Send regular updates to keep alive
    except WebSocketDisconnect:
        await manager.disconnect(websocket, "admin")
    except Exception as e:
        print(f"Admin WebSocket error: {e}")
        await manager.disconnect(websocket, "admin")

import asyncio

@app.websocket("/ws/display")
async def websocket_display_endpoint(websocket: WebSocket):
    await manager.connect(websocket, "display")
    try:
        while True:
            if game.state != "WAITING":
                state_data = await game.get_full_state()
            elif humming_game.state != "WAITING":
                state_data = await humming_game.get_full_state()
            elif matrix_game.state != "WAITING":
                state_data = await matrix_game.get_full_state()
            else:
                state_data = await game.get_full_state()
                
            await websocket.send_json({"type": "state_update", "data": state_data})
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, "display")
    except Exception as e:
        print(f"Display WebSocket error: {e}")
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
