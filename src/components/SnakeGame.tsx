"use client";

import { useSnakeGame } from "./game/hooks/useSnakeGame";
import { getSnakePartRotation } from "./game/utils";
import ThemeToggle from "./game/ThemeToggle/ThemeToggle";
import MissionHub from "./game/MissionHub/MissionHub";
import Leaderboard from "./game/Leaderboard/Leaderboard";
import GameHeader from "./game/GameHeader/GameHeader";
import SnakeBoard from "./game/SnakeBoard/SnakeBoard";
import Controls from "./game/Controls/Controls";

export default function SnakeGame() {
    const game = useSnakeGame();

    if (!game.mounted) return null;


    return (
        <div className="container">
            <ThemeToggle theme={game.theme} onToggle={game.toggleTheme} />

            {game.gameState !== "playing" ? (
                <div className="menu-screen">
                    <div className={`menu-content ${game.menuView}-view`}>
                        {game.menuView === "leaderboard" ? (
                            <Leaderboard
                                allScores={game.AllScores}
                                latestScores={game.latestScores}
                                tab={game.leaderboardTab}
                                setTab={game.setLeaderboardTab}
                                page={game.highScorePage}
                                totalPages={game.totalPages}
                                onPageChange={game.handlePageChange}
                                onBack={() => game.setMenuView("main")}
                            />
                        ) : (
                            <>
                                <div className="score-section high-scores-section desktop-only">
                                    <Leaderboard
                                        allScores={game.AllScores}
                                        latestScores={game.latestScores}
                                        tab="highest"
                                        setTab={() => { }}
                                        page={game.highScorePage}
                                        totalPages={game.totalPages}
                                        onPageChange={game.handlePageChange}
                                        onBack={() => { }}
                                        isDashboard
                                    />
                                </div>

                                <MissionHub
                                    playerName={game.playerName}
                                    setPlayerName={game.setPlayerName}
                                    alert={game.alert}
                                    onStart={game.startGame}
                                    onResume={game.handleResume}
                                    hasSavedGame={game.hasSavedGame}
                                    controlType={game.controlType}
                                    setControlType={game.setControlType}
                                    onViewLeaderboard={() => game.setMenuView("leaderboard")}
                                    inputRef={game.inputRef}
                                />

                                <div className="score-section recent-hunts-section desktop-only">
                                    <Leaderboard
                                        allScores={game.AllScores}
                                        latestScores={game.latestScores}
                                        tab="recent"
                                        setTab={() => { }}
                                        page={1}
                                        totalPages={1}
                                        onPageChange={() => { }}
                                        onBack={() => { }}
                                        isDashboard
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="game-screen">
                    <div className="game-layout-container">
                        <Controls
                            type={game.controlType}
                            onDirection={game.handleDirection}
                            joystickRefLeft={game.joystickRefLeft}
                            joystickRefRight={game.joystickRefRight}
                            stickPosLeft={game.stickPosLeft}
                            stickPosRight={game.stickPosRight}
                            onJoystickStart={game.handleJoystickStart}
                            onJoystickMove={game.handleJoystickMove}
                            onJoystickEnd={game.handleJoystickEnd}
                            layout="side-left"
                        />

                        <div className="game-middle-stack">
                            <GameHeader
                                playerName={game.playerName}
                                score={game.score}
                                onPause={game.handlePause}
                                boardSizeVar="var(--board-size)"
                            />

                            <SnakeBoard
                                snake={game.snake}
                                food={game.foodRef.current}
                                direction={game.directionRef.current}
                                boardSizeVar="var(--board-size)"
                            />
                        </div>

                        <Controls
                            type={game.controlType}
                            onDirection={game.handleDirection}
                            joystickRefLeft={game.joystickRefLeft}
                            joystickRefRight={game.joystickRefRight}
                            stickPosLeft={game.stickPosLeft}
                            stickPosRight={game.stickPosRight}
                            onJoystickStart={game.handleJoystickStart}
                            onJoystickMove={game.handleJoystickMove}
                            onJoystickEnd={game.handleJoystickEnd}
                            layout="side-right"
                        />
                    </div>

                    <Controls
                        type={game.controlType}
                        onDirection={game.handleDirection}
                        joystickRefLeft={game.joystickRefLeft}
                        joystickRefRight={game.joystickRefRight}
                        stickPosLeft={game.stickPosLeft}
                        stickPosRight={game.stickPosRight}
                        onJoystickStart={game.handleJoystickStart}
                        onJoystickMove={game.handleJoystickMove}
                        onJoystickEnd={game.handleJoystickEnd}
                        layout="portrait"
                    />
                </div>
            )}
        </div>
    );
}
