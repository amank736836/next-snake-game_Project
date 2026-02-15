import styles from "./MissionHub.module.css";
import { ControlType } from "../types";

interface MissionHubProps {
    playerName: string;
    setPlayerName: (name: string) => void;
    alert: boolean;
    onStart: () => void;
    onResume: () => void;
    hasSavedGame: boolean;
    controlType: ControlType;
    setControlType: (type: ControlType) => void;
    onViewLeaderboard: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function MissionHub({
    playerName, setPlayerName, alert, onStart, onResume,
    hasSavedGame, controlType, setControlType, onViewLeaderboard, inputRef
}: MissionHubProps) {
    return (
        <div className={styles.centerColumn}>
            <div className={styles.title}>
                <div className={styles.logoEmoji}>🐍</div>
                <h1 className={styles.gameName}>Nagini</h1>
                <p className={styles.subtitle}>(from 🤺 Harry Potter 👓 )</p>
            </div>

            <div className={styles.menuBox}>
                <input
                    type="text"
                    placeholder="Enter your name ✍️"
                    value={playerName}
                    className={styles.userInput}
                    onChange={(e) => setPlayerName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 20))}
                    onKeyDown={(e) => e.key === "Enter" && playerName.trim() !== "" && onStart()}
                    ref={inputRef}
                />
                {alert && <p className={styles.alertText}>Please enter your name 🙏</p>}

                <button className={styles.startBtn} onClick={onStart}>
                    START MISSION ⚔️
                </button>

                {hasSavedGame && (
                    <button className={styles.resumeBtn} onClick={onResume}>
                        RESUME MISSION 🚀
                    </button>
                )}

                <div className={styles.controlSelector}>
                    <button
                        className={`${styles.selectorBtn} ${controlType === "buttons" ? styles.active : ""}`}
                        onClick={() => setControlType("buttons")}
                    >
                        🕹️ BUTTONS
                    </button>
                    <button
                        className={`${styles.selectorBtn} ${controlType === "joystick" ? styles.active : ""}`}
                        onClick={() => setControlType("joystick")}
                    >
                        🟢 JOYSTICK
                    </button>
                </div>
            </div>

            <button className={`${styles.navBtn} mobile-only`} onClick={onViewLeaderboard}>
                🏆 VIEW HALL OF FAME
            </button>
        </div>
    );
}
