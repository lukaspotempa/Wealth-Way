"""
Multiplayer lobby WebSocket router.

Endpoints:
  POST /api/lobby/create?name={name}  → {lobbyCode, playerId}
  POST /api/lobby/join/{code}?name={name} → {playerId}
  WS   /api/lobby/ws/{code}/{player_id}   → WebSocket
"""
import asyncio
import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from ..lobby_manager import create_lobby, join_lobby, get_lobby, LobbyState
from ..services.market_data import load_market_data, compute_portfolio_returns

router = APIRouter(prefix="/api/lobby", tags=["lobby"])

TICK_DELAY = 1.5  # seconds between years in race
CONFIG_TIME = 120  # seconds to configure portfolio


@router.post("/create")
async def create_lobby_endpoint(name: str = Query(..., min_length=1, max_length=20)):
    code, player_id = create_lobby(name)
    return {"lobbyCode": code, "playerId": player_id}


@router.post("/join/{code}")
async def join_lobby_endpoint(code: str, name: str = Query(..., min_length=1, max_length=20)):
    result = join_lobby(code, name)
    if result is None:
        lobby = get_lobby(code)
        if lobby is None:
            raise HTTPException(404, "Lobby not found")
        elif lobby.state != LobbyState.WAITING:
            raise HTTPException(409, "Game already started")
        else:
            raise HTTPException(409, "Lobby is full (max 10 players)")
    player_id, lobby = result
    return {"playerId": player_id, "lobbyCode": lobby.code}


async def _broadcast(lobby, message: dict):
    """Send message to all connected players."""
    dead = []
    for pid, player in lobby.players.items():
        if player.ws is not None:
            try:
                await player.ws.send_json(message)
            except Exception:
                dead.append(pid)
    for pid in dead:
        if pid in lobby.players:
            lobby.players[pid].ws = None


async def _run_race(lobby):
    """Run the simulation and stream year ticks to all players."""
    try:
        await _run_race_inner(lobby)
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        import traceback
        traceback.print_exc()
        await _broadcast(lobby, {'type': 'ERROR', 'message': f'Race error: {exc}'})
        lobby.state = LobbyState.WAITING


async def _run_race_inner(lobby):
    lobby.state = LobbyState.RACING

    # Determine years based on duration
    end_year = 2024
    start_year = end_year - lobby.duration + 1

    await _broadcast(lobby, {
        'type': 'RACE_STARTED',
        'startYear': start_year,
        'endYear': end_year,
    })

    # Give clients time to unmount lobby UI and mount race UI
    await asyncio.sleep(2)

    # Pre-compute each player's year-by-year portfolio values
    player_results = {}
    for pid, player in lobby.players.items():
        if player.portfolio:
            player_results[pid] = compute_portfolio_returns(
                player.portfolio, start_year, end_year
            )
        else:
            # Default empty portfolio → all cash (no growth)
            player_results[pid] = [
                {'year': y, 'portfolio_value': 10000.0, 'portfolio_return': 0,
                 'sp500_value': 10000.0, 'msci_value': 10000.0, 'inflation_value': 10000.0}
                for y in range(start_year, end_year + 1)
            ]

    # Stream ticks
    num_years = end_year - start_year + 1
    for i in range(num_years):
        portfolios = {}
        sp500_val = 10000.0
        msci_val = 10000.0
        inflation_val = 10000.0
        year = start_year + i

        for pid, yearly in player_results.items():
            if i < len(yearly):
                snap = yearly[i]
                portfolios[pid] = snap['portfolio_value']
                sp500_val = snap['sp500_value']
                msci_val = snap['msci_value']
                inflation_val = snap['inflation_value']

        await _broadcast(lobby, {
            'type': 'YEAR_TICK',
            'year': year,
            'portfolios': portfolios,
            'sp500': sp500_val,
            'msci': msci_val,
            'inflation': inflation_val,
        })

        await asyncio.sleep(TICK_DELAY)

    # Build leaderboard
    leaderboard = []
    for pid, player in lobby.players.items():
        if pid in player_results and player_results[pid]:
            final = player_results[pid][-1]
            final_val = final['portfolio_value']
            pct_return = (final_val - 10000) / 10000 * 100
            leaderboard.append({
                'playerId': pid,
                'playerName': player.name,
                'finalValue': final_val,
                'totalReturn': round(pct_return, 2),
                'beatInflation': final_val > final['inflation_value'],
                'beatSP500': final_val > final['sp500_value'],
            })
    leaderboard.sort(key=lambda x: x['finalValue'], reverse=True)
    for i, entry in enumerate(leaderboard):
        entry['rank'] = i + 1

    lobby.state = LobbyState.FINISHED
    await _broadcast(lobby, {
        'type': 'RACE_FINISHED',
        'leaderboard': leaderboard,
        'sp500Final': player_results[list(player_results.keys())[0]][-1]['sp500_value'] if player_results else 10000,
        'msciFinal': player_results[list(player_results.keys())[0]][-1]['msci_value'] if player_results else 10000,
        'inflationFinal': player_results[list(player_results.keys())[0]][-1]['inflation_value'] if player_results else 10000,
    })


