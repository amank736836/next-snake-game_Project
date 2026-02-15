import { GameMissionData } from "./types";

export const GRID_SIZE = 20;
export const INITIAL_SNAKE_BODY: number[][] = [[5, 5]];

export const obfuscate = (data: any) =>
    btoa(JSON.stringify(data).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 256))).join(''));

export const deobfuscate = (str: string): GameMissionData | null => {
    try {
        return JSON.parse(atob(str).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 256))).join(''));
    } catch (e) {
        return null;
    }
};

export const generateFood = (currentBody: number[][]): [number, number] => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (currentBody.some(([xc, yc]) => xc === x && yc === y)) {
        return generateFood(currentBody);
    } else {
        return [x, y];
    }
};

export const getSnakePartRotation = (direction: number[]) => {
    const [dirX, dirY] = direction;
    if (dirX === 1) return "head-right";
    if (dirX === -1) return "head-left";
    if (dirY === 1) return "head-down";
    if (dirY === -1) return "head-up";
    return "head-right";
};
