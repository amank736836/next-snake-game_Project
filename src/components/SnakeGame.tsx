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

    const [snake, setSnake] = useState([...INITIAL_SNAKE_BODY]);
    const [playerName, setPlayerName] = useState("");
    const [AllScores, setAllScores] = useState<ScoreEntry[]>([]);
    const [latestScores, setLatestScores] = useState<ScoreEntry[]>([]);
    const [alert, setAlert] = useState(false);
    const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu");
    const [score, setScore] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [controlType, setControlType] = useState<"buttons" | "joystick">("buttons");
    const [hasSavedGame, setHasSavedGame] = useState(false);

    // Secure State Obfuscation Utilities
    const obfuscate = (data: any) => btoa(JSON.stringify(data).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 256))).join(''));
    const deobfuscate = (str: string) => {
        try {
            return JSON.parse(atob(str).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 256))).join(''));
        } catch (e) { return null; }
    };

    useEffect(() => {
        const saved = localStorage.getItem("snake_mission_save");
        if (saved) setHasSavedGame(true);
    }, []);

    const [menuView, setMenuView] = useState<"main" | "leaderboard">("main");
    const [leaderboardTab, setLeaderboardTab] = useState<"highest" | "recent">("highest");

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
    const inputRef = useRef<HTMLInputElement>(null);
    const joystickRefLeft = useRef<HTMLDivElement>(null);
    const joystickRefRight = useRef<HTMLDivElement>(null);

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
        if (score === 0) return; // Don't show zero score runs in the UI
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

    const handleGameOver = useCallback(() => {
        highestScoreSend({ name: playerName, score: scoreRef.current });
        updateLocalScores({ name: playerName, score: scoreRef.current });
        scoreRef.current = 0;
        setScore(0);
        setGameState("gameOver");
        directionRef.current = [1, 0];
        setSnake([...INITIAL_SNAKE_BODY]);
        localStorage.removeItem("snake_mission_save");
        setHasSavedGame(false);
    }, [playerName, updateLocalScores]);

    const handlePause = () => {
        setGameState("menu");
        const missionData = {
            snake,
            food: foodRef.current,
            score,
            length: snake.length,
            playerName: playerName,
            direction: directionRef.current
        };
        localStorage.setItem("snake_mission_save", obfuscate(missionData));
        setHasSavedGame(true);
    };

    const handleResume = () => {
        const saved = localStorage.getItem("snake_mission_save");
        if (saved) {
            const data = deobfuscate(saved);
            if (data) {
                setSnake(data.snake);
                setScore(data.score);
                foodRef.current = data.food;
                setPlayerName(data.playerName);
                directionRef.current = data.direction;
                setGameState("playing");
                localStorage.removeItem("snake_mission_save");
                setHasSavedGame(false);
            }
        }
    };

    const startGame = () => {
        if (playerName.trim() === "") {
            setAlert(true);
            return;
        }
        setAlert(false);
        setGameState("playing");
        setSnake([...INITIAL_SNAKE_BODY]);
        scoreRef.current = 0;
        setScore(0);
        foodRef.current = generateFood(INITIAL_SNAKE_BODY);
        directionRef.current = [1, 0];
    };

    useEffect(() => {
        if (gameState !== "playing") return;
        const head = snake[0];
        if (head[0] === foodRef.current[0] && head[1] === foodRef.current[1]) {
            foodRef.current = generateFood(snake);
            scoreRef.current += 1;
            setScore(scoreRef.current);
        }
    }, [snake, gameState, generateFood]);

    useEffect(() => {
        if (gameState !== "playing") return;

        const moveSnake = () => {
            setSnake((prev) => {
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
                    setTimeout(handleGameOver, 0);
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

        const speed = Math.max(95 - score, 55);
        const intervalId = setInterval(moveSnake, speed);
        return () => clearInterval(intervalId);
    }, [gameState, score, handleGameOver]);

    const handleDirection = useCallback((e: any) => {
        const key = e.key || e;
        if ((document.activeElement as HTMLElement)?.tagName === "INPUT") return;

        // Prevent page scroll for arrow keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key) && e.preventDefault) {
            e.preventDefault();
        }

        if (gameState !== "playing" && playerName.trim() !== "" && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
            startGame(); // Start game if not playing and a direction key is pressed
        }

        const currentDir = directionRef.current;
        if (key === "ArrowUp" && currentDir[1] === 0) directionRef.current = [0, -1];
        else if (key === "ArrowDown" && currentDir[1] === 0) directionRef.current = [0, 1];
        else if (key === "ArrowLeft" && currentDir[0] === 0) directionRef.current = [-1, 0];
        else if (key === "ArrowRight" && currentDir[0] === 0) directionRef.current = [1, 0];
    }, [gameState, playerName, startGame]);

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

    const [stickPosLeft, setStickPosLeft] = useState({ x: 0, y: 0 });
    const [stickPosRight, setStickPosRight] = useState({ x: 0, y: 0 });

    const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => { };

    const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent, side: "left" | "right") => {
        const ref = side === "left" ? joystickRefLeft : joystickRefRight;
        const setStick = side === "left" ? setStickPosLeft : setStickPosRight;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = rect.width / 2;

        const limitedX = distance > maxRadius ? (dx / distance) * maxRadius : dx;
        const limitedY = distance > maxRadius ? (dy / distance) * maxRadius : dy;

        setStick({ x: limitedX, y: limitedY });

        // Trigger direction change with 20px threshold
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 20) handleDirection("ArrowRight");
            else if (dx < -20) handleDirection("ArrowLeft");
        } else {
            if (dy > 20) handleDirection("ArrowDown");
            else if (dy < -20) handleDirection("ArrowUp");
        }
    };

    const handleJoystickEnd = (side: "left" | "right") => {
        if (side === "left") setStickPosLeft({ x: 0, y: 0 });
        else setStickPosRight({ x: 0, y: 0 });
    };

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    };

    const getSnakePartClass = (xc: number, yc: number) => {
        const index = snake.findIndex(([x, y]) => x === xc && yc === y);
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
        if (index === snake.length - 1) return "snake snake-tail";
        return "snake snake-body";
    };

    if (!mounted) return null;

    return (
        <div className="container">
            <button className="theme-toggle" onClick={toggleTheme}>
                {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>

            {gameState !== "playing" ? (
                <div className="menu-screen">
                    <div className={`menu-content ${menuView}-view`}>
                        {menuView === "leaderboard" ? (
                            <div className="leaderboard-container">
                                <div className="tab-switcher">
                                    <button
                                        className={`tab-btn ${leaderboardTab === "highest" ? "active" : ""}`}
                                        onClick={() => setLeaderboardTab("highest")}
                                    >
                                        🏆 HIGHEST
                                    </button>
                                    <button
                                        className={`tab-btn ${leaderboardTab === "recent" ? "active" : ""}`}
                                        onClick={() => setLeaderboardTab("recent")}
                                    >
                                        🕒 RECENT
                                    </button>
                                </div>

                                <div className="leaderboard-grid">
                                    {/* Highest Scores Section */}
                                    <div className={`score-section high-scores-section ${(leaderboardTab !== "highest") ? "mobile-hide" : ""}`}>
                                        <h3>🏆 Highest Scores</h3>
                                        <div className="score-list">
                                            {AllScores.map((score, index) => (
                                                <div key={index} className="score-item">
                                                    <span className="rank">{(highScorePage - 1) * 4 + index + 1}</span>
                                                    <span className="name">{score.name}</span>
                                                    <span className="val">{score.highestScore || score.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="pagination">
                                                <button onClick={() => handlePageChange(highScorePage - 1)} disabled={highScorePage === 1}>◀</button>
                                                <span>{highScorePage} / {totalPages}</span>
                                                <button onClick={() => handlePageChange(highScorePage + 1)} disabled={highScorePage === totalPages}>▶</button>
                                            </div>
                                        )}
                                        <button className="nav-btn back-btn mobile-only" onClick={() => setMenuView("main")}>
                                            BACK TO MISSION ↩️
                                        </button>
                                    </div>

                                    {/* Recent Hunts Section */}
                                    <div className={`score-section recent-hunts-section ${(leaderboardTab !== "recent") ? "mobile-hide" : ""}`}>
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
                                        <button className="nav-btn back-btn mobile-only" onClick={() => setMenuView("main")}>
                                            BACK TO MISSION ↩️
                                        </button>
                                    </div>
                                </div>
                                <button className="nav-btn back-btn desktop-only" style={{ maxWidth: "300px", alignSelf: "center" }} onClick={() => setMenuView("main")}>
                                    BACK TO MISSION ↩️
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Left Side: Highest Scores (Desktop Only) */}
                                <div className="score-section high-scores-section desktop-only">
                                    <h3>🏆 Top Hunts</h3>
                                    <div className="score-list">
                                        {AllScores.map((score, index) => (
                                            <div key={index} className="score-item">
                                                <span className="rank">{(highScorePage - 1) * 4 + index + 1}</span>
                                                <span className="name">{score.name}</span>
                                                <span className="val">{score.highestScore || score.score}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="center-column">
                                    <div className="title">
                                        <div className="logo-emoji" style={{ fontSize: "clamp(3rem, 8vh, 5rem)" }}>🐍</div>
                                        <h1 className="gameName">Nagini</h1>
                                        <p className="subtitle">(from 🤺 Harry Potter 👓 )</p>
                                    </div>

                                    <div className="menu-box">
                                        <input
                                            type="text"
                                            placeholder="Enter your name ✍️"
                                            value={playerName}
                                            className="user-input"
                                            onChange={(e) => {
                                                setPlayerName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 20));
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && playerName.trim() !== "") startGame();
                                            }}
                                            ref={inputRef}
                                        />
                                        {alert && <p className="alert">Please enter your name 🙏</p>}
                                        <button
                                            className="start-button"
                                            onClick={startGame}
                                        >
                                            START MISSION ⚔️
                                        </button>
                                        {hasSavedGame && (
                                            <button className="resume-btn" onClick={handleResume}>
                                                RESUME MISSION 🚀
                                            </button>
                                        )}
                                        <div className="control-selector">
                                            <button
                                                className={`selector-btn ${controlType === "buttons" ? "active" : ""}`}
                                                onClick={() => setControlType("buttons")}
                                            >
                                                🕹️ BUTTONS
                                            </button>
                                            <button
                                                className={`selector-btn ${controlType === "joystick" ? "active" : ""}`}
                                                onClick={() => setControlType("joystick")}
                                            >
                                                🟢 JOYSTICK
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        className="nav-btn leaderboard-trigger mobile-only"
                                        onClick={() => setMenuView("leaderboard")}
                                    >
                                        🏆 VIEW HALL OF FAME
                                    </button>
                                </div>

                                {/* Right Side: Recent Hunts (Desktop Only) */}
                                <div className="score-section recent-hunts-section desktop-only">
                                    <h3>🕒 Recent</h3>
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
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="game-screen">
                    <div className="game-layout-container">
                        <div className="side-controls left-side desktop-landscape">
                            {controlType === "buttons" ? (
                                <>
                                    <button className="side-btn-rect" onClick={() => handleDirection("ArrowUp")}>⬆️</button>
                                    <button className="side-btn-rect" onClick={() => handleDirection("ArrowDown")}>⬇️</button>
                                </>
                            ) : (
                                <div className="joystick-wrapper">
                                    <div
                                        className="joystick-base"
                                        ref={joystickRefLeft}
                                        onTouchStart={handleJoystickStart}
                                        onTouchMove={(e) => handleJoystickMove(e, "left")}
                                        onTouchEnd={() => handleJoystickEnd("left")}
                                        onMouseDown={handleJoystickStart}
                                        onMouseMove={(e) => e.buttons === 1 && handleJoystickMove(e, "left")}
                                        onMouseUp={() => handleJoystickEnd("left")}
                                        onMouseLeave={() => handleJoystickEnd("left")}
                                    >
                                        <div
                                            className="joystick-handle"
                                            style={{
                                                transform: `translate(${stickPosLeft.x}px, ${stickPosLeft.y}px)`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="joystick-hint">JOYSTICK</span>
                                </div>
                            )}
                        </div>

                        <div className="game-middle-stack">
                            <div className="game-header">
                                <div className="current-user">👤 {playerName}</div>
                                <div className="live-score">🍎 {score}</div>
                                <button className="quit-button pause-button" onClick={handlePause}>PAUSE</button>
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

                                        const head = snake[0];
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
                                                        <div
                                                            className="snake-tongue"
                                                            style={{
                                                                transform: `translate(-50%, -50%) rotate(${Math.atan2((foodRef.current[1] + 0.5) - (yc + 0.5), (foodRef.current[0] + 0.5) - (xc + 0.5)) * (180 / Math.PI) + 90}deg)`
                                                            }}
                                                        ></div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="side-controls right-side desktop-landscape">
                            {controlType === "buttons" ? (
                                <>
                                    <button className="side-btn-rect" onClick={() => handleDirection("ArrowLeft")}>⬅️</button>
                                    <button className="side-btn-rect" onClick={() => handleDirection("ArrowRight")}>➡️</button>
                                </>
                            ) : (
                                <div className="joystick-wrapper">
                                    <div
                                        className="joystick-base"
                                        ref={joystickRefRight}
                                        onTouchStart={handleJoystickStart}
                                        onTouchMove={(e) => handleJoystickMove(e, "right")}
                                        onTouchEnd={() => handleJoystickEnd("right")}
                                        onMouseDown={handleJoystickStart}
                                        onMouseMove={(e) => e.buttons === 1 && handleJoystickMove(e, "right")}
                                        onMouseUp={() => handleJoystickEnd("right")}
                                        onMouseLeave={() => handleJoystickEnd("right")}
                                    >
                                        <div
                                            className="joystick-handle"
                                            style={{
                                                transform: `translate(${stickPosRight.x}px, ${stickPosRight.y}px)`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="joystick-hint">JOYSTICK</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="portrait-only">
                        {controlType === "buttons" ? (
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
                        ) : (
                            <div className="joystick-wrapper" style={{ marginTop: "2rem" }}>
                                <div
                                    className="joystick-base"
                                    ref={joystickRefLeft}
                                    onTouchStart={handleJoystickStart}
                                    onTouchMove={(e) => handleJoystickMove(e, "left")}
                                    onTouchEnd={() => handleJoystickEnd("left")}
                                    onMouseDown={handleJoystickStart}
                                    onMouseMove={(e) => e.buttons === 1 && handleJoystickMove(e, "left")}
                                    onMouseUp={() => handleJoystickEnd("left")}
                                    onMouseLeave={() => handleJoystickEnd("left")}
                                >
                                    <div
                                        className="joystick-handle"
                                        style={{
                                            transform: `translate(${stickPosLeft.x}px, ${stickPosLeft.y}px)`
                                        }}
                                    ></div>
                                </div>
                                <span className="joystick-hint">JOYSTICK</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