@router.websocket("/ws/{code}/{player_id}")
async def lobby_websocket(websocket: WebSocket, code: str, player_id: str):
    await websocket.accept()

    lobby = get_lobby(code)
    if not lobby or player_id not in lobby.players:
        await websocket.send_json({'type': 'ERROR', 'message': 'Invalid lobby or player ID'})
        await websocket.close()
        return

    player = lobby.players[player_id]
    player.ws = websocket

    # Send current lobby state
    await websocket.send_json({'type': 'LOBBY_STATE', **lobby.to_dict()})

    # Notify others
    await _broadcast(lobby, {'type': 'PLAYER_JOINED', 'player': {
        'id': player.id, 'name': player.name, 'isHost': player.is_host, 'hasPortfolio': False
    }})

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get('type')

            if msg_type == 'START_GAME':
                if player_id != lobby.host_id:
                    await websocket.send_json({'type': 'ERROR', 'message': 'Only host can start'})
                    continue
                if lobby.state != LobbyState.WAITING:
                    continue
                lobby.duration = int(msg.get('duration', 10))
                lobby.state = LobbyState.CONFIGURING
                deadline = time.time() + CONFIG_TIME
                lobby.config_deadline = deadline
                await _broadcast(lobby, {
                    'type': 'GAME_STARTING',
                    'configDeadline': deadline,
                    'duration': lobby.duration,
                    **lobby.to_dict(),
                })
                # Schedule race to start after config time
                async def start_race_after_delay():
                    await asyncio.sleep(CONFIG_TIME)
                    if lobby.state == LobbyState.CONFIGURING:
                        await _run_race(lobby)
                lobby.race_task = asyncio.create_task(start_race_after_delay())

            elif msg_type == 'SUBMIT_PORTFOLIO':
                if lobby.state != LobbyState.CONFIGURING:
                    await websocket.send_json({'type': 'ERROR', 'message': 'Not in config phase'})
                    continue
                allocations = msg.get('allocations', {})
                player.portfolio = {k: float(v) for k, v in allocations.items() if float(v) > 0}
                player.duration = int(msg.get('duration', lobby.duration))
                await _broadcast(lobby, {
                    'type': 'PORTFOLIO_RECEIVED',
                    'playerId': player_id,
                    'playerName': player.name,
                })
                # Check if all players submitted
                all_submitted = all(p.portfolio is not None for p in lobby.players.values())
                if all_submitted and lobby.state == LobbyState.CONFIGURING:
                    if lobby.race_task:
                        lobby.race_task.cancel()
                    lobby.race_task = asyncio.create_task(_run_race(lobby))

            elif msg_type == 'PLAY_AGAIN':
                if player_id != lobby.host_id:
                    continue
                if lobby.state == LobbyState.FINISHED:
                    # Reset game
                    lobby.state = LobbyState.WAITING
                    lobby.config_deadline = None
                    for p in lobby.players.values():
                        p.portfolio = None
                    await _broadcast(lobby, {'type': 'LOBBY_STATE', **lobby.to_dict()})

    except WebSocketDisconnect:
        player.ws = None
        await _broadcast(lobby, {'type': 'PLAYER_LEFT', 'playerId': player_id, 'playerName': player.name})
