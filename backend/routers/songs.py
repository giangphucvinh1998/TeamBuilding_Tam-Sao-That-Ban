"""Songs router - CRUD and uploads for humming songs."""

import os
import uuid
import shutil
import csv
import io
from fastapi import APIRouter, HTTPException, UploadFile, File
from database import get_db
from models import SongCreate, SongUpdate, SongResponse

router = APIRouter(prefix="/api/songs", tags=["songs"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")


@router.post("/upload")
async def upload_song_file(file: UploadFile = File(...)):
    """Upload an audio or video file for a song."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".mp3", ".mp4", ".mov", ".wav", ".webm", ".m4a"]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file mp3, mp4, mov, wav, webm, m4a")
        
    filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return the URL path
    return {"url": f"/uploads/{filename}", "original_filename": file.filename}


@router.post("", response_model=SongResponse)
async def create_song(request: SongCreate, session_id: str):
    """Create a new song for a session."""
    song_id = str(uuid.uuid4())
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO songs (id, session_id, team_id, title, media_url, original_filename, hint, singer, is_final_live)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (song_id, session_id, request.team_id, request.title, request.media_url, request.original_filename,
             request.hint, request.singer, 1 if request.is_final_live else 0)
        )
        await db.commit()

        async with db.execute("SELECT * FROM songs WHERE id = ?", (song_id,)) as cursor:
            row = await cursor.fetchone()
            return SongResponse(
                id=row["id"], session_id=row["session_id"], team_id=row["team_id"], title=row["title"],
                media_url=row["media_url"], original_filename=row["original_filename"],
                hint=row["hint"], singer=row["singer"], is_used=bool(row["is_used"]), is_final_live=bool(row["is_final_live"])
            )
    finally:
        await db.close()


@router.get("", response_model=list[SongResponse])
async def list_songs(session_id: str):
    """List all songs for a session."""
    db = await get_db()
    try:
        async with db.execute("SELECT * FROM songs WHERE session_id = ?", (session_id,)) as cursor:
            rows = await cursor.fetchall()
            return [SongResponse(
                id=row["id"], session_id=row["session_id"], team_id=row["team_id"], title=row["title"],
                media_url=row["media_url"], original_filename=row["original_filename"],
                hint=row["hint"], singer=row["singer"], is_used=bool(row["is_used"]), is_final_live=bool(row["is_final_live"])
            ) for row in rows]
    finally:
        await db.close()


@router.put("/{song_id}", response_model=SongResponse)
async def update_song(song_id: str, request: SongUpdate):
    """Update a song."""
    db = await get_db()
    try:
        # Build update query dynamically
        update_fields = []
        params = []
        for field, value in request.model_dump(exclude_unset=True).items():
            if field in ("is_final_live", "is_used"):
                update_fields.append(f"{field} = ?")
                params.append(1 if value else 0)
            else:
                update_fields.append(f"{field} = ?")
                params.append(value)
                
        if update_fields:
            params.append(song_id)
            query = f"UPDATE songs SET {', '.join(update_fields)} WHERE id = ?"
            await db.execute(query, params)
            await db.commit()

        async with db.execute("SELECT * FROM songs WHERE id = ?", (song_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Song not found")
            return SongResponse(
                id=row["id"], session_id=row["session_id"], team_id=row["team_id"], title=row["title"],
                media_url=row["media_url"], original_filename=row["original_filename"],
                hint=row["hint"], singer=row["singer"], is_used=bool(row["is_used"]), is_final_live=bool(row["is_final_live"])
            )
    finally:
        await db.close()


@router.delete("/{song_id}")
async def delete_song(song_id: str):
    """Delete a song."""
    db = await get_db()
    try:
        await db.execute("DELETE FROM songs WHERE id = ?", (song_id,))
        await db.commit()
        return {"message": "Song deleted"}
    finally:
        await db.close()


@router.post("/sessions/{session_id}/import")
async def import_songs(session_id: str, file: UploadFile = File(...)):
    """Import songs from a CSV file."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file CSV")

    content = await file.read()
    decoded = content.decode("utf-8-sig")  # utf-8-sig handles BOM
    reader = csv.reader(io.StringIO(decoded))
    
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="File CSV trống")

    # Skip header if it exists (check if first row contains column headers)
    if any(h in rows[0][0] or h in rows[0][1] for h in ["STT", "Đội", "Tên", "Bài"]):
        rows = rows[1:]

    db = await get_db()
    try:
        # Load existing teams for matching
        async with db.execute("SELECT id, name FROM teams WHERE session_id = ?", (session_id,)) as cursor:
            team_rows = await cursor.fetchall()
            teams_map = {r["name"].strip().lower(): r["id"] for r in team_rows}

        count = 0
        for row in rows:
            if len(row) < 3:
                continue # Skip invalid rows
            
            raw_team = row[1].strip()
            raw_title = row[2].strip()
            if not raw_title:
                continue
                
            raw_hint = row[3].strip() if len(row) > 3 else ""
            raw_singer = row[4].strip() if len(row) > 4 else ""
            raw_type = row[5].strip().lower() if len(row) > 5 else "media"
            raw_filename = row[6].strip() if len(row) > 6 else ""

            # Match team ID
            team_id = teams_map.get(raw_team.lower())
            if not team_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"Không tìm thấy đội '{raw_team}' trong phiên chơi. Vui lòng kiểm tra lại tên đội trong CSV."
                )

            song_id = str(uuid.uuid4())
            is_final_live = 1 if "live" in raw_type else 0
            
            # Match existing uploaded file if filename matches
            media_url = ""
            if raw_filename:
                async with db.execute(
                    "SELECT media_url FROM songs WHERE session_id = ? AND original_filename = ? AND media_url != '' LIMIT 1",
                    (session_id, raw_filename)
                ) as cursor:
                    match_row = await cursor.fetchone()
                    if match_row:
                        media_url = match_row["media_url"]

            await db.execute(
                """INSERT INTO songs (id, session_id, team_id, title, media_url, original_filename, hint, singer, is_final_live)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (song_id, session_id, team_id, raw_title, media_url, raw_filename, raw_hint, raw_singer, is_final_live)
            )
            count += 1

        await db.commit()
        return {"message": f"Import thành công {count} bài hát", "count": count}
    finally:
        await db.close()
