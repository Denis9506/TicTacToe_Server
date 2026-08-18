import express from 'express';
import cors from 'cors';

import { createServer }
    from 'http';

import { Server }
    from 'socket.io';

import { GameService }
    from './services/GameService.js';

const app = express();
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));
const httpServer =
    createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:4200',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const gameService =
    new GameService();

io.on(
    'connection',
    socket => {

        console.log(
            'Connected:',
            socket.id
        );

        socket.on(
            'createGame',
            playerName => {

                const result =
                    gameService
                        .createGame(
                            playerName
                        );

                socket.join(
                    result.gameId
                );

                socket.emit(
                    'gameCreated',
                    result
                );
            }
        );

        socket.on(
            'joinGame',
            data => {

                try {

                    const result =
                        gameService.joinGame(
                            data.gameId,
                            data.playerName
                        );

                    socket.emit(
                        'joinedGame',
                        result
                    );

                    io.to(
                        data.gameId
                    ).emit(
                        'gameUpdated',
                        result
                    );

                } catch (e) {

                    socket.emit(
                        'errorMessage',
                        e
                    );
                }
            }
        );

        socket.on(
            'makeMove',
            data => {

                gameService
                    .makeMove(
                        data.gameId,
                        data.player,
                        data.position
                    );

                const game =
                    gameService
                        .getGame(
                            data.gameId
                        );

                io.to(
                    data.gameId
                ).emit(
                    'gameUpdated',
                    game
                );
            }
        );

        socket.on(
            'disconnect',
            () => {

                console.log(
                    'Disconnected:',
                    socket.id
                );
            }
        );
    }
);

io.on('connection', socket => {
    console.log('SOCKET CONNECTED', socket.id);
});

io.engine.on('connection_error', err => {
    console.log('ENGINE ERROR');
    console.log(err);
});


app.get(
    '/',
    (_, res) => {

        res.send(
            'TicTacToe Server'
        );
    }
);

httpServer.listen(
    3000,
    () => {

        console.log(
            'Server started on 3000'
        );
    }
);