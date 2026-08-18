export interface GameResult {

  gameId: string;

  winner: 'X' | 'O' | 'DRAW';

  mode: string;

  date: string;

  turns: number;
}