import { BotDifficulty } from './BotDifficulty';
import { GameMode } from './GameMode';
import { GameStatus } from './GameStatus';
import { Player } from './Player';

export interface GameState {
    id: string;

    board: ('X' | 'O' | '-')[];

    currentPlayer: 'X' | 'O';

    lastMove?: {
        player: 'X' | 'O';
        position: number;
    };

    players: Player[];

    mode: GameMode;

    botDifficulty?: BotDifficulty;

    status: GameStatus;

    winner?: 'X' | 'O';

    winnerCells?: number[];

    createdAt: string;
    updatedAt: string;
}