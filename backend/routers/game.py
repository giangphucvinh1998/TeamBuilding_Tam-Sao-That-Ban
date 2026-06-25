"""Game router - Controls the game flow."""

from fastapi import APIRouter, HTTPException
from models import StartRoundRequest, ConfirmAnswerRequest, StealRequest
from game_state import game

router = APIRouter(prefix="/api/game", tags=["game"])


@router.get("/state")
async def get_state():
    """Get current game state."""
    if not game.session_id:
        return {"state": "NO_SESSION", "message": "No active session"}
    return await game.get_full_state()


@router.post("/start-round")
async def start_round(request: StartRoundRequest):
    """Start a new round - select team and random keyword."""
    try:
        game.session_id = request.session_id
        result = await game.start_round(request.team_id, request.keyword_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/start-preparing")
async def start_preparing():
    """Start the 15-second preparation timer."""
    try:
        await game.start_preparing()
        return {"message": "Preparation timer started", "duration": 15}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/start-playing")
async def start_playing():
    """Skip preparation and start the contest timer immediately."""
    try:
        await game.start_playing()
        return {"message": "Contest timer started"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/time-up")
async def time_up():
    """Manually trigger time up (MC can call this before timer expires)."""
    try:
        await game.time_up()
        return {"message": "Time up"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/confirm-answer")
async def confirm_answer(request: ConfirmAnswerRequest):
    """BTC confirms whether the main answer is correct."""
    try:
        result = await game.confirm_answer(request.correct)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/show-hint")
async def show_hint():
    """Skip to hint phase (from ANSWER_CONFIRM)."""
    try:
        await game.skip_to_hint()
        return {"message": "Hint shown"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/teammate-answer")
async def teammate_answer(request: ConfirmAnswerRequest):
    """Teammate answers after hint."""
    try:
        result = await game.teammate_answer(request.correct)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/skip-to-steal")
async def skip_to_steal():
    """Skip to steal phase (from HINT)."""
    try:
        await game.skip_to_steal()
        return {"message": "Steal phase started"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/steal")
async def steal(request: StealRequest):
    """Another team steals the point."""
    try:
        result = await game.steal_answer(request.steal_team_id, request.correct)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/end-round")
async def end_round():
    """End the current round."""
    try:
        await game.end_round()
        return {"message": "Round ended"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/toggle-intro")
async def toggle_intro():
    """Toggle the intro video."""
    await game.toggle_intro()
    return {"message": "Intro toggled", "show_intro": game.show_intro}

@router.post("/toggle-rules")
async def toggle_rules():
    """Toggle the rules overlay."""
    await game.toggle_rules()
    return {"message": "Rules toggled", "show_rules": game.show_rules}

@router.post("/toggle-scoreboard")
async def toggle_scoreboard():
    """Toggle the scoreboard overlay."""
    await game.toggle_scoreboard()
    return {"message": "Scoreboard toggled", "show_scoreboard": game.show_scoreboard}

@router.post("/set-mode/{mode}")
async def set_game_mode(mode: str):
    """Set the active game mode and reset other game states to WAITING."""
    if mode not in ["TAM_SAO", "HUMMING", "MATRIX"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid game mode")
    
    game.active_game_mode = mode
    from humming_game_state import humming_game
    from matrix_game_state import matrix_game
    
    # Reset other game states so they start fresh in WAITING
    try:
        await game.force_cancel()
    except Exception as e:
        print(f"Error resetting TAM_SAO state: {e}")
        
    try:
        await humming_game.force_cancel()
    except Exception as e:
        print(f"Error resetting HUMMING state: {e}")
        
    try:
        await matrix_game.reset_session()
    except Exception as e:
        print(f"Error resetting MATRIX state: {e}")

    # Broadcast state for the active mode
    if mode == "MATRIX":
        await matrix_game.broadcast_state()
    elif mode == "HUMMING":
        await humming_game.broadcast_state()
    else:
        await game.broadcast_state()
        
    return {"message": f"Game mode set to {mode}", "game_mode": mode}

@router.post("/force-cancel")
async def force_cancel():
    """Force cancel the round and return to WAITING state."""
    await game.force_cancel()
    return {"message": "Round cancelled"}


@router.post("/select-team/{team_id}")
async def select_team(team_id: str):
    """Set the selected team in WAITING state to show on the display screen."""
    team_val = team_id if team_id != "none" else None
    game.selected_team_id = team_val
    
    from humming_game_state import humming_game
    humming_game.selected_team_id = team_val
    
    if game.active_game_mode == "HUMMING":
        await humming_game.broadcast_state()
    else:
        await game.broadcast_state()
        
    return {"status": "ok"}
