import styles from "./Controls.module.css";
import { ControlType } from "../types";

interface ControlsProps {
    type: ControlType;
    onDirection: (dir: string) => void;
    joystickRefLeft: React.RefObject<HTMLDivElement | null>;
    joystickRefRight: React.RefObject<HTMLDivElement | null>;
    stickPosLeft: { x: number; y: number };
    stickPosRight: { x: number; y: number };
    onJoystickStart: (e: any) => void;
    onJoystickMove: (e: any, side: "left" | "right") => void;
    onJoystickEnd: (side: "left" | "right") => void;
    layout: "side-left" | "side-right" | "portrait";
}

export default function Controls({
    type, onDirection, joystickRefLeft, joystickRefRight,
    stickPosLeft, stickPosRight, onJoystickStart, onJoystickMove, onJoystickEnd, layout
}: ControlsProps) {
    if (layout === "portrait") {
        return (
            <div className="portrait-only">
                {type === "buttons" ? (
                    <div className={styles.dpad}>
                        <div className={styles.up}>
                            <button onClick={() => onDirection("ArrowUp")}>⬆️</button>
                        </div>
                        <div className={styles.horizontal}>
                            <button onClick={() => onDirection("ArrowLeft")}>⬅️</button>
                            <button className={styles.centerBtn}>🐍</button>
                            <button onClick={() => onDirection("ArrowRight")}>➡️</button>
                        </div>
                        <div className={styles.down}>
                            <button onClick={() => onDirection("ArrowDown")}>⬇️</button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.joystickWrapper} style={{ marginTop: "2rem" }}>
                        <div
                            className={styles.joystickBase}
                            ref={joystickRefLeft}
                            onTouchStart={onJoystickStart}
                            onTouchMove={(e) => onJoystickMove(e, "left")}
                            onTouchEnd={() => onJoystickEnd("left")}
                            onMouseDown={onJoystickStart}
                            onMouseMove={(e) => e.buttons === 1 && onJoystickMove(e, "left")}
                            onMouseUp={() => onJoystickEnd("left")}
                            onMouseLeave={() => onJoystickEnd("left")}
                        >
                            <div
                                className={styles.joystickHandle}
                                style={{ transform: `translate(${stickPosLeft.x}px, ${stickPosLeft.y}px)` }}
                            ></div>
                        </div>
                        <span className={styles.joystickHint}>JOYSTICK</span>
                    </div>
                )}
            </div>
        );
    }

    const isLeft = layout === "side-left";
    const joystickRef = isLeft ? joystickRefLeft : joystickRefRight;
    const stickPos = isLeft ? stickPosLeft : stickPosRight;
    const side = isLeft ? "left" : "right";

    return (
        <div className={isLeft ? "side-controls left-side desktop-landscape" : "side-controls right-side desktop-landscape"}>
            {type === "buttons" ? (
                <>
                    {isLeft ? (
                        <>
                            <button className={styles.sideBtnRect} onClick={() => onDirection("ArrowUp")}>⬆️</button>
                            <button className={styles.sideBtnRect} onClick={() => onDirection("ArrowDown")}>⬇️</button>
                        </>
                    ) : (
                        <>
                            <button className={styles.sideBtnRect} onClick={() => onDirection("ArrowLeft")}>⬅️</button>
                            <button className={styles.sideBtnRect} onClick={() => onDirection("ArrowRight")}>➡️</button>
                        </>
                    )}
                </>
            ) : (
                <div className={styles.joystickWrapper}>
                    <div
                        className={styles.joystickBase}
                        ref={joystickRef}
                        onTouchStart={onJoystickStart}
                        onTouchMove={(e) => onJoystickMove(e, side as "left" | "right")}
                        onTouchEnd={() => onJoystickEnd(side as "left" | "right")}
                        onMouseDown={onJoystickStart}
                        onMouseMove={(e) => e.buttons === 1 && onJoystickMove(e, side as "left" | "right")}
                        onMouseUp={() => onJoystickEnd(side as "left" | "right")}
                        onMouseLeave={() => onJoystickEnd(side as "left" | "right")}
                    >
                        <div
                            className={styles.joystickHandle}
                            style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)` }}
                        ></div>
                    </div>
                    <span className={styles.joystickHint}>JOYSTICK</span>
                </div>
            )}
        </div>
    );
}
