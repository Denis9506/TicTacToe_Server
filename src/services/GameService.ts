import { v4 as uuid } from 'uuid';
import { GameMode } from '../models/GameMode.js';
import { GameState } from '../models/GameState.js';
import { GameStatus } from '../models/GameStatus.js';
import { Player } from '../models/Player.js';

export class GameService {
    private games = new Map<string, GameState>();

    private readonly winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],

        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],

        [0, 4, 8],
        [2, 4, 6]
    ];

    createGame(
        socketId: string,
        playerName?: string
    ) {
        const gameId = uuid();

        const creatorSymbol: 'X' | 'O' =
            Math.random() < 0.5
                ? 'X'
                : 'O';

        const creator: Player = {
            id: uuid(),
            socketId,
            name: this.normalizePlayerName(playerName, 1),
            symbol: creatorSymbol,
            isBot: false
        };

        const game: GameState = {
            id: gameId,
            board: Array(9).fill('-'),

            currentPlayer: 'X',

            players: [creator],

            mode: GameMode.ONLINE,

            status: GameStatus.WAITING,

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.games.set(gameId, game);

        console.log('\n=================================');
        console.log('GAME CREATED');
        console.log('=================================');
        console.log('Game ID:', gameId);
        console.log('Host:', creator.name);
        console.log('Host Socket:', socketId);
        console.log('Host Symbol:', creator.symbol);
        console.log('Invite Link:', `http://localhost:4200/online/${gameId}`);
        console.log('Games Count:', this.games.size);

        this.printGameState(game);

        return {
            gameId,
            inviteLink: `http://localhost:4200/online/${gameId}`,
            game,
            player: creator
        };
    }

    joinGame(
        gameId: string,
        socketId: string,
        playerName?: string
    ) {
        const game = this.games.get(gameId);

        if (!game)
            throw new Error('Game not found');

        if (game.players.length >= 2)
            throw new Error('Game is full');

        const host = game.players[0];

        const secondPlayer: Player = {
            id: uuid(),
            socketId,
            name: this.normalizePlayerName(playerName, 2),
            symbol: host.symbol === 'X'
                ? 'O'
                : 'X',
            isBot: false
        };

        game.players.push(secondPlayer);
        console.log('\n=================================');
        console.log('PLAYER JOINED');
        console.log('=================================');
        console.log('Game ID:', gameId);
        console.log('Player:', secondPlayer.name);
        console.log('Socket:', secondPlayer.socketId);
        console.log('Symbol:', secondPlayer.symbol);
        game.status = GameStatus.PLAYING;

        console.log('\nGAME STARTED');

        console.log(
            game.players.map(
                p => `${p.name} (${p.symbol})`
            )
        );

        console.log(
            'FIRST TURN:',
            game.currentPlayer
        );

        this.printGameState(game);

        game.updatedAt =
            new Date().toISOString();

        return {
            game,
            player: secondPlayer
        };
    }

    getGame(gameId: string) {
        return this.games.get(gameId);
    }

    makeMove(
        gameId: string,
        socketId: string,
        position: number
    ) {
        const game = this.games.get(gameId);

        console.log('\n=================================');
        console.log('MOVE REQUEST');
        console.log('=================================');
        console.log('Game ID:', gameId);
        console.log('Socket:', socketId);
        console.log('Position:', position);

        if (!game)
            throw new Error('Game not found');

        if (game.status !== GameStatus.PLAYING)
            throw new Error('Game not active');

        const player = game.players.find(
            p => p.socketId === socketId
        );

        if (!player)
            throw new Error('Player not found');

        if (player.symbol !== game.currentPlayer)
            throw new Error('Not your turn');

        if (position < 0 || position > 8)
            throw new Error('Invalid position');

        if (game.board[position] !== '-')
            throw new Error('Cell occupied');

        game.board[position] = player.symbol;
        console.log(
            `${player.name} placed "${player.symbol}" into cell ${position}`
        );
        game.lastMove = {
            player: player.symbol,
            position
        };

        this.checkWinner(game);

        if (game.status === GameStatus.PLAYING) {
            game.currentPlayer =
                game.currentPlayer === 'X'
                    ? 'O'
                    : 'X';
        }
        console.log(
            'NEXT TURN:',
            game.currentPlayer
        );
        game.updatedAt =
            new Date().toISOString();

        this.printGameState(game);
        return game;
    }

    removePlayer(socketId: string) {
        for (const [gameId, game] of this.games.entries()) {

            const player =
                game.players.find(
                    p => p.socketId === socketId
                );

            if (player) {
                console.log(
                    `Player: ${player.name} (${player.symbol})`
                );

                console.log(
                    `Current Turn: ${game.currentPlayer}`
                );
            }

            if (!player)
                continue;

            console.log('\n=================================');
            console.log('PLAYER DISCONNECTED');
            console.log('=================================');
            console.log('Game ID:', gameId);
            console.log('Name:', player.name);
            console.log('Socket:', player.socketId);

            game.status = GameStatus.WAITING;

            game.players =
                game.players.filter(
                    p => p.socketId !== socketId
                );
            console.log(
                'Players Left:',
                game.players.length
            );

            this.printGameState(game);

            if (game.players.length === 0) {
                this.games.delete(gameId);
                console.log(
                    `GAME ${gameId} REMOVED (EMPTY ROOM)`
                );
            }

            return gameId;
        }

        return null;
    }

    private normalizePlayerName(
        name?: string,
        number?: number
    ) {
        const trimmed =
            name?.trim();

        if (!trimmed)
            return `Player ${number}`;

        return trimmed;
    }

    private checkWinner(game: GameState) {

        for (const combination of this.winningCombinations) {

            const [a, b, c] = combination;

            if (
                game.board[a] !== '-' &&
                game.board[a] === game.board[b] &&
                game.board[b] === game.board[c]
            ) {
                game.status = GameStatus.WIN;

                game.winner =
                    game.board[a] as 'X' | 'O';

                game.winnerCells =
                    combination;

                console.log('\n=================================');
                console.log('WINNER FOUND');
                console.log('=================================');
                console.log('Winner:', game.winner);
                console.log('Winning Cells:', combination);

                this.printGameState(game);
                return;
            }
        }

        if (!game.board.includes('-')) {
            game.status = GameStatus.DRAW;
            console.log('\n=================================');
            console.log('DRAW');
            console.log('=================================');

            this.printGameState(game);
        }
    }
    private printGameState(game: GameState): void {
        console.log('\n==============================');
        console.log('GAME STATE');
        console.log('==============================');

        console.log('ID:', game.id);
        console.log('Status:', game.status);
        console.log('Current Player:', game.currentPlayer);

        console.log('\nPlayers:');

        game.players.forEach(player => {
            console.log(
                `- ${player.name} | Symbol: ${player.symbol} | Socket: ${player.socketId}`
            );
        });

        console.log('\nBoard:');

        console.log(game.board.slice(0, 3).join(' '));
        console.log(game.board.slice(3, 6).join(' '));
        console.log(game.board.slice(6, 9).join(' '));

        console.log('==============================\n');
    }
}