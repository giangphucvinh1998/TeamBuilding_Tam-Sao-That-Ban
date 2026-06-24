"""Auth router - Simple PIN verification."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


class PinRequest(BaseModel):
    session_id: str
    pin: str


class PinResponse(BaseModel):
    success: bool
    message: str


@router.post("/verify-pin", response_model=PinResponse)
async def verify_pin(request: PinRequest):
    """Verify PIN to access admin panel."""
    db = await get_db()
    try:
        async with db.execute(
            "SELECT pin FROM sessions WHERE id = ?",
            (request.session_id,)
        ) as cursor:
            row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        if row["pin"] == request.pin:
            return PinResponse(success=True, message="PIN correct")
        else:
            raise HTTPException(status_code=401, detail="Invalid PIN")
    finally:
        await db.close()
