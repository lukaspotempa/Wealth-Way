export type LobbyState = 'WAITING' | 'CONFIGURING' | 'RACING' | 'FINISHED'

export interface LobbyPlayer {
  id: string
  name: string
  isHost: boolean
  hasPortfolio: boolean
}

export interface LobbyInfo {
  code: string
  hostId: string
  state: LobbyState
  players: LobbyPlayer[]
  configDeadline: number | null
  duration: number
}

export interface YearTick {
  year: number
  portfolios: Record<string, number>  // playerId → value
  sp500: number
  msci: number
  inflation: number
}

export interface LeaderboardEntry {
  rank: number
  playerId: string
  playerName: string
  finalValue: number
  totalReturn: number
  beatInflation: boolean
  beatSP500: boolean
}

export type ServerMessage =
  | { type: 'LOBBY_STATE' } & LobbyInfo
  | { type: 'PLAYER_JOINED'; player: LobbyPlayer }
  | { type: 'PLAYER_LEFT'; playerId: string; playerName: string }
  | { type: 'GAME_STARTING'; configDeadline: number; duration: number } & LobbyInfo
  | { type: 'PORTFOLIO_RECEIVED'; playerId: string; playerName: string }
  | { type: 'RACE_STARTED'; startYear: number; endYear: number }
  | { type: 'YEAR_TICK' } & YearTick
  | { type: 'RACE_FINISHED'; leaderboard: LeaderboardEntry[]; sp500Final: number; msciFinal: number; inflationFinal: number }
  | { type: 'ERROR'; message: string }
