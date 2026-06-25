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
            if not rows:
                # Auto-seed the 20 default keywords for the 5 teams
                default_keywords = [
                    # Xanh biển
                    ("Ngủ gật", "[Xanh biển] trạng thái của con người", "trạng thái của con người"),
                    ("Khủng long", "[Xanh biển] loài động vật", "loài động vật"),
                    ("Uống nước nhớ nguồn", "[Xanh biển] biết ơn tổ tiên", "biết ơn tổ tiên"),
                    ("Ném đá giấu tay", "[Xanh biển] hãm hại người khác", "hãm hại người khác"),
                    # Xanh ngọc
                    ("Vỗ tay", "[Xanh ngọc] hành động của con người", "hành động của con người"),
                    ("Sóng thần", "[Xanh ngọc] hiện tượng tự nhiên", "hiện tượng tự nhiên"),
                    ("Giận cá chém thớt", "[Xanh ngọc] trút cơn bực tức", "trút cơn bực tức"),
                    ("Cưỡi ngựa xem hoa", "[Xanh ngọc] hời hợt, qua loa", "hời hợt, qua loa"),
                    # Xanh lá
                    ("Ôm nhau", "[Xanh lá] hành động của con người", "hành động của con người"),
                    ("Xe tăng", "[Xanh lá] phương tiện", "phương tiện"),
                    ("Chân lấm tay bùn", "[Xanh lá] vất vả cực nhọc", "vất vả cực nhọc"),
                    ("Tre già măng mọc", "[Xanh lá] quy luật thế hệ", "quy luật thế hệ"),
                    # Tim tím
                    ("Chạy bộ", "[Tim tím] hành động của con người", "hành động của con người"),
                    ("Động đất", "[Tim tím] hiện tượng tự nhiên", "hiện tượng tự nhiên"),
                    ("Cá lớn nuốt cá bé", "[Tim tím] quy luật mạnh yếu", "quy luật mạnh yếu"),
                    ("Nước chảy đá mòn", "[Tim tím] kiên trì, nhẫn nại", "kiên trì, nhẫn nại"),
                    # Đo đỏ
                    ("Khóc lóc", "[Đo đỏ] hành động của con người", "hành động của con người"),
                    ("Tàu ngầm", "[Đo đỏ] phương tiện", "phương tiện"),
                    ("Một vốn bốn lời", "[Đo đỏ] đầu tư, kinh doanh", "đầu tư, kinh doanh"), # Wait, "Một vốn bốn lời"
                    ("Há miệng chờ sung", "[Đo đỏ] lười biếng, thụ động", "lười biếng, thụ động"),
                ]
                # Fix "Một vốn *(bốn lời)*" from the user screenshot if they want exactly "Một vốn bốn lời"
                # Let's check the user prompt: "Một vốn bốn lời (đầu tư, kinh doanh)"
                # Yes, let's use "Một vốn bốn lời"
                default_keywords[18] = ("Một vốn bốn lời", "[Đo đỏ] đầu tư, kinh doanh", "đầu tư, kinh doanh")
                
                for kw, ans, hnt in default_keywords:
                    keyword_id = str(uuid.uuid4())
                    await db.execute(
                        "INSERT INTO keywords (id, session_id, keyword, answer, hint) VALUES (?, ?, ?, ?, ?)",
                        (keyword_id, session_id, kw, ans, hnt)
                    )
                await db.commit()
                # Query again
                async with db.execute(
                    "SELECT * FROM keywords WHERE session_id = ? ORDER BY rowid",
                    (session_id,)
                ) as cursor2:
                    rows = await cursor2.fetchall()

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
