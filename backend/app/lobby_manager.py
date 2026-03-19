"""
In-memory lobby state management for multiplayer AutoBattle.
"""
import asyncio
import uuid
import random
import string
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Optional, Any, List


class LobbyState(str, Enum):
    WAITING = "WAITING"
    CONFIGURING = "CONFIGURING"
    RACING = "RACING"
    FINISHED = "FINISHED"


@dataclass
class Player:
    id: str
    name: str
    portfolio: Optional[Dict[str, float]] = None  # {asset_key: allocation_pct}
    duration: int = 10
    is_host: bool = False
    ws: Optional[Any] = None  # WebSocket connection


@dataclass
class Lobby:
    code: str
    host_id: str
    players: Dict[str, Player] = field(default_factory=dict)
    state: LobbyState = LobbyState.WAITING
    config_deadline: Optional[float] = None
    race_task: Optional[asyncio.Task] = None
    duration: int = 10  # years, set by host at start

    def to_dict(self) -> dict:
        return {
            'code': self.code,
            'hostId': self.host_id,
            'state': self.state.value,
            'configDeadline': self.config_deadline,
            'duration': self.duration,
            'players': [
                {
                    'id': p.id,
                    'name': p.name,
                    'isHost': p.is_host,
                    'hasPortfolio': p.portfolio is not None,
                }
                for p in self.players.values()
            ],
        }


# Global lobby registry
_lobbies: Dict[str, Lobby] = {}


def generate_code() -> str:
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=6))
        if code not in _lobbies:
            return code


def create_lobby(player_name: str) -> tuple[str, str]:
    """Returns (lobby_code, player_id)"""
    code = generate_code()
    player_id = str(uuid.uuid4())
    player = Player(id=player_id, name=player_name, is_host=True)
    lobby = Lobby(code=code, host_id=player_id)
    lobby.players[player_id] = player
    _lobbies[code] = lobby
    return code, player_id


def join_lobby(code: str, player_name: str) -> Optional[tuple[str, Lobby]]:
    """Returns (player_id, lobby) or None if full/not found."""
    lobby = _lobbies.get(code.upper())
    if not lobby:
        return None
    if lobby.state != LobbyState.WAITING:
        return None
    if len(lobby.players) >= 10:
        return None
    player_id = str(uuid.uuid4())
    player = Player(id=player_id, name=player_name, is_host=False)
    lobby.players[player_id] = player
    return player_id, lobby


def get_lobby(code: str) -> Optional[Lobby]:
    return _lobbies.get(code.upper())


def remove_lobby(code: str) -> None:
    _lobbies.pop(code, None)
