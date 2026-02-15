export interface ScoreEntry {
    name: string;
    score: number;
    highestScore?: number;
    latestScore?: number;
}

export type GameState = "menu" | "playing" | "gameOver";
export type MenuView = "main" | "leaderboard";
export type LeaderboardTab = "highest" | "recent";
export type ControlType = "buttons" | "joystick";

export interface GameMissionData {
    snake: number[][];
    food: [number, number];
    score: number;
    length: number;
    playerName: string;
    direction: number[];
}
