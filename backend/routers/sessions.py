"""Sessions router - CRUD for game sessions."""

import uuid
from fastapi import APIRouter, HTTPException
from database import get_db
from models import SessionCreate, SessionResponse, SessionStatusUpdate
from game_state import game
from humming_game_state import humming_game
from matrix_game_state import matrix_game

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse)
async def create_session(request: SessionCreate):
    """Create a new game session."""
    session_id = str(uuid.uuid4())
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO sessions (id, name, pin, rounds_per_team) VALUES (?, ?, ?, ?)",
            (session_id, request.name, request.pin, request.rounds_per_team)
        )
        await db.commit()

        async with db.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return SessionResponse(
                id=row["id"], name=row["name"], pin=row["pin"],
                status=row["status"], rounds_per_team=row["rounds_per_team"],
                created_at=row["created_at"]
            )
    finally:
        await db.close()


@router.get("", response_model=list[SessionResponse])
async def list_sessions():
    """List all sessions."""
    db = await get_db()
    try:
        async with db.execute("SELECT * FROM sessions ORDER BY created_at DESC") as cursor:
            rows = await cursor.fetchall()
            return [SessionResponse(
                id=row["id"], name=row["name"], pin=row["pin"],
                status=row["status"], rounds_per_team=row["rounds_per_team"],
                created_at=row["created_at"]
            ) for row in rows]
    finally:
        await db.close()


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get session by ID."""
    db = await get_db()
    try:
        async with db.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Session not found")
            return SessionResponse(
                id=row["id"], name=row["name"], pin=row["pin"],
                status=row["status"], rounds_per_team=row["rounds_per_team"],
                created_at=row["created_at"]
            )
    finally:
        await db.close()


@router.put("/{session_id}/status")
async def update_session_status(session_id: str, request: SessionStatusUpdate):
    """Update session status."""
    db = await get_db()
    try:
        await db.execute(
            "UPDATE sessions SET status = ? WHERE id = ?",
            (request.status.value, session_id)
        )
        await db.commit()
    finally:
        await db.close()

    if request.status.value == "ACTIVE":
        # Initialize game state for all games
        await game.set_session(session_id)
        await humming_game.set_session(session_id)
        await matrix_game.set_session(session_id)
    else:
        if game.session_id == session_id:
            await game.clear_session()
        if humming_game.session_id == session_id:
            await humming_game.clear_session()
        if matrix_game.session_id == session_id:
            await matrix_game.clear_session()

    return {"message": "Status updated", "status": request.status.value}


@router.post("/{session_id}/reset")
async def reset_session(session_id: str):
    """Reset session - clear all rounds and scores."""
    game.session_id = session_id
    humming_game.session_id = session_id
    matrix_game.session_id = session_id
    await game.reset_session()
    await humming_game.reset_session()
    await matrix_game.reset_session()
    return {"message": "Session reset"}


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and all related data."""
    db = await get_db()
    try:
        await db.execute("DELETE FROM rounds WHERE session_id = ?", (session_id,))
        await db.execute("DELETE FROM humming_rounds WHERE session_id = ?", (session_id,))
        await db.execute("DELETE FROM keywords WHERE session_id = ?", (session_id,))
        await db.execute("DELETE FROM songs WHERE session_id = ?", (session_id,))
        await db.execute("DELETE FROM teams WHERE session_id = ?", (session_id,))
        await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        await db.commit()

        if game.session_id == session_id:
            await game.clear_session()
        if humming_game.session_id == session_id:
            await humming_game.clear_session()
        if matrix_game.session_id == session_id:
            await matrix_game.clear_session()

        return {"message": "Session deleted"}
    finally:
        await db.close()
