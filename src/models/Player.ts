export interface Player {
    id: string;
    socketId: string;
    name: string;
    symbol: 'X' | 'O';
    isBot: boolean;
}