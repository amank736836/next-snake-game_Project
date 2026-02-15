import { useState, useRef, useEffect, useCallback } from "react";
import { ScoreEntry, GameState, ControlType, GameMissionData } from "../types";
import { generateFood, obfuscate, deobfuscate, INITIAL_SNAKE_BODY, GRID_SIZE } from "../utils";

export const useSnakeGame = () => {
    const [snake, setSnake] = useState([...INITIAL_SNAKE_BODY]);
    const [playerName, setPlayerName] = useState("");
    const [AllScores, setAllScores] = useState<ScoreEntry[]>([]);
    const [latestScores, setLatestScores] = useState<ScoreEntry[]>([]);
    const [alert, setAlert] = useState(false);
    const [gameState, setGameState] = useState<GameState>("menu");
    const [score, setScore] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [controlType, setControlType] = useState<ControlType>("buttons");
    const [hasSavedGame, setHasSavedGame] = useState(false);
    const [menuView, setMenuView] = useState<"main" | "leaderboard">("main");
    const [leaderboardTab, setLeaderboardTab] = useState<"highest" | "recent">("highest");
    const [highScorePage, setHighScorePage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stickPosLeft, setStickPosLeft] = useState({ x: 0, y: 0 });
    const [stickPosRight, setStickPosRight] = useState({ x: 0, y: 0 });

    const directionRef = useRef([1, 0]);
    const scoreRef = useRef(0);
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
            console.error(error);
        }
    };

    const updateLocalScores = useCallback(({ name, score }: { name: string; score: number }) => {
        if (score === 0) return;
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
        const missionData: GameMissionData = {
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

    const startGame = useCallback(() => {
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
    }, [playerName]);

    const handleDirection = useCallback((e: any) => {
        const key = e.key || e;
        if ((document.activeElement as HTMLElement)?.tagName === "INPUT") return;

        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key) && e.preventDefault) {
            e.preventDefault();
        }

        if (gameState !== "playing" && playerName.trim() !== "" && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
            startGame();
        }

        const currentDir = directionRef.current;
        if (key === "ArrowUp" && currentDir[1] === 0) directionRef.current = [0, -1];
        else if (key === "ArrowDown" && currentDir[1] === 0) directionRef.current = [0, 1];
        else if (key === "ArrowLeft" && currentDir[0] === 0) directionRef.current = [-1, 0];
        else if (key === "ArrowRight" && currentDir[0] === 0) directionRef.current = [1, 0];
    }, [gameState, playerName, startGame]);

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
        if (gameState !== "playing") return;
        const head = snake[0];
        if (head[0] === foodRef.current[0] && head[1] === foodRef.current[1]) {
            foodRef.current = generateFood(snake);
            scoreRef.current += 1;
            setScore(scoreRef.current);
        }
    }, [snake, gameState]);

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
                if (!isFood) newBody.pop();
                return newBody;
            });
        };

        const speed = Math.max(95 - score, 55);
        const intervalId = setInterval(moveSnake, speed);
        return () => clearInterval(intervalId);
    }, [gameState, score, handleGameOver]);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("theme") as "light" | "dark";
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
        }

        const saved = localStorage.getItem("snake_mission_save");
        if (saved) setHasSavedGame(true);

        fetchScores(1);
    }, [fetchScores]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => handleDirection(e);
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleDirection]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) fetchScores(newPage);
    };

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    };

    const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => { };

    const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent, side: "left" | "right") => {
        const ref = side === "left" ? joystickRefLeft : joystickRefRight;
        const setStick = side === "left" ? setStickPosLeft : setStickPosRight;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;

        const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = rect.width / 2;
        const limitedX = distance > maxRadius ? (dx / distance) * maxRadius : dx;
        const limitedY = distance > maxRadius ? (dy / distance) * maxRadius : dy;

        setStick({ x: limitedX, y: limitedY });

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

    return {
        snake, playerName, setPlayerName, AllScores, latestScores, alert, gameState, setGameState,
        score, mounted, theme, controlType, setControlType, hasSavedGame, menuView, setMenuView,
        leaderboardTab, setLeaderboardTab, highScorePage, totalPages, stickPosLeft, stickPosRight,
        directionRef, foodRef, inputRef, joystickRefLeft, joystickRefRight,
        handlePause, handleResume, startGame, handleDirection, handlePageChange, toggleTheme,
        handleJoystickStart, handleJoystickMove, handleJoystickEnd
    };
};
