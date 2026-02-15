import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
    theme: "light" | "dark";
    onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
    return (
        <button className={styles.toggle} onClick={onToggle}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
    );
}
