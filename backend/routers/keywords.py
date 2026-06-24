"""Keywords router - CRUD for keywords/questions within a session."""

import uuid
import csv
import io
from fastapi import APIRouter, HTTPException, UploadFile, File
from database import get_db
from models import KeywordCreate, KeywordUpdate, KeywordResponse

router = APIRouter(prefix="/api", tags=["keywords"])


@router.get("/sessions/{session_id}/keywords", response_model=list[KeywordResponse])
async def list_keywords(session_id: str):
    """List all keywords in a session."""
    db = await get_db()
    try:
        async with db.execute(
            "SELECT * FROM keywords WHERE session_id = ? ORDER BY rowid",
            (session_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [KeywordResponse(
                id=row["id"], session_id=row["session_id"],
                keyword=row["keyword"], answer=row["answer"],
                hint=row["hint"], hint_image_url=row["hint_image_url"], is_used=bool(row["is_used"])
            ) for row in rows]
    finally:
        await db.close()


@router.post("/sessions/{session_id}/keywords", response_model=KeywordResponse)
async def create_keyword(session_id: str, request: KeywordCreate):
    """Add a keyword to the session."""
    keyword_id = str(uuid.uuid4())
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO keywords (id, session_id, keyword, answer, hint) VALUES (?, ?, ?, ?, ?)",
            (keyword_id, session_id, request.keyword, request.answer, request.hint)
        )
        await db.commit()

        return KeywordResponse(
            id=keyword_id, session_id=session_id,
            keyword=request.keyword, answer=request.answer,
            hint=request.hint, hint_image_url=None, is_used=False
        )
    finally:
        await db.close()


@router.post("/sessions/{session_id}/keywords/import")
async def import_keywords(session_id: str, file: UploadFile = File(...)):
    """Import keywords from a CSV file."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    content = await file.read()
    decoded = content.decode("utf-8-sig")  # utf-8-sig handles BOM
    reader = csv.reader(io.StringIO(decoded))
    
    # Read rows
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="Empty CSV file")

    # Skip header if it exists (check if first row has 'STT' or 'Từ Khóa')
    if "Từ Khóa" in rows[0] or "STT" in rows[0] or "Từ khóa" in rows[0]:
        rows = rows[1:]

    db = await get_db()
    try:
        count = 0
        for row in rows:
            if len(row) < 2:
                continue # Skip invalid rows
            
            # format: STT, Từ Khóa, Điểm Nhấn & Gợi Ý
            keyword_text = row[1].strip()
            if not keyword_text:
                continue
                
            hint_text = row[2].strip() if len(row) > 2 else ""
            
            keyword_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO keywords (id, session_id, keyword, answer, hint) VALUES (?, ?, ?, ?, ?)",
                (keyword_id, session_id, keyword_text, keyword_text, hint_text)
            )
            count += 1
            
        await db.commit()
        return {"message": f"Successfully imported {count} keywords", "count": count}
    finally:
        await db.close()



@router.put("/keywords/{keyword_id}", response_model=KeywordResponse)
async def update_keyword(keyword_id: str, request: KeywordUpdate):
    """Update keyword info."""
    db = await get_db()
    try:
        updates = []
        params = []
        if request.keyword is not None:
            updates.append("keyword = ?")
            params.append(request.keyword)
        if request.answer is not None:
            updates.append("answer = ?")
            params.append(request.answer)
        if request.hint is not None:
            updates.append("hint = ?")
            params.append(request.hint)
        if request.hint_image_url is not None:
            updates.append("hint_image_url = ?")
            params.append(request.hint_image_url)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(keyword_id)
        await db.execute(
            f"UPDATE keywords SET {', '.join(updates)} WHERE id = ?",
            params
        )
        await db.commit()

        async with db.execute("SELECT * FROM keywords WHERE id = ?", (keyword_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Keyword not found")
            return KeywordResponse(
                id=row["id"], session_id=row["session_id"],
                keyword=row["keyword"], answer=row["answer"],
                hint=row["hint"], hint_image_url=row["hint_image_url"],
                is_used=bool(row["is_used"])
            )
    finally:
        await db.close()


import os
import shutil

@router.post("/keywords/{keyword_id}/image")
async def upload_keyword_image(keyword_id: str, file: UploadFile = File(...)):
    """Upload an image for a keyword hint."""
    db = await get_db()
    try:
        # Check if keyword exists
        async with db.execute("SELECT id FROM keywords WHERE id = ?", (keyword_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Keyword not found")
                
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
            
        # Create uploads directory if not exists
        upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        ext = os.path.splitext(file.filename)[1]
        filename = f"hint_{keyword_id}{ext}"
        filepath = os.path.join(upload_dir, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        image_url = f"/uploads/{filename}"
        
        # Update database
        await db.execute(
            "UPDATE keywords SET hint_image_url = ? WHERE id = ?",
            (image_url, keyword_id)
        )
        await db.commit()
        
        return {"message": "Image uploaded successfully", "url": image_url}
    finally:
        await db.close()


@router.delete("/keywords/{keyword_id}")
async def delete_keyword(keyword_id: str):
    """Delete a keyword."""
    db = await get_db()
    try:
        await db.execute("DELETE FROM keywords WHERE id = ?", (keyword_id,))
        await db.commit()
        return {"message": "Keyword deleted"}
    finally:
        await db.close()
