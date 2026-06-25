"""Humming game state machine."""

import time
import uuid
import asyncio
from typing import Optional, Dict
from database import get_db, ensure_default_teams
from websocket_manager import manager
from models import GameState, TimerInfo, TeamResponse, SongResponse
from game_state import game as main_game_state

class HummingGameStateMachine:
    """Manages the Humming game mode state."""

    def __init__(self):
        self.session_id: Optional[str] = None
        self.state: GameState = GameState.WAITING
        self.current_team_id: Optional[str] = None
        self.current_song_id: Optional[str] = None
        self.current_round_id: Optional[str] = None
        self.round_number: int = 0
        self.timer_info: Optional[TimerInfo] = None
        self.hint_visible: bool = False
        self.steal_active: bool = False
        self._timer_task: Optional[asyncio.Task] = None
        
        # Humming specific
        self.is_media_playing: bool = False
        self.is_final_live: bool = False
        self.selected_team_id: Optional[str] = None
        self.main_answer_correct: Optional[int] = None

    async def get_full_state(self) -> dict:
        """Get the full current game state for Humming mode."""
        if self.session_id:
            await ensure_default_teams(self.session_id)
        db = await get_db()
        try:
            teams = []
            if self.session_id:
                async with db.execute(
                    "SELECT * FROM teams WHERE session_id = ? ORDER BY play_order",
                    (self.session_id,)
                ) as cursor:
                    rows = await cursor.fetchall()
                    for row in rows:
                        # Count keywords played by this team
                        async with db.execute(
                            "SELECT COUNT(*) as cnt FROM rounds WHERE session_id = ? AND team_id = ? AND state = 'FINISHED'",
                            (self.session_id, row["id"])
                        ) as count_cursor:
                            count_row = await count_cursor.fetchone()
                            completed_rounds = count_row["cnt"] if count_row else 0
                            
                        # Count songs played by this team
                        async with db.execute(
                            "SELECT COUNT(*) as cnt FROM humming_rounds WHERE session_id = ? AND team_id = ? AND state = 'FINISHED'",
                            (self.session_id, row["id"])
                        ) as song_cursor:
                            song_row = await song_cursor.fetchone()
                            completed_songs = song_row["cnt"] if song_row else 0

                        teams.append(TeamResponse(
                            id=row["id"], session_id=row["session_id"], name=row["name"],
                            member_count=row["member_count"], score=row["score"], play_order=row["play_order"],
                            completed_rounds=completed_rounds, completed_songs=completed_songs
                        ))

            current_song = None
            if self.current_song_id:
                async with db.execute(
                    "SELECT * FROM songs WHERE id = ?", (self.current_song_id,)
                ) as cursor:
                    row = await cursor.fetchone()
                    if row:
                        current_song = SongResponse(
                            id=row["id"], session_id=row["session_id"], title=row["title"],
                            media_url=row["media_url"], original_filename=row["original_filename"],
                            hint=row["hint"], singer=row["singer"], is_used=bool(row["is_used"]), is_final_live=bool(row["is_final_live"]),
                            team_id=row["team_id"]
                        )

            current_team = None
            if self.current_team_id:
                for t in teams:
                    if t.id == self.current_team_id:
                        current_team = t
                        break

            return {
                "session_id": self.session_id,
                "game_mode": "HUMMING",
                "state": self.state.value,
                "current_team": current_team.model_dump() if current_team else None,
                "current_song": current_song.model_dump() if current_song else None,
                "round_number": self.round_number,
                "timer": self.timer_info.model_dump() if self.timer_info else None,
                "teams": [t.model_dump() for t in teams],
                "hint_visible": self.hint_visible,
                "steal_active": self.steal_active,
                "show_intro": main_game_state.show_intro,
                "show_rules": main_game_state.show_rules,
                "show_scoreboard": main_game_state.show_scoreboard,
                # Additional fields for display
                "is_media_playing": self.is_media_playing,
                "is_final_live": self.is_final_live,
                "selected_team_id": self.selected_team_id,
                "main_answer_correct": self.main_answer_correct,
            }
        finally:
            await db.close()

    async def broadcast_state(self):
        state_data = await self.get_full_state()
        await manager.broadcast_state(state_data)

    async def start_round(self, team_id: str, song_id: str) -> dict:
        if self.state != GameState.WAITING:
            raise ValueError(f"Cannot start round in state {self.state}")

        db = await get_db()
        try:
            async with db.execute("SELECT * FROM songs WHERE id = ?", (song_id,)) as cursor:
                song = await cursor.fetchone()

            if not song:
                raise ValueError("Song not found")
            if song["team_id"] and song["team_id"] != team_id:
                raise ValueError("Bài hát không thuộc về đội thi đấu được chọn")

            await db.execute("UPDATE songs SET is_used = 1 WHERE id = ?", (song["id"],))

            async with db.execute(
                "SELECT COUNT(*) as cnt FROM humming_rounds WHERE session_id = ? AND team_id = ?",
                (self.session_id, team_id)
            ) as cursor:
                count_row = await cursor.fetchone()
                self.round_number = count_row["cnt"] + 1

            round_id = str(uuid.uuid4())
            await db.execute(
                """INSERT INTO humming_rounds (id, session_id, team_id, song_id, round_number, state)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (round_id, self.session_id, team_id, song["id"], self.round_number, GameState.READY.value)
            )
            await db.commit()

            self.current_team_id = team_id
            self.current_song_id = song["id"]
            self.current_round_id = round_id
            self.state = GameState.READY
            main_game_state.active_game_mode = "HUMMING"
            self.hint_visible = True  # Always show Genre + Year hint from the beginning
            self.steal_active = False
            main_game_state.show_rules = False
            self.is_final_live = bool(song["is_final_live"])
            self.is_media_playing = False
            self.timer_info = None
            self.main_answer_correct = None

            await self.broadcast_state()
            return {"round_id": round_id}
        finally:
            await db.close()

    async def play_pause_media(self, play: bool):
        """Play or pause the current media on display."""
        self.is_media_playing = play
        await self.broadcast_state()

    async def start_playing(self):
        """Start the guessing timer."""
        self.state = GameState.PLAYING
        self.is_media_playing = True
        self.timer_info = TimerInfo(start_time=time.time(), duration=30, type="playing")
        
        db = await get_db()
        try:
            await db.execute("UPDATE humming_rounds SET state = ? WHERE id = ?", (GameState.PLAYING.value, self.current_round_id))
            await db.commit()
        finally:
            await db.close()

        await self.broadcast_state()

        if self._timer_task:
            self._timer_task.cancel()
        self._timer_task = asyncio.create_task(self._play_timer_callback(30))

    async def _play_timer_callback(self, duration: int):
        try:
            await asyncio.sleep(duration)
            await self.time_up()
        except asyncio.CancelledError:
            pass

    async def time_up(self):
        if self.state == GameState.PLAYING:
            # Media finished playing (30s). Auto transition to THINKING (20s)
            self.state = GameState.THINKING
            self.is_media_playing = False
            self.timer_info = TimerInfo(start_time=time.time(), duration=20, type="thinking")
            db = await get_db()
            try:
                await db.execute("UPDATE humming_rounds SET state = ? WHERE id = ?", (GameState.THINKING.value, self.current_round_id))
                await db.commit()
            finally:
                await db.close()
            await self.broadcast_state()

            if self._timer_task:
                self._timer_task.cancel()
            self._timer_task = asyncio.create_task(self._play_timer_callback(20))

        elif self.state == GameState.THINKING:
            # Thinking time ended (20s). Move to confirm answer
            self.state = GameState.ANSWER_CONFIRM
            self.timer_info = None
            self.is_media_playing = False
            db = await get_db()
            try:
                await db.execute("UPDATE humming_rounds SET state = ? WHERE id = ?", (GameState.ANSWER_CONFIRM.value, self.current_round_id))
                await db.commit()
            finally:
                await db.close()
            await self.broadcast_state()

        elif self.state == GameState.HOPE_STAR:
            # Hope Star timer ended (20s). Stay in HOPE_STAR for MC to check/confirm
            self.timer_info = None
            self.is_media_playing = False
            await self.broadcast_state()

    async def confirm_answer(self, correct: bool):
        if self.state != GameState.ANSWER_CONFIRM:
            raise ValueError(f"Cannot confirm answer in state {self.state}")

        db = await get_db()
        try:
            self.main_answer_correct = 1 if correct else 0
            await db.execute("UPDATE humming_rounds SET main_answer_correct = ? WHERE id = ?", (self.main_answer_correct, self.current_round_id))
            
            if correct:
                points = 20 if self.is_final_live else 10
                await db.execute("UPDATE teams SET score = score + ? WHERE id = ?", (points, self.current_team_id))
                await db.execute("UPDATE humming_rounds SET score_awarded = ?, score_to_team = ?, state = ? WHERE id = ?", (points, self.current_team_id, GameState.FINISHED.value, self.current_round_id))
                await db.commit()
                self.state = GameState.FINISHED
                await self.broadcast_state()
                await manager.broadcast_effect("correct", {"points": points, "team_id": self.current_team_id})
                return {"correct": True, "points": points}
            else:
                # Wait for MC choice: activate Hope Star or decline it
                await db.commit()
                await self.broadcast_state()
                await manager.broadcast_effect("wrong")
                return {"correct": False, "points": 0}
        finally:
            await db.close()

    async def activate_hope_star(self):
        if self.state != GameState.ANSWER_CONFIRM:
            raise ValueError(f"Cannot activate Hope Star in state {self.state}")

        self.state = GameState.HOPE_STAR
        self.is_media_playing = True  # Re-play humming audio
        self.timer_info = TimerInfo(start_time=time.time(), duration=20, type="hope_star")

        db = await get_db()
        try:
            await db.execute("UPDATE humming_rounds SET state = ? WHERE id = ?", (GameState.HOPE_STAR.value, self.current_round_id))
            await db.commit()
        finally:
            await db.close()

        await self.broadcast_state()

        if self._timer_task:
            self._timer_task.cancel()
        self._timer_task = asyncio.create_task(self._play_timer_callback(20))

    async def decline_hope_star(self):
        if self.state != GameState.ANSWER_CONFIRM:
            raise ValueError(f"Cannot decline Hope Star in state {self.state}")

        # Deduct 5 points, move to STEAL state
        self.state = GameState.STEAL
        self.steal_active = True

        db = await get_db()
        try:
            await db.execute("UPDATE teams SET score = score - 5 WHERE id = ?", (self.current_team_id,))
            await db.execute(
                "UPDATE humming_rounds SET score_awarded = -5, score_to_team = ?, state = ? WHERE id = ?",
                (self.current_team_id, GameState.STEAL.value, self.current_round_id)
            )
            await db.commit()
        finally:
            await db.close()

        await self.broadcast_state()
        await manager.broadcast_effect("wrong_deduct", {"points": 5, "team_id": self.current_team_id})

    async def hope_star_answer(self, correct: bool):
        if self.state != GameState.HOPE_STAR:
            raise ValueError(f"Cannot confirm Hope Star answer in state {self.state}")

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None

        db = await get_db()
        try:
            if correct:
                # Double points: 20 for normal, 40 for live
                points = 40 if self.is_final_live else 20
                await db.execute("UPDATE teams SET score = score + ? WHERE id = ?", (points, self.current_team_id))
                await db.execute(
                    "UPDATE humming_rounds SET score_awarded = ?, score_to_team = ?, state = ?, steal_answer_correct = 1 WHERE id = ?",
                    (points, self.current_team_id, GameState.FINISHED.value, self.current_round_id)
                )
                await db.commit()
                self.state = GameState.FINISHED
                self.timer_info = None
                self.is_media_playing = False
                await self.broadcast_state()
                await manager.broadcast_effect("correct", {"points": points, "team_id": self.current_team_id})
            else:
                # Incorrect: 0 points (no penalty, no steal)
                await db.execute(
                    "UPDATE humming_rounds SET score_awarded = 0, state = ?, steal_answer_correct = 0 WHERE id = ?",
                    (GameState.FINISHED.value, self.current_round_id)
                )
                await db.commit()
                self.state = GameState.FINISHED
                self.timer_info = None
                self.is_media_playing = False
                await self.broadcast_state()
                await manager.broadcast_effect("wrong")
        finally:
            await db.close()

    async def steal_answer(self, steal_team_id: str, correct: bool):
        if self.state != GameState.STEAL:
            raise ValueError("Not in steal state")

        db = await get_db()
        try:
            await db.execute("UPDATE humming_rounds SET steal_team_id = ?, steal_answer_correct = ? WHERE id = ?", (steal_team_id, 1 if correct else 0, self.current_round_id))
            
            if correct:
                await db.execute("UPDATE teams SET score = score + 10 WHERE id = ?", (steal_team_id,))
                await db.execute("UPDATE humming_rounds SET score_awarded = 10, score_to_team = ?, state = ? WHERE id = ?", (steal_team_id, GameState.FINISHED.value, self.current_round_id))
                await db.commit()
                self.state = GameState.FINISHED
                self.steal_active = False
                await self.broadcast_state()
                await manager.broadcast_effect("correct", {"points": 10, "team_id": steal_team_id})
            else:
                await db.execute("UPDATE teams SET score = score - 5 WHERE id = ?", (steal_team_id,))
                await db.execute(
                    "UPDATE humming_rounds SET score_awarded = -5, score_to_team = ?, state = ? WHERE id = ?",
                    (steal_team_id, GameState.FINISHED.value, self.current_round_id)
                )
                await db.commit()
                self.state = GameState.FINISHED
                self.steal_active = False
                await self.broadcast_state()
                await manager.broadcast_effect("wrong")
        finally:
            await db.close()

    async def end_round(self):
        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None
        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_song_id = None
        self.current_round_id = None
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False
        self.is_media_playing = False
        self.round_number = 0
        self.main_answer_correct = None
        await self.broadcast_state()

    async def set_session(self, session_id: str):
        """Set the active session."""
        self.session_id = session_id
        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_song_id = None
        self.current_round_id = None
        self.round_number = 0
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False
        self.is_media_playing = False
        self.main_answer_correct = None
        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None
        await self.broadcast_state()

    async def reset_session(self):
        """Reset all game data for the current session."""
        if not self.session_id:
            return

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None

        db = await get_db()
        try:
            await db.execute("DELETE FROM humming_rounds WHERE session_id = ?", (self.session_id,))
            await db.execute("UPDATE songs SET is_used = 0 WHERE session_id = ?", (self.session_id,))
            await db.commit()
        finally:
            await db.close()

        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_song_id = None
        self.current_round_id = None
        self.round_number = 0
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False
        self.is_media_playing = False
        self.selected_team_id = None
        self.main_answer_correct = None

        await self.broadcast_state()

    async def force_cancel(self):
        """Force cancel the current round and return to WAITING state."""
        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_song_id = None
        self.current_round_id = None
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False
        self.is_media_playing = False
        self.selected_team_id = None
        self.main_answer_correct = None

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None

        await self.broadcast_state()

    async def clear_session(self):
        """Clear the current session completely."""
        self.session_id = None
        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_song_id = None
        self.current_round_id = None
        self.round_number = 0
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False
        self.is_media_playing = False
        self.selected_team_id = None
        self.main_answer_correct = None

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None

        await self.broadcast_state()

humming_game = HummingGameStateMachine()
