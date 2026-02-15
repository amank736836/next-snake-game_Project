import styles from "./SnakeBoard.module.css";
import { GRID_SIZE, getSnakePartRotation } from "../utils";

interface SnakeBoardProps {
    snake: number[][];
    food: [number, number];
    direction: number[];
    boardSizeVar: string;
}

export default function SnakeBoard({ snake, food, direction, boardSizeVar }: SnakeBoardProps) {
    const GRIDGAME = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(""));

    return (
        <div
            className={styles.board}
            style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                height: boardSizeVar,
                width: boardSizeVar,
            }}
        >
            {GRIDGAME.map((row, yc) =>
                row.map((cell, xc) => {
                    const snakeIndex = snake.findIndex(([sx, sy]) => sx === xc && sy === yc);
                    const isFood = food[0] === xc && food[1] === yc;

                    let partClass = "";
                    let rotationClass = "";

                    if (snakeIndex !== -1) {
                        partClass = styles.snake;
                        if (snakeIndex === 0) {
                            partClass += ` ${styles.snakeHead}`;
                            const rot = getSnakePartRotation(direction);
                            // Mapping rotation string to style object keys
                            const rotKey = rot.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                            rotationClass = styles[rotKey] || "";
                            partClass += ` ${rotationClass}`;
                        } else if (snakeIndex === snake.length - 1) {
                            partClass += ` ${styles.snakeTail}`;
                        } else {
                            partClass += ` ${styles.snakeBody}`;
                        }
                    }

                    // Nearby logic for tongue animation
                    const head = snake[0];
                    const dx = Math.abs(head[0] - food[0]);
                    const dy = Math.abs(head[1] - food[1]);
                    const wdx = dx > GRID_SIZE / 2 ? GRID_SIZE - dx : dx;
                    const wdy = dy > GRID_SIZE / 2 ? GRID_SIZE - dy : dy;
                    const isNearby = (wdx + wdy) <= 6;

                    return (
                        <div
                            key={`${xc}-${yc}`}
                            className={`${styles.cell} ${partClass}`}
                        >
                            {isFood && <div className={styles.food}></div>}

                            {snakeIndex === 0 && isNearby && (
                                <>
                                    <div className={styles.pupil} style={{ left: "25%" }}></div>
                                    <div className={styles.pupil} style={{ right: "25%" }}></div>
                                    <div
                                        className={styles.tongue}
                                        style={{
                                            transform: `translate(-50%, -50%) rotate(${Math.atan2((food[1] + 0.5) - (yc + 0.5), (food[0] + 0.5) - (xc + 0.5)) * (180 / Math.PI) + 90}deg)`
                                        }}
                                    ></div>
                                </>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
