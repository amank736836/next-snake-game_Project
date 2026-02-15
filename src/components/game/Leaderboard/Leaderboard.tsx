import styles from "./Leaderboard.module.css";
import { ScoreEntry, LeaderboardTab } from "../types";

interface LeaderboardProps {
    allScores: ScoreEntry[];
    latestScores: ScoreEntry[];
    tab: LeaderboardTab;
    setTab: (tab: LeaderboardTab) => void;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onBack: () => void;
    isDashboard?: boolean;
}

export default function Leaderboard({
    allScores, latestScores, tab, setTab, page, totalPages, onPageChange, onBack, isDashboard
}: LeaderboardProps) {
    return (
        <div className={styles.container}>
            {!isDashboard && (
                <div className={styles.tabSwitcher}>
                    <button
                        className={`${styles.tabBtn} ${tab === "highest" ? styles.active : ""}`}
                        onClick={() => setTab("highest")}
                    >
                        🏆 HIGHEST
                    </button>
                    <button
                        className={`${styles.tabBtn} ${tab === "recent" ? styles.active : ""}`}
                        onClick={() => setTab("recent")}
                    >
                        🕒 RECENT
                    </button>
                </div>
            )}

            <div className={styles.grid}>
                {/* Highest Scores Section */}
                {(tab === "highest" || !isDashboard) && (
                    <div className={`${styles.section} ${tab !== "highest" && !isDashboard ? styles.mobileHide : ""}`}>
                        <h3>🏆 Highest Scores</h3>
                        <div className={styles.list}>
                            {allScores.map((score, index) => (
                                <div key={index} className={styles.item}>
                                    <span className={styles.rank}>{(page - 1) * 5 + index + 1}</span>
                                    <span className={styles.name}>{score.name}</span>
                                    <span className={styles.val}>{score.highestScore || score.score}</span>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && tab === "highest" && (
                            <div className={styles.pagination}>
                                <button onClick={() => onPageChange(page - 1)} disabled={page === 1}>◀</button>
                                <span>{page} / {totalPages}</span>
                                <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>▶</button>
                            </div>
                        )}
                        {!isDashboard && (
                            <button className={`${styles.backBtn} mobile-only`} onClick={onBack}>
                                BACK TO MISSION ↩️
                            </button>
                        )}
                    </div>
                )}

                {/* Recent Hunts Section */}
                {(tab === "recent" || !isDashboard) && (
                    <div className={`${styles.section} ${tab !== "recent" && !isDashboard ? styles.mobileHide : ""}`}>
                        <h3>🕒 Recent Hunts</h3>
                        <div className={styles.list}>
                            {latestScores.map((score, index) => (
                                <div key={index} className={styles.item}>
                                    <span className={styles.rank}>{index + 1}</span>
                                    <span className={styles.name}>{score.name}</span>
                                    <span className={styles.val}>{score.latestScore || score.score}</span>
                                </div>
                            ))}
                        </div>
                        {!isDashboard && (
                            <button className={`${styles.backBtn} mobile-only`} onClick={onBack}>
                                BACK TO MISSION ↩️
                            </button>
                        )}
                    </div>
                )}
            </div>

            {!isDashboard && (
                <button className={`${styles.backBtn} desktop-only`} style={{ maxWidth: "300px", alignSelf: "center" }} onClick={onBack}>
                    BACK TO MISSION ↩️
                </button>
            )}
        </div>
    );
}
