
export enum GamePhase {
  LOBBY = 'LOBBY',
  BETTING = 'BETTING',
  TRADING = 'TRADING',
  RESULT = 'RESULT'
}

export enum Side {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export interface PricePoint {
  time: string;
  price: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 1-5 stars
  data: PricePoint[];
  eventText: string;
}

export interface PlayerState {
  id: string;
  name: string;
  leverage: number;
  side: Side;
  entryPrice: number;
  currentPnl: number; // Percentage
  isDead: boolean;
  isExited: boolean;
  exitPrice?: number;
  exitPnl?: number;
  highPnl: number;
}
