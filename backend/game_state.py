"""Game state machine - manages game flow and state transitions."""

import time
import uuid
import asyncio
from typing import Optional, Dict
from database import get_db, ensure_default_teams
from websocket_manager import manager
from models import GameState, TimerInfo, TeamResponse


class GameStateMachine:
    """Manages the game state for a session."""

    def __init__(self):
        self.session_id: Optional[str] = None
        self.state: GameState = GameState.WAITING
        self.current_team_id: Optional[str] = None
        self.current_keyword_id: Optional[str] = None
        self.current_round_id: Optional[str] = None
        self.round_number: int = 0
        self.timer_info: Optional[TimerInfo] = None
        self.hint_visible: bool = False
        self.steal_active: bool = False
        self.show_intro: bool = False
        self.show_rules: bool = False
        self.show_scoreboard: bool = False
        self.active_game_mode: str = "MATRIX"
        self._timer_task: Optional[asyncio.Task] = None
        self.selected_team_id: Optional[str] = None

    async def get_full_state(self) -> dict:
        """Get the full current game state."""
        if self.session_id:
            await ensure_default_teams(self.session_id)
        db = await get_db()
        try:
            # Get teams
            teams = []

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
                        id=row["id"],
                        session_id=row["session_id"],
                        name=row["name"],
                        member_count=row["member_count"],
                        score=row["score"],
                        play_order=row["play_order"],
                        completed_rounds=completed_rounds,
                        completed_songs=completed_songs
                    ))

            # Get current keyword info
            current_keyword = None
            current_answer = None
            current_hint = None
            current_hint_image_url = None
            if self.current_keyword_id:
                async with db.execute(
                    "SELECT * FROM keywords WHERE id = ?",
                    (self.current_keyword_id,)
                ) as cursor:
                    kw_row = await cursor.fetchone()
                    if kw_row:
                        current_keyword = kw_row["keyword"]
                        current_answer = kw_row["answer"]
                        current_hint = kw_row["hint"]
                        current_hint_image_url = kw_row["hint_image_url"]

            # Get current team
            current_team = None
            if self.current_team_id:
                for t in teams:
                    if t.id == self.current_team_id:
                        current_team = t
                        break

            return {
                "session_id": self.session_id,
                "game_mode": "TAM_SAO",
                "state": self.state.value,
                "current_team": current_team.model_dump() if current_team else None,
                "current_keyword": current_keyword,
                "current_answer": current_answer,
                "current_hint": current_hint,
                "current_hint_image_url": current_hint_image_url,
                "round_number": self.round_number,
                "timer": self.timer_info.model_dump() if self.timer_info else None,
                "teams": [t.model_dump() for t in teams],
                "hint_visible": self.hint_visible,
                "steal_active": self.steal_active,
                "show_intro": self.show_intro,
                "show_rules": self.show_rules,
                "show_scoreboard": self.show_scoreboard,
                "selected_team_id": self.selected_team_id,
            }
        finally:
            await db.close()

    async def broadcast_state(self):
        """Broadcast current state to all clients."""
        state_data = await self.get_full_state()
        await manager.broadcast_state(state_data)

    async def toggle_intro(self):
        """Toggle the intro video."""
        self.show_intro = not self.show_intro
        await self.broadcast_state()

    async def toggle_rules(self):
        """Toggle the rules overlay."""
        self.show_rules = not self.show_rules
        from humming_game_state import humming_game
        from matrix_game_state import matrix_game
        if self.active_game_mode == "MATRIX":
            await matrix_game.broadcast_state()
        elif self.active_game_mode == "HUMMING":
            await humming_game.broadcast_state()
        else:
            await self.broadcast_state()

    async def toggle_scoreboard(self):
        """Toggle the scoreboard overlay."""
        self.show_scoreboard = not self.show_scoreboard
        from humming_game_state import humming_game
        from matrix_game_state import matrix_game
        if self.active_game_mode == "MATRIX":
            await matrix_game.broadcast_state()
        elif self.active_game_mode == "HUMMING":
            await humming_game.broadcast_state()
        else:
            await self.broadcast_state()

    async def set_session(self, session_id: str):
        """Set the active session."""
        self.session_id = session_id
        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_keyword_id = None
        self.current_round_id = None
        self.round_number = 0
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False
        await self.broadcast_state()

    async def start_round(self, team_id: str, keyword_id: str) -> dict:
        """Start a new round - select team and specific keyword."""
        if self.state != GameState.WAITING:
            raise ValueError(f"Cannot start round in state {self.state}")

        db = await get_db()
        try:
            # Select the specific keyword and check if it's unused
            async with db.execute(
                "SELECT * FROM keywords WHERE id = ? AND session_id = ?",
                (keyword_id, self.session_id)
            ) as cursor:
                keyword_row = await cursor.fetchone()

            if not keyword_row:
                raise ValueError("Keyword not found")

            # Mark keyword as used
            await db.execute(
                "UPDATE keywords SET is_used = 1 WHERE id = ?",
                (keyword_row["id"],)
            )

            # Count existing rounds for this team
            async with db.execute(
                "SELECT COUNT(*) as cnt FROM rounds WHERE session_id = ? AND team_id = ?",
                (self.session_id, team_id)
            ) as cursor:
                count_row = await cursor.fetchone()
                self.round_number = count_row["cnt"] + 1

            # Create round record
            round_id = str(uuid.uuid4())
            await db.execute(
                """INSERT INTO rounds (id, session_id, team_id, keyword_id, round_number, state)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (round_id, self.session_id, team_id, keyword_row["id"],
                 self.round_number, GameState.READY.value)
            )
            await db.commit()

            self.current_team_id = team_id
            self.current_keyword_id = keyword_row["id"]
            self.current_round_id = round_id
            self.state = GameState.READY
            self.active_game_mode = "TAM_SAO"
            self.hint_visible = False
            self.steal_active = False
            self.show_rules = False
            self.timer_info = None

            await self.broadcast_state()
            return {"round_id": round_id, "keyword": keyword_row["keyword"]}
        finally:
            await db.close()

    async def start_preparing(self):
        """Start the 30-second preparation timer."""
        if self.state != GameState.READY:
            raise ValueError(f"Cannot start preparing in state {self.state}")

        self.state = GameState.PREPARING
        self.timer_info = TimerInfo(
            start_time=time.time(),
            duration=30,
            type="preparing"
        )

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET state = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?",
                (GameState.PREPARING.value, self.current_round_id)
            )
            await db.commit()
        finally:
            await db.close()

        await self.broadcast_state()

        # Auto-transition to PLAYING after 30 seconds
        if self._timer_task:
            self._timer_task.cancel()
        self._timer_task = asyncio.create_task(self._prep_timer_callback())

    async def _prep_timer_callback(self):
        """Auto-transition from PREPARING to PLAYING."""
        try:
            await asyncio.sleep(30)
            await self.start_playing()
        except asyncio.CancelledError:
            pass

    async def start_playing(self):
        """Start the contest timer (60 seconds)."""
        if self.state not in (GameState.PREPARING, GameState.READY):
            raise ValueError(f"Cannot start playing in state {self.state}")

        duration = 60

        self.state = GameState.PLAYING
        self.timer_info = TimerInfo(
            start_time=time.time(),
            duration=duration,
            type="playing"
        )

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET state = ? WHERE id = ?",
                (GameState.PLAYING.value, self.current_round_id)
            )
            await db.commit()
        finally:
            await db.close()

        await self.broadcast_state()
        await manager.broadcast_effect("round_start")

        # Auto-transition to ANSWER_CONFIRM after timer expires
        if self._timer_task:
            self._timer_task.cancel()
        self._timer_task = asyncio.create_task(self._play_timer_callback(duration))

    async def _play_timer_callback(self, duration: int):
        """Auto-transition from PLAYING to ANSWER_CONFIRM."""
        try:
            await asyncio.sleep(duration)
            await self.time_up()
        except asyncio.CancelledError:
            pass

    async def time_up(self):
        """Timer expired - move to answer confirmation."""
        if self.state != GameState.PLAYING:
            return

        self.state = GameState.ANSWER_CONFIRM
        self.timer_info = TimerInfo(
            start_time=time.time(),
            duration=10,
            type="guessing"
        )

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET state = ? WHERE id = ?",
                (GameState.ANSWER_CONFIRM.value, self.current_round_id)
            )
            await db.commit()
        finally:
            await db.close()

        await self.broadcast_state()
        await manager.broadcast_effect("time_up")

    async def confirm_answer(self, correct: bool) -> dict:
        """BTC confirms whether the main answer is correct."""
        if self.state != GameState.ANSWER_CONFIRM:
            raise ValueError(f"Cannot confirm answer in state {self.state}")

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET main_answer_correct = ? WHERE id = ?",
                (1 if correct else 0, self.current_round_id)
            )

            if correct:
                # +10 points for correct main answer
                await db.execute(
                    "UPDATE teams SET score = score + 10 WHERE id = ?",
                    (self.current_team_id,)
                )
                await db.execute(
                    "UPDATE rounds SET score_awarded = 10, score_to_team = ?, state = ? WHERE id = ?",
                    (self.current_team_id, GameState.FINISHED.value, self.current_round_id)
                )
                await db.commit()

                self.state = GameState.FINISHED
                self.timer_info = None
                await self.broadcast_state()
                await manager.broadcast_effect("correct", {"points": 10, "team_id": self.current_team_id})
                return {"correct": True, "points": 10}
            else:
                # Wrong answer - bypass HINT, go directly to STEAL
                self.state = GameState.STEAL
                self.steal_active = True
                self.hint_visible = True
                self.timer_info = None
                await db.execute(
                    "UPDATE rounds SET state = ? WHERE id = ?",
                    (GameState.STEAL.value, self.current_round_id)
                )
                await db.commit()

                await self.broadcast_state()
                await manager.broadcast_effect("wrong")
                return {"correct": False, "points": 0}
        finally:
            await db.close()

    async def teammate_answer(self, correct: bool) -> dict:
        """Teammate answers after hint is shown."""
        if self.state != GameState.HINT:
            raise ValueError(f"Cannot process teammate answer in state {self.state}")

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET hint_answer_correct = ? WHERE id = ?",
                (1 if correct else 0, self.current_round_id)
            )

            if correct:
                # +5 points for correct after hint
                await db.execute(
                    "UPDATE teams SET score = score + 5 WHERE id = ?",
                    (self.current_team_id,)
                )
                await db.execute(
                    "UPDATE rounds SET score_awarded = 5, score_to_team = ?, state = ? WHERE id = ?",
                    (self.current_team_id, GameState.FINISHED.value, self.current_round_id)
                )
                await db.commit()

                self.state = GameState.FINISHED
                await self.broadcast_state()
                await manager.broadcast_effect("correct", {"points": 5, "team_id": self.current_team_id})
                return {"correct": True, "points": 5}
            else:
                # Wrong - move to steal phase
                self.state = GameState.STEAL
                self.steal_active = True
                await db.execute(
                    "UPDATE rounds SET state = ? WHERE id = ?",
                    (GameState.STEAL.value, self.current_round_id)
                )
                await db.commit()

                await self.broadcast_state()
                await manager.broadcast_effect("wrong")
                return {"correct": False, "points": 0}
        finally:
            await db.close()

    async def steal_answer(self, steal_team_id: str, correct: bool) -> dict:
        """Another team steals the point."""
        if self.state != GameState.STEAL:
            raise ValueError(f"Cannot process steal in state {self.state}")

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET steal_team_id = ?, steal_answer_correct = ? WHERE id = ?",
                (steal_team_id, 1 if correct else 0, self.current_round_id)
            )

            if correct:
                # +10 points for stealing
                await db.execute(
                    "UPDATE teams SET score = score + 10 WHERE id = ?",
                    (steal_team_id,)
                )
                await db.execute(
                    "UPDATE rounds SET score_awarded = 10, score_to_team = ?, state = ? WHERE id = ?",
                    (steal_team_id, GameState.FINISHED.value, self.current_round_id)
                )
                await db.commit()

                self.state = GameState.FINISHED
                self.steal_active = False
                self.timer_info = None
                await self.broadcast_state()
                await manager.broadcast_effect("correct", {"points": 10, "team_id": steal_team_id})
                return {"correct": True, "points": 10, "team_id": steal_team_id}
            else:
                # -5 points for incorrect steal
                await db.execute(
                    "UPDATE teams SET score = score - 5 WHERE id = ?",
                    (steal_team_id,)
                )
                await db.execute(
                    "UPDATE rounds SET score_awarded = -5, score_to_team = ?, state = ? WHERE id = ?",
                    (steal_team_id, GameState.FINISHED.value, self.current_round_id)
                )
                await db.commit()

                self.state = GameState.FINISHED
                self.steal_active = False
                self.timer_info = None
                await self.broadcast_state()
                await manager.broadcast_effect("wrong_deduct", {"points": 5, "team_id": steal_team_id})
                return {"correct": False, "points": -5, "team_id": steal_team_id}
        finally:
            await db.close()

    async def end_round(self):
        """End the current round and return to WAITING."""
        if self.state not in (GameState.FINISHED, GameState.STEAL, GameState.HINT, GameState.ANSWER_CONFIRM):
            raise ValueError(f"Cannot end round in state {self.state}")

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET state = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?",
                (GameState.FINISHED.value, self.current_round_id)
            )
            await db.commit()
        finally:
            await db.close()

        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_keyword_id = None
        self.current_round_id = None
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False
        self.round_number = 0

        await self.broadcast_state()

    async def skip_to_hint(self):
        """MC manually skips to steal state (bypassing HINT)."""
        if self.state != GameState.ANSWER_CONFIRM:
            raise ValueError(f"Cannot skip to hint in state {self.state}")

        self.state = GameState.STEAL
        self.steal_active = True
        self.hint_visible = True
        self.timer_info = None

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET main_answer_correct = 0, state = ? WHERE id = ?",
                (GameState.STEAL.value, self.current_round_id)
            )
            await db.commit()
        finally:
            await db.close()

        await self.broadcast_state()
        await manager.broadcast_effect("wrong")

    async def skip_to_steal(self):
        """MC manually skips to steal state (from HINT)."""
        if self.state != GameState.HINT:
            raise ValueError(f"Cannot skip to steal in state {self.state}")

        self.state = GameState.STEAL
        self.steal_active = True

        db = await get_db()
        try:
            await db.execute(
                "UPDATE rounds SET hint_answer_correct = 0, state = ? WHERE id = ?",
                (GameState.STEAL.value, self.current_round_id)
            )
            await db.commit()
        finally:
            await db.close()

        await self.broadcast_state()
        await manager.broadcast_effect("steal_phase")

    async def reset_session(self):
        """Reset all game data for the current session."""
        if not self.session_id:
            raise ValueError("No session active")

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None

        db = await get_db()
        try:
            await db.execute(
                "DELETE FROM rounds WHERE session_id = ?",
                (self.session_id,)
            )
            await db.execute(
                "UPDATE teams SET score = 0 WHERE session_id = ?",
                (self.session_id,)
            )
            await db.execute(
                "UPDATE keywords SET is_used = 0 WHERE session_id = ?",
                (self.session_id,)
            )
            await db.commit()
        finally:
            await db.close()

        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_keyword_id = None
        self.current_round_id = None
        self.round_number = 0
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False

        await self.broadcast_state()

    async def force_cancel(self):
        """Force cancel the current round and return to WAITING state."""
        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_keyword_id = None
        self.current_round_id = None
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False
        self.selected_team_id = None

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None

        await self.broadcast_state()

    async def clear_session(self):
        """Clear the current session completely."""
        self.session_id = None
        self.state = GameState.WAITING
        self.current_team_id = None
        self.current_keyword_id = None
        self.current_round_id = None
        self.round_number = 0
        self.timer_info = None
        self.hint_visible = False
        self.steal_active = False
        self.selected_team_id = None

        if self._timer_task:
            self._timer_task.cancel()
            self._timer_task = None

        await self.broadcast_state()


# Singleton instance
game = GameStateMachine()
