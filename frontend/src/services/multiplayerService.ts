import type { ServerMessage } from '@/types/multiplayer'

const API_BASE = 'https://api.investmentgame.de'
const WS_BASE = 'ws://api.investmentgame.de'

export async function createLobby(name: string): Promise<{ lobbyCode: string; playerId: string }> {
  const res = await fetch(`${API_BASE}/api/lobby/create?name=${encodeURIComponent(name)}`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create lobby')
  return res.json()
}

export async function joinLobby(code: string, name: string): Promise<{ lobbyCode: string; playerId: string }> {
  const res = await fetch(`${API_BASE}/api/lobby/join/${code}?name=${encodeURIComponent(name)}`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || 'Failed to join lobby')
  }
  return res.json()
}

export class MultiplayerConnection {
  private ws: WebSocket | null = null
  private handlers: Map<string, ((msg: ServerMessage) => void)[]> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closed = false

  constructor(
    private lobbyCode: string,
    private playerId: string,
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${WS_BASE}/api/lobby/ws/${this.lobbyCode}/${this.playerId}`
      this.ws = new WebSocket(url)

      this.ws.onopen = () => resolve()
      this.ws.onerror = () => reject(new Error('WebSocket connection failed'))
      this.ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data)
          const handlers = this.handlers.get(msg.type) ?? []
          handlers.forEach((h) => h(msg))
          const allHandlers = this.handlers.get('*') ?? []
          allHandlers.forEach((h) => h(msg))
        } catch {
          // ignore parse errors
        }
      }
      this.ws.onclose = () => {
        if (!this.closed) {
          // emit disconnect event
          const handlers = this.handlers.get('DISCONNECTED') ?? []
          handlers.forEach((h) => h({ type: 'ERROR', message: 'Disconnected' } as ServerMessage))
        }
      }
    })
  }

  on(type: string, handler: (msg: ServerMessage) => void): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, [])
    this.handlers.get(type)!.push(handler)
    return () => {
      const arr = this.handlers.get(type) ?? []
      const idx = arr.indexOf(handler)
      if (idx >= 0) arr.splice(idx, 1)
    }
  }

  send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  startGame(duration: number): void {
    this.send({ type: 'START_GAME', duration })
  }

  submitPortfolio(allocations: Record<string, number>, duration: number): void {
    this.send({ type: 'SUBMIT_PORTFOLIO', allocations, duration })
  }

  playAgain(): void {
    this.send({ type: 'PLAY_AGAIN' })
  }

  disconnect(): void {
    this.closed = true
    this.ws?.close()
    this.ws = null
  }
}
