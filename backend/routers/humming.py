"""Humming game control router."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from humming_game_state import humming_game

router = APIRouter(prefix="/api/humming", tags=["humming"])

class StartHummingRoundRequest(BaseModel):
    session_id: str
    team_id: str
    song_id: str

class ConfirmAnswerRequest(BaseModel):
    correct: bool

class StealRequest(BaseModel):
    steal_team_id: str
    correct: bool

class PlayPauseRequest(BaseModel):
    play: bool

@router.post("/set-session/{session_id}")
async def set_session(session_id: str):
    """Set the active session for humming game."""
    humming_game.session_id = session_id
    await humming_game.broadcast_state()
    return {"message": "Session set", "session_id": session_id}

@router.post("/start-round")
async def start_round(request: StartHummingRoundRequest):
    """Start a new humming round."""
    try:
        if humming_game.session_id != request.session_id:
            humming_game.session_id = request.session_id
        result = await humming_game.start_round(request.team_id, request.song_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/play-pause")
async def play_pause(request: PlayPauseRequest):
    """Play or pause the media."""
    await humming_game.play_pause_media(request.play)
    return {"message": "Success", "is_media_playing": humming_game.is_media_playing}

@router.post("/start-playing")
async def start_playing():
    """Start the guess timer."""
    await humming_game.start_playing()
    return {"message": "Timer started"}

@router.post("/time-up")
async def time_up():
    """Manual time up trigger."""
    await humming_game.time_up()
    return {"message": "Time up triggered"}

@router.post("/confirm-answer")
async def confirm_answer(request: ConfirmAnswerRequest):
    """Confirm the main answer."""
    try:
        result = await humming_game.confirm_answer(request.correct)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/hint-answer")
async def hint_answer(request: ConfirmAnswerRequest):
    """Confirm the hint answer."""
    try:
        await humming_game.hint_answer(request.correct)
        return {"message": "Hint answer processed"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/skip-hint")
async def skip_hint():
    """Skip the hint phase without answering."""
    try:
        await humming_game.skip_hint()
        return {"message": "Hint skipped"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/steal")
async def steal(request: StealRequest):
    """Process a steal attempt."""
    try:
        await humming_game.steal_answer(request.steal_team_id, request.correct)
        return {"message": "Steal processed"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/end-round")
async def end_round():
    """End the current round."""
    await humming_game.end_round()
    return {"message": "Round ended"}
