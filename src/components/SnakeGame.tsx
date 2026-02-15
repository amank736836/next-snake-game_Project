"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ScoreEntry {
    name: string;
    score: number;
    highestScore?: number;
    latestScore?: number;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE_BODY = [[5, 5]];

export default function SnakeGame() {
    const GRIDGAME = Array.from({ length: GRID_SIZE }, () =>
        new Array(GRID_SIZE).fill("")
    );

    const [snakeBody, setSnakeBody] = useState([...INITIAL_SNAKE_BODY]);
    const [user, setUser] = useState("");
    const [AllScores, setAllScores] = useState<ScoreEntry[]>([]);
    const [latestScores, setLatestScores] = useState<ScoreEntry[]>([]);
    const [alert, setAlert] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [scoreVal, setScoreVal] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("dark");

    const directionRef = useRef([1, 0]);
    const scoreRef = useRef(0);

    const generateFood = useCallback((currentBody: number[][]): [number, number] => {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        if (currentBody.some(([xc, yc]) => xc === x && yc === y)) {
            return generateFood(currentBody);
        } else {
            return [x, y];
        }
    }, []);

    const foodRef = useRef<[number, number]>(generateFood(INITIAL_SNAKE_BODY));

    const highestScoreSend = async ({ name, score }: { name: string; score: number }) => {
        try {
            await fetch("/api/snakeGame/addScore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, score }),
            });
        } catch (error) {
            console.log(error);
        }
    };

    const updateLocalScores = useCallback(({ name, score }: { name: string; score: number }) => {
        setAllScores((prevScores) => {
            const newScores = [...prevScores];
            newScores.push({ name, score });
            newScores.sort((a, b) => (b.highestScore || b.score) - (a.highestScore || a.score));
            return newScores.slice(0, 5);
        });
        setLatestScores((prevScores) => {
            let found = false;
            const newScores = prevScores.map((s) => {
                if (s.name === name) {
                    found = true;
                    return { ...s, latestScore: score };
                }
                return s;
            });
            if (!found) {
                newScores.unshift({ name, score, latestScore: score });
            }
            return newScores.slice(0, 5);
        });
    }, []);

    const gameOver = useCallback(() => {
        highestScoreSend({ name: user, score: scoreRef.current });
        updateLocalScores({ name: user, score: scoreRef.current });
        scoreRef.current = 0;
        setScoreVal(0);
        setIsPlaying(false);
        directionRef.current = [1, 0];
        setSnakeBody([...INITIAL_SNAKE_BODY]);
    }, [user, updateLocalScores]);

    useEffect(() => {
        if (!isPlaying) return;
        const head = snakeBody[0];
        if (head[0] === foodRef.current[0] && head[1] === foodRef.current[1]) {
            foodRef.current = generateFood(snakeBody);
            scoreRef.current += 1;
            setScoreVal(scoreRef.current);
        }
    }, [snakeBody, isPlaying, generateFood]);

    useEffect(() => {
        if (!isPlaying) return;

        const moveSnake = () => {
            setSnakeBody((prev) => {
                const head = prev[0];
                const nextHead: [number, number] = [
                    head[0] + directionRef.current[0],
                    head[1] + directionRef.current[1],
                ];

                if (nextHead[0] < 0) nextHead[0] = GRID_SIZE - 1;
                if (nextHead[0] >= GRID_SIZE) nextHead[0] = 0;
                if (nextHead[1] < 0) nextHead[1] = GRID_SIZE - 1;
                if (nextHead[1] >= GRID_SIZE) nextHead[1] = 0;

                if (prev.some(([x, y]) => x === nextHead[0] && y === nextHead[1])) {
                    setTimeout(gameOver, 0);
                    return prev;
                }

                const isFood = nextHead[0] === foodRef.current[0] && nextHead[1] === foodRef.current[1];
                const newBody = [nextHead, ...prev];

                if (!isFood) {
                    newBody.pop();
                }

                return newBody;
            });
        };

        const speed = Math.max(95 - scoreVal, 55);
        const intervalId = setInterval(moveSnake, speed);
        return () => clearInterval(intervalId);
    }, [isPlaying, scoreVal, gameOver]);

    const handleDirection = useCallback((e: any) => {
        const key = e.key || e;
        if ((document.activeElement as HTMLElement)?.tagName === "INPUT") return;

        // Prevent page scroll for arrow keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key) && e.preventDefault) {
            e.preventDefault();
        }

        if (!isPlaying && user.trim() !== "" && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
            setIsPlaying(true);
        }

        const currentDir = directionRef.current;
        if (key === "ArrowUp" && currentDir[1] === 0) directionRef.current = [0, -1];
        else if (key === "ArrowDown" && currentDir[1] === 0) directionRef.current = [0, 1];
        else if (key === "ArrowLeft" && currentDir[0] === 0) directionRef.current = [-1, 0];
        else if (key === "ArrowRight" && currentDir[0] === 0) directionRef.current = [1, 0];
    }, [isPlaying, user]);

    const [highScorePage, setHighScorePage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchScores = useCallback(async (page: number = 1) => {
        try {
            const [hRes, lRes] = await Promise.all([
                fetch(`/api/snakeGame/highestScore?page=${page}&limit=5`),
                fetch("/api/snakeGame/latestScore")
            ]);
            const hData = await hRes.json();
            const lData = await lRes.json();

            setAllScores(hData.scores);
            setTotalPages(hData.pagination.totalPages);
            setHighScorePage(hData.pagination.page);
            setLatestScores(lData);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("theme") as "light" | "dark";
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
        }

        fetchScores(1);
        const handler = (e: KeyboardEvent) => handleDirection(e);
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleDirection, fetchScores]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchScores(newPage);
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    };

    const getSnakePartClass = (xc: number, yc: number) => {
        const index = snakeBody.findIndex(([x, y]) => x === xc && y === yc);
        if (index === -1) return "";
        if (index === 0) {
            const dirX = directionRef.current[0];
            const dirY = directionRef.current[1];
            let rotationClass = "head-right";
            if (dirX === 1) rotationClass = "head-right";
            else if (dirX === -1) rotationClass = "head-left";
            else if (dirY === 1) rotationClass = "head-down";
            else if (dirY === -1) rotationClass = "head-up";
            return `snake snake-head ${rotationClass}`;
        }
        if (index === snakeBody.length - 1) return "snake snake-tail";
        return "snake snake-body";
    };

    if (!mounted) return null;

    return (
        <div className="container">
            <button className="theme-toggle" onClick={toggleTheme}>
                {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>

            {!isPlaying ? (
                <div className="menu-screen">
                    <div className="title">
                        <div className="gameName">🐍Nagini🐍</div>
                        <div className="subtitle">(from 🤺Harry Potter👓)</div>
                    </div>

                    <div className="menu-box">
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Enter your name ✍️"
                                className="user-input"
                                value={user}
                                onChange={(e) => {
                                    setUser(e.target.value.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 20));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && user.trim() !== "") setIsPlaying(true);
                                }}
                            />
                            {alert && <p className="alert">Please enter your name 🙏</p>}
                        </div>

                        <button
                            className="start-button"
                            onClick={user === "" ? () => setAlert(true) : () => setIsPlaying(true)}
                        >
                            START MISSION ⚔️
                        </button>
                    </div>

                    <div className="scores-wrapper">
                        <div className="score-section">
                            <h3>🏆 Highest Scores</h3>
                            <div className="score-list">
                                {AllScores.map((score, index) => (
                                    <div key={index} className="score-item">
                                        <span className="rank">{(highScorePage - 1) * 5 + index + 1}</span>
                                        <span className="name">{score.name}</span>
                                        <span className="val">{score.highestScore || score.score}</span>
                                    </div>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        onClick={() => handlePageChange(highScorePage - 1)}
                                        disabled={highScorePage === 1}
                                    >◀</button>
                                    <span>{highScorePage} / {totalPages}</span>
                                    <button
                                        onClick={() => handlePageChange(highScorePage + 1)}
                                        disabled={highScorePage === totalPages}
                                    >▶</button>
                                </div>
                            )}
                        </div>
                        <div className="score-section">
                            <h3>🕒 Recent Hunts</h3>
                            <div className="score-list">
                                {latestScores.map((score, index) => (
                                    <div key={index} className="score-item">
                                        <span className="rank">{index + 1}</span>
                                        <span className="name">{score.name}</span>
                                        <span className="val">{score.latestScore || score.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="game-screen">
                    <div className="game-header">
                        <div className="current-user">👤 {user}</div>
                        <div className="live-score">🍎 {scoreVal}</div>
                        <button className="quit-button" onClick={() => setIsPlaying(false)}>QUIT</button>
                    </div>

                    <div
                        className="container-game"
                        style={{
                            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                            height: `var(--board-size)`,
                            width: `var(--board-size)`,
                        }}
                    >
                        {GRIDGAME.map((row, yc) =>
                            row.map((cell, xc) => {
                                const snakePartClass = getSnakePartClass(xc, yc);
                                const isFood = foodRef.current[0] === xc && foodRef.current[1] === yc;

                                // Check proximity for tongue (Wrapped Manhattan distance <= 6)
                                const head = snakeBody[0];
                                const dx = Math.abs(head[0] - foodRef.current[0]);
                                const dy = Math.abs(head[1] - foodRef.current[1]);
                                const wdx = dx > GRID_SIZE / 2 ? GRID_SIZE - dx : dx;
                                const wdy = dy > GRID_SIZE / 2 ? GRID_SIZE - dy : dy;
                                const isNearby = (wdx + wdy) <= 6;

                                return (
                                    <div
                                        key={`${xc}-${yc}`}
                                        className={`cell ${snakePartClass} ${isFood ? "food" : ""}`}
                                    >
                                        {snakePartClass.includes("snake-head") && isNearby && (
                                            <>
                                                <div className="snake-head-pupil" style={{ left: "25%" }}></div>
                                                <div className="snake-head-pupil" style={{ right: "25%" }}></div>
                                                <div className="snake-tongue"></div>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="buttons">
                        <div className="up">
                            <button onClick={() => handleDirection("ArrowUp")}>⬆️</button>
                        </div>
                        <div className="leftright">
                            <button onClick={() => handleDirection("ArrowLeft")}>⬅️</button>
                            <button className="center-btn">🐍</button>
                            <button onClick={() => handleDirection("ArrowRight")}>➡️</button>
                        </div>
                        <div className="down">
                            <button onClick={() => handleDirection("ArrowDown")}>⬇️</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
