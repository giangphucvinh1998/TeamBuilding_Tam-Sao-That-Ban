"""Teams router - CRUD for teams within a session."""

import uuid
from fastapi import APIRouter, HTTPException
from database import get_db
from models import TeamCreate, TeamUpdate, TeamResponse

router = APIRouter(prefix="/api", tags=["teams"])


@router.get("/sessions/{session_id}/teams", response_model=list[TeamResponse])
async def list_teams(session_id: str):
    """List all teams in a session."""
    db = await get_db()
    try:
        async with db.execute(
            "SELECT * FROM teams WHERE session_id = ? ORDER BY play_order",
            (session_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [TeamResponse(
                id=row["id"], session_id=row["session_id"],
                name=row["name"], member_count=row["member_count"],
                score=row["score"], play_order=row["play_order"],
                created_at=row["created_at"]
            ) for row in rows]
    finally:
        await db.close()


@router.post("/sessions/{session_id}/teams", response_model=TeamResponse)
async def create_team(session_id: str, request: TeamCreate):
    """Add a team to the session."""
    team_id = str(uuid.uuid4())
    db = await get_db()
    try:
        # Get next play order
        async with db.execute(
            "SELECT COALESCE(MAX(play_order), 0) + 1 as next_order FROM teams WHERE session_id = ?",
            (session_id,)
        ) as cursor:
            row = await cursor.fetchone()
            play_order = row["next_order"]

        await db.execute(
            "INSERT INTO teams (id, session_id, name, member_count, play_order) VALUES (?, ?, ?, ?, ?)",
            (team_id, session_id, request.name, request.member_count, play_order)
        )
        await db.commit()

        return TeamResponse(
            id=team_id, session_id=session_id,
            name=request.name, member_count=request.member_count,
            score=0, play_order=play_order
        )
    finally:
        await db.close()


@router.put("/teams/{team_id}", response_model=TeamResponse)
async def update_team(team_id: str, request: TeamUpdate):
    """Update team info."""
    db = await get_db()
    try:
        # Build update query dynamically
        updates = []
        params = []
        if request.name is not None:
            updates.append("name = ?")
            params.append(request.name)
        if request.member_count is not None:
            updates.append("member_count = ?")
            params.append(request.member_count)
        if request.score is not None:
            updates.append("score = ?")
            params.append(request.score)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(team_id)
        await db.execute(
            f"UPDATE teams SET {', '.join(updates)} WHERE id = ?",
            params
        )
        await db.commit()

        async with db.execute("SELECT * FROM teams WHERE id = ?", (team_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Team not found")
            return TeamResponse(
                id=row["id"], session_id=row["session_id"],
                name=row["name"], member_count=row["member_count"],
                score=row["score"], play_order=row["play_order"],
                created_at=row["created_at"]
            )
    finally:
        await db.close()


@router.delete("/teams/{team_id}")
async def delete_team(team_id: str):
    """Delete a team."""
    db = await get_db()
    try:
        await db.execute("DELETE FROM teams WHERE id = ?", (team_id,))
        await db.commit()
        return {"message": "Team deleted"}
    finally:
        await db.close()
