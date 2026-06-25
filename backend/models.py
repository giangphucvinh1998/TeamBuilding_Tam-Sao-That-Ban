"""Pydantic models for request/response schemas."""

from pydantic import BaseModel
from typing import Optional
from enum import Enum


# --- Enums ---

class SessionStatus(str, Enum):
    CREATED = "CREATED"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class GameState(str, Enum):
    WAITING = "WAITING"
    READY = "READY"
    PREPARING = "PREPARING"
    PLAYING = "PLAYING"
    ANSWER_CONFIRM = "ANSWER_CONFIRM"
    HINT = "HINT"
    STEAL = "STEAL"
    THINKING = "THINKING"
    HOPE_STAR = "HOPE_STAR"
    FINISHED = "FINISHED"


# --- Session ---

class SessionCreate(BaseModel):
    name: str
    pin: str = "1234"
    rounds_per_team: int = 6


class SessionResponse(BaseModel):
    id: str
    name: str
    pin: str
    status: str
    rounds_per_team: int
    created_at: Optional[str] = None


class SessionStatusUpdate(BaseModel):
    status: SessionStatus


# --- Team ---

class TeamCreate(BaseModel):
    name: str
    member_count: int = 5


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    member_count: Optional[int] = None
    score: Optional[int] = None


class TeamResponse(BaseModel):
    id: str
    session_id: str
    name: str
    member_count: int
    score: int
    play_order: int
    created_at: Optional[str] = None
    completed_rounds: int = 0
    completed_songs: int = 0


# --- Keyword ---

class KeywordCreate(BaseModel):
    keyword: str
    answer: str
    hint: str = ""
    hint_image_url: Optional[str] = None


class KeywordUpdate(BaseModel):
    keyword: Optional[str] = None
    answer: Optional[str] = None
    hint: Optional[str] = None
    hint_image_url: Optional[str] = None


class KeywordResponse(BaseModel):
    id: str
    session_id: str
    keyword: str
    answer: str
    hint: str
    hint_image_url: Optional[str]
    is_used: bool


# --- Game Control ---

class StartRoundRequest(BaseModel):
    session_id: str
    team_id: str
    keyword_id: str


class ConfirmAnswerRequest(BaseModel):
    correct: bool


class StealRequest(BaseModel):
    steal_team_id: str
    correct: bool


class PlayPauseRequest(BaseModel):
    play: bool


# --- WebSocket Messages ---

class WSMessage(BaseModel):
    type: str
    data: dict = {}


# --- Song ---

class SongCreate(BaseModel):
    title: str
    media_url: str
    original_filename: str = ""
    hint: str = ""
    singer: str = ""
    is_final_live: bool = False
    team_id: Optional[str] = None

class SongUpdate(BaseModel):
    title: Optional[str] = None
    media_url: Optional[str] = None
    original_filename: Optional[str] = None
    hint: Optional[str] = None
    singer: Optional[str] = None
    is_final_live: Optional[bool] = None
    is_used: Optional[bool] = None
    team_id: Optional[str] = None

class SongResponse(BaseModel):
    id: str
    session_id: str
    title: str
    media_url: str
    original_filename: str
    hint: str
    singer: str
    is_used: bool
    is_final_live: bool
    team_id: Optional[str] = None


# --- Matrix Game ---

class MatrixTimerRequest(BaseModel):
    minutes: int

class MatrixScoreRequest(BaseModel):
    team_scores: dict[str, int]


# --- Game State Broadcast ---

class TimerInfo(BaseModel):
    start_time: float  # Unix timestamp
    duration: int  # seconds
    type: str  # "preparing" or "playing"


class GameStateResponse(BaseModel):
    session_id: Optional[str] = None
    game_mode: str = "TAM_SAO"  # "TAM_SAO" or "HUMMING"
    state: str
    current_team: Optional[TeamResponse] = None
    current_keyword: Optional[str] = None  # Only for admin
    current_answer: Optional[str] = None   # Only for admin
    current_hint: Optional[str] = None     # Shown after HINT state
    current_hint_image_url: Optional[str] = None # Shown after HINT state
    current_song: Optional[SongResponse] = None # For Humming mode
    round_number: Optional[int] = None
    timer: Optional[TimerInfo] = None
    teams: list[TeamResponse] = []
    matrix: Optional[list[list[str]]] = None
    hint_visible: bool = False
    steal_active: bool = False
    show_intro: bool = False
    show_rules: bool = False
    show_scoreboard: bool = False
    selected_team_id: Optional[str] = None
