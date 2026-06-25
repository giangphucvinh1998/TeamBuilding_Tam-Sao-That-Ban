"""WebSocket connection manager for realtime sync between admin and display."""

import json
import asyncio
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections for admin and display clients."""

    def __init__(self):
        self.admin_connections: Set[WebSocket] = set()
        self.display_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, client_type: str):
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            if client_type == "admin":
                self.admin_connections.add(websocket)
            else:
                self.display_connections.add(websocket)

    async def disconnect(self, websocket: WebSocket, client_type: str):
        """Remove a WebSocket connection."""
        async with self._lock:
            if client_type == "admin":
                self.admin_connections.discard(websocket)
            else:
                self.display_connections.discard(websocket)

    async def broadcast_to_admin(self, message: dict):
        """Send message to all admin connections (includes sensitive data)."""
        data = json.dumps(message, ensure_ascii=False)
        disconnected = set()
        for connection in self.admin_connections.copy():
            try:
                await connection.send_text(data)
            except Exception:
                disconnected.add(connection)
        async with self._lock:
            self.admin_connections -= disconnected

    async def broadcast_to_display(self, message: dict):
        """Send message to all display connections (filtered - no keyword/answer)."""
        data = json.dumps(message, ensure_ascii=False)
        disconnected = set()
        for connection in self.display_connections.copy():
            try:
                await connection.send_text(data)
            except Exception:
                disconnected.add(connection)
        async with self._lock:
            self.display_connections -= disconnected

    async def broadcast_state(self, state_data: dict):
        """Broadcast game state to both admin and display with appropriate filtering."""
        # Admin gets full state
        await self.broadcast_to_admin({
            "type": "state_update",
            "data": state_data
        })

        # Display gets filtered state (no keyword, answer; hint only when visible)
        display_data = {**state_data}
        if display_data.get("state") != "FINISHED":
            display_data.pop("current_keyword", None)
            display_data.pop("current_answer", None)
            if not display_data.get("hint_visible", False):
                display_data.pop("current_hint", None)

        await self.broadcast_to_display({
            "type": "state_update",
            "data": display_data
        })

    async def broadcast_effect(self, effect_type: str, effect_data: dict = None):
        """Broadcast visual/sound effect to display."""
        message = {
            "type": "effect",
            "data": {
                "effect": effect_type,
                **(effect_data or {})
            }
        }
        await self.broadcast_to_display(message)
        await self.broadcast_to_admin(message)


# Singleton instance
manager = ConnectionManager()
