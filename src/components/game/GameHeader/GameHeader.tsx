import styles from "./GameHeader.module.css";

interface GameHeaderProps {
    playerName: string;
    score: number;
    onPause: () => void;
    boardSizeVar: string;
}

export default function GameHeader({ playerName, score, onPause, boardSizeVar }: GameHeaderProps) {
    return (
        <div className={styles.header} style={{ width: `calc(${boardSizeVar} + 12px)` }}>
            <div className={styles.currentUser}>👤 {playerName}</div>
            <div className={styles.liveScore}>🍎 {score}</div>
            <button className={styles.pauseBtn} onClick={onPause}>PAUSE</button>
        </div>
    );
}
