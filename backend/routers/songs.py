"""Songs router - CRUD and uploads for humming songs."""

import os
import uuid
import shutil
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
            """INSERT INTO songs (id, session_id, title, media_url, original_filename, hint, is_final_live)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (song_id, session_id, request.title, request.media_url, request.original_filename,
             request.hint, 1 if request.is_final_live else 0)
        )
        await db.commit()

        async with db.execute("SELECT * FROM songs WHERE id = ?", (song_id,)) as cursor:
            row = await cursor.fetchone()
            return SongResponse(
                id=row["id"], session_id=row["session_id"], title=row["title"],
                media_url=row["media_url"], original_filename=row["original_filename"],
                hint=row["hint"], is_used=bool(row["is_used"]), is_final_live=bool(row["is_final_live"])
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
                id=row["id"], session_id=row["session_id"], title=row["title"],
                media_url=row["media_url"], original_filename=row["original_filename"],
                hint=row["hint"], is_used=bool(row["is_used"]), is_final_live=bool(row["is_final_live"])
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
                id=row["id"], session_id=row["session_id"], title=row["title"],
                media_url=row["media_url"], original_filename=row["original_filename"],
                hint=row["hint"], is_used=bool(row["is_used"]), is_final_live=bool(row["is_final_live"])
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
