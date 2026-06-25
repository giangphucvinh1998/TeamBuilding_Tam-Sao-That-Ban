"""Matrix game router."""

from fastapi import APIRouter
from models import MatrixTimerRequest, MatrixScoreRequest
from matrix_game_state import matrix_game

router = APIRouter(prefix="/api/matrix", tags=["matrix"])

@router.post("/phase1")
async def start_phase_1():
    await matrix_game.start_phase_1()
    return {"status": "ok"}

@router.post("/phase2")
async def start_phase_2():
    await matrix_game.start_phase_2()
    return {"status": "ok"}

@router.post("/phase3")
async def start_phase_3():
    await matrix_game.start_phase_3()
    return {"status": "ok"}

@router.post("/answer-time")
async def start_answer_time(request: MatrixTimerRequest):
    await matrix_game.start_answer_timer(request.minutes)
    return {"status": "ok"}

@router.post("/end-timer")
async def end_timer():
    await matrix_game.transition_to_scoring()
    return {"status": "ok"}


@router.post("/score")
async def score_teams(request: MatrixScoreRequest):
    await matrix_game.award_scores(request.team_scores)
    return {"status": "ok"}

@router.post("/end-game")
async def end_game():
    await matrix_game.end_game()
    return {"status": "ok"}
