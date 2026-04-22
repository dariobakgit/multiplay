"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_MASCOT,
  type AccessoryKind,
  type MascotVariant,
} from "@/lib/mascots";

export type Mood = "happy" | "excited" | "sad" | "think" | "celebrate";

export const MOVES = [
  "animate-mv-jump",
  "animate-mv-spin",
  "animate-mv-wiggle",
  "animate-mv-nod",
  "animate-mv-flip",
  "animate-mv-squish",
  "animate-mv-tilt-l",
  "animate-mv-tilt-r",
  "animate-mv-boing",
  "animate-mv-shimmy",
] as const;

export function useRandomMove() {
  const [move, setMove] = useState<string | null>(null);
  const trigger = useCallback(() => {
    setMove(null);
    requestAnimationFrame(() => {
      setMove(MOVES[Math.floor(Math.random() * MOVES.length)]);
    });
  }, []);
  const clear = useCallback(() => setMove(null), []);
  return { move, trigger, clear };
}

const SIZE_PX: Record<"sm" | "md" | "lg", number> = {
  sm: 64,
  md: 110,
  lg: 160,
};
const ASPECT = 130 / 100; // viewBox height / width

interface CharacterProps {
  mood?: Mood;
  size?: keyof typeof SIZE_PX;
  animated?: boolean;
  variant?: MascotVariant;
  locked?: boolean;
  /** Override idle animation with a one-shot class (e.g. "animate-mv-jump"). */
  animClass?: string | null;
  onAnimationEnd?: () => void;
  /** Adds angry eyebrows (intended for the FNF enemy). */
  evil?: boolean;
}

export function Character({
  mood = "happy",
  size = "md",
  animated = true,
  variant = DEFAULT_MASCOT,
  locked = false,
  animClass,
  onAnimationEnd,
  evil = false,
}: CharacterProps) {
  const px = SIZE_PX[size];
  const h = Math.round(px * ASPECT);
  const mouth = getMouthPath(mood);
  const { color, accessory } = variant;

  const main = locked ? "#cbd5e1" : color.main;
  const belly = locked ? "#e2e8f0" : color.belly;
  const leg = locked ? "#94a3b8" : color.leg;
  const eyeColor = locked ? "#64748b" : "#0f172a";

  const finalAnim =
    animClass != null ? animClass : animated && !locked ? "animate-bob" : "";

  return (
    <div
      className={finalAnim}
      style={{ width: px, height: h }}
      onAnimationEnd={onAnimationEnd}
    >
      <svg
        viewBox="0 -20 100 130"
        width={px}
        height={h}
        className="drop-shadow-md"
        aria-hidden="true"
      >
        {/* Legs */}
        <rect x="37" y="86" width="9" height="16" rx="4.5" fill={leg} />
        <rect x="54" y="86" width="9" height="16" rx="4.5" fill={leg} />
        {/* Feet */}
        <ellipse cx="41.5" cy="104" rx="8" ry="3.5" fill="#422006" />
        <ellipse cx="58.5" cy="104" rx="8" ry="3.5" fill="#422006" />

        {/* Body */}
        <ellipse cx="50" cy="50" rx="40" ry="44" fill={main} />
        {/* Belly */}
        <ellipse cx="50" cy="62" rx="24" ry="26" fill={belly} />

        {/* Arms */}
        {mood === "celebrate" && !locked ? (
          <>
            <rect
              x="5"
              y="38"
              width="18"
              height="9"
              rx="4.5"
              fill={main}
              transform="rotate(-30 14 42)"
            />
            <rect
              x="77"
              y="38"
              width="18"
              height="9"
              rx="4.5"
              fill={main}
              transform="rotate(30 86 42)"
            />
          </>
        ) : (
          <>
            <rect x="8" y="52" width="16" height="9" rx="4.5" fill={main} />
            <rect x="76" y="52" width="16" height="9" rx="4.5" fill={main} />
          </>
        )}

        {/* Eyes */}
        <g className={animated && !locked ? "origin-center animate-blink" : ""}>
          <ellipse cx="36" cy="42" rx="11" ry="12" fill="white" />
          <ellipse cx="64" cy="42" rx="11" ry="12" fill="white" />
          {mood === "think" ? (
            <>
              <circle cx="40" cy="38" r="5" fill={eyeColor} />
              <circle cx="68" cy="38" r="5" fill={eyeColor} />
              <circle cx="42" cy="36" r="1.6" fill="white" />
              <circle cx="70" cy="36" r="1.6" fill="white" />
            </>
          ) : (
            <>
              <circle cx="37" cy="44" r="5" fill={eyeColor} />
              <circle cx="65" cy="44" r="5" fill={eyeColor} />
              <circle cx="39" cy="42" r="1.6" fill="white" />
              <circle cx="67" cy="42" r="1.6" fill="white" />
            </>
          )}
        </g>

        {/* Cheeks (skipped when evil or locked) */}
        {!locked && !evil && (
          <>
            <circle cx="22" cy="58" r="5" fill="#fb7185" opacity="0.55" />
            <circle cx="78" cy="58" r="5" fill="#fb7185" opacity="0.55" />
          </>
        )}

        {/* Angry eyebrows (evil only) */}
        {evil && (
          <g
            stroke="#991b1b"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          >
            <line x1="24" y1="26" x2="46" y2="35" />
            <line x1="76" y1="26" x2="54" y2="35" />
          </g>
        )}

        {/* Mouth */}
        {mouth(locked ? "#64748b" : "#0f172a")}

        {/* Accessory (on top of head) */}
        {!locked && <Accessory kind={accessory} />}

        {/* Lock badge */}
        {locked && (
          <g>
            <circle cx="78" cy="18" r="12" fill="#475569" />
            <text
              x="78"
              y="23"
              textAnchor="middle"
              fontSize="14"
              fill="white"
            >
              🔒
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function Accessory({ kind }: { kind: AccessoryKind }) {
  switch (kind) {
    case "hat":
      return (
        <g>
          <rect x="28" y="2" width="44" height="5" rx="2" fill="#0f172a" />
          <rect x="38" y="-14" width="24" height="18" fill="#0f172a" />
          <rect x="38" y="-4" width="24" height="3" fill="#dc2626" />
        </g>
      );
    case "crown":
      return (
        <g>
          <path
            d="M 28 10 L 34 -6 L 42 4 L 50 -10 L 58 4 L 66 -6 L 72 10 Z"
            fill="#fbbf24"
            stroke="#b45309"
            strokeWidth="1.5"
          />
          <circle cx="50" cy="2" r="2.5" fill="#dc2626" />
          <circle cx="36" cy="6" r="2" fill="#3b82f6" />
          <circle cx="64" cy="6" r="2" fill="#16a34a" />
        </g>
      );
    case "bow":
      return (
        <g transform="translate(50 82)">
          <path d="M -11 -5 L -3 0 L -11 5 Z" fill="#ec4899" />
          <path d="M 11 -5 L 3 0 L 11 5 Z" fill="#ec4899" />
          <rect x="-3.5" y="-3.5" width="7" height="7" rx="1.5" fill="#db2777" />
        </g>
      );
    case "flower":
      return (
        <g transform="translate(50 -2)">
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * 6;
            const y = Math.sin(angle) * 6;
            return <circle key={i} cx={x} cy={y} r="4.5" fill="#f472b6" />;
          })}
          <circle cx="0" cy="0" r="3" fill="#fbbf24" />
          <rect x="-1" y="3" width="2" height="10" fill="#16a34a" transform="rotate(-6)" />
        </g>
      );

    case "glasses":
      return (
        <g>
          <circle cx="36" cy="42" r="12" fill="white" fillOpacity="0.15" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="64" cy="42" r="12" fill="white" fillOpacity="0.15" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="48" y1="42" x2="52" y2="42" stroke="#0f172a" strokeWidth="2" />
        </g>
      );
    case "mustache":
      return (
        <path
          d="M 34 66 Q 40 60 50 64 Q 60 60 66 66 Q 60 70 52 66 Q 50 68 48 66 Q 40 70 34 66 Z"
          fill="#422006"
        />
      );
    case "hearts":
      return (
        <g fill="#ec4899" stroke="#0f172a" strokeWidth="1.5">
          <path d="M 36 36 C 32 32 27 35 30 40 L 36 47 L 42 40 C 45 35 40 32 36 36 Z" />
          <path d="M 64 36 C 60 32 55 35 58 40 L 64 47 L 70 40 C 73 35 68 32 64 36 Z" />
          <line x1="48" y1="42" x2="52" y2="42" strokeWidth="2" />
        </g>
      );
    case "stars":
      return (
        <g fill="#fbbf24" stroke="#0f172a" strokeWidth="1.2">
          <path d="M 36 34 L 39 40 L 46 40 L 40 44 L 42 50 L 36 46 L 30 50 L 32 44 L 26 40 L 33 40 Z" />
          <path d="M 64 34 L 67 40 L 74 40 L 68 44 L 70 50 L 64 46 L 58 50 L 60 44 L 54 40 L 61 40 Z" />
          <line x1="46" y1="42" x2="54" y2="42" stroke="#0f172a" strokeWidth="2" />
        </g>
      );
    case "monocle":
      return (
        <g>
          <circle cx="64" cy="42" r="11" fill="white" fillOpacity="0.2" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 74 48 Q 80 58 72 68" stroke="#0f172a" strokeWidth="1.5" fill="none" />
        </g>
      );
    case "eyepatch":
      return (
        <g>
          <ellipse cx="36" cy="42" rx="13" ry="11" fill="#0f172a" />
          <path d="M 24 40 Q 10 30 4 22" stroke="#0f172a" strokeWidth="2" fill="none" />
          <path d="M 48 41 Q 60 32 70 18" stroke="#0f172a" strokeWidth="2" fill="none" />
        </g>
      );

    case "cap":
      return (
        <g>
          {/* visor */}
          <ellipse cx="50" cy="12" rx="30" ry="5" fill="#1e40af" />
          {/* dome */}
          <path d="M 22 12 Q 50 -18 78 12 Z" fill="#1e40af" />
          <circle cx="50" cy="-2" r="2.5" fill="#dc2626" />
        </g>
      );
    case "chef":
      return (
        <g>
          {/* band */}
          <rect x="30" y="6" width="40" height="6" rx="2" fill="white" stroke="#e5e7eb" strokeWidth="1" />
          {/* puffy top */}
          <ellipse cx="40" cy="-4" rx="12" ry="12" fill="white" stroke="#e5e7eb" strokeWidth="1" />
          <ellipse cx="55" cy="-10" rx="14" ry="13" fill="white" stroke="#e5e7eb" strokeWidth="1" />
          <ellipse cx="66" cy="-2" rx="10" ry="10" fill="white" stroke="#e5e7eb" strokeWidth="1" />
        </g>
      );
    case "wizard":
      return (
        <g>
          <path d="M 28 10 L 50 -24 L 72 10 Z" fill="#4c1d95" stroke="#0f172a" strokeWidth="1" />
          <circle cx="50" cy="-10" r="1.8" fill="#fbbf24" />
          <circle cx="44" cy="0" r="1.5" fill="#fbbf24" />
          <circle cx="58" cy="2" r="1.5" fill="#fbbf24" />
          <path d="M 25 10 Q 50 14 75 10" stroke="#4c1d95" strokeWidth="3" fill="none" />
        </g>
      );
    case "pirate":
      return (
        <g>
          <path d="M 20 10 L 26 -4 L 50 -10 L 74 -4 L 80 10 Z" fill="#0f172a" />
          <circle cx="50" cy="0" r="4" fill="white" />
          <circle cx="48" cy="-1" r="0.8" fill="#0f172a" />
          <circle cx="52" cy="-1" r="0.8" fill="#0f172a" />
          <path d="M 48 3 L 52 3" stroke="#0f172a" strokeWidth="0.8" />
        </g>
      );
    case "cowboy":
      return (
        <g>
          <ellipse cx="50" cy="10" rx="34" ry="5" fill="#92400e" />
          <path d="M 32 10 Q 34 -10 50 -12 Q 66 -10 68 10 Z" fill="#92400e" stroke="#78350f" strokeWidth="1" />
          <rect x="32" y="5" width="36" height="3" fill="#78350f" />
        </g>
      );
    case "santa":
      return (
        <g>
          <path d="M 30 10 Q 40 -18 68 -12 Q 62 4 30 10 Z" fill="#dc2626" />
          <rect x="28" y="8" width="44" height="5" rx="2" fill="white" />
          <circle cx="68" cy="-12" r="5" fill="white" />
        </g>
      );
    case "astronaut":
      return (
        <g>
          <circle cx="50" cy="40" r="45" fill="#bae6fd" fillOpacity="0.25" stroke="#0f172a" strokeWidth="2" />
          <path d="M 18 32 Q 22 20 32 14" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "viking":
      return (
        <g>
          <rect x="28" y="4" width="44" height="8" rx="3" fill="#9ca3af" stroke="#374151" strokeWidth="1" />
          <path d="M 28 8 Q 14 -14 18 6" fill="#f5f5f4" stroke="#44403c" strokeWidth="1.5" />
          <path d="M 72 8 Q 86 -14 82 6" fill="#f5f5f4" stroke="#44403c" strokeWidth="1.5" />
          <circle cx="50" cy="8" r="2" fill="#374151" />
        </g>
      );
    case "hardhat":
      return (
        <g>
          <ellipse cx="50" cy="10" rx="30" ry="4" fill="#ca8a04" />
          <path d="M 22 10 Q 50 -16 78 10 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
          <rect x="48" y="-5" width="4" height="15" fill="#ca8a04" />
        </g>
      );
    case "graduate":
      return (
        <g>
          <rect x="30" y="6" width="40" height="4" fill="#0f172a" />
          <path d="M 20 6 L 50 -6 L 80 6 L 50 18 Z" fill="#0f172a" />
          <line x1="70" y1="0" x2="85" y2="10" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="85" cy="10" r="2" fill="#fbbf24" />
        </g>
      );
    case "beret":
      return (
        <g>
          <ellipse cx="52" cy="6" rx="22" ry="8" fill="#991b1b" transform="rotate(-8 52 6)" />
          <circle cx="70" cy="-3" r="3" fill="#991b1b" />
        </g>
      );
    case "sombrero":
      return (
        <g>
          <ellipse cx="50" cy="12" rx="42" ry="6" fill="#b45309" stroke="#78350f" strokeWidth="1" />
          <path d="M 32 12 Q 40 -8 50 -10 Q 60 -8 68 12 Z" fill="#d97706" stroke="#78350f" strokeWidth="1" />
          <ellipse cx="50" cy="12" rx="34" ry="4" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        </g>
      );
    case "tiara":
      return (
        <g>
          <path d="M 34 10 L 40 0 L 50 6 L 60 0 L 66 10 Z" fill="#e5e7eb" stroke="#6b7280" strokeWidth="1" />
          <circle cx="50" cy="4" r="2" fill="#fbbf24" />
          <circle cx="40" cy="6" r="1.3" fill="#93c5fd" />
          <circle cx="60" cy="6" r="1.3" fill="#93c5fd" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M 12 40 Q 12 -2 50 -2 Q 88 -2 88 40" stroke="#0f172a" strokeWidth="3" fill="none" />
          <rect x="5" y="34" width="12" height="16" rx="3" fill="#dc2626" />
          <rect x="83" y="34" width="12" height="16" rx="3" fill="#dc2626" />
        </g>
      );
    case "bandana":
      return (
        <g>
          <path d="M 14 14 Q 50 4 86 14 L 84 22 Q 50 18 16 22 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          <circle cx="30" cy="18" r="1.5" fill="white" />
          <circle cx="50" cy="15" r="1.5" fill="white" />
          <circle cx="70" cy="18" r="1.5" fill="white" />
        </g>
      );
    case "halo":
      return (
        <g>
          <ellipse cx="50" cy="-6" rx="20" ry="5" fill="none" stroke="#fbbf24" strokeWidth="3" />
          <ellipse cx="50" cy="-6" rx="16" ry="3.5" fill="#fde68a" fillOpacity="0.6" />
        </g>
      );
    case "unicorn":
      return (
        <g>
          <path d="M 48 8 L 50 -18 L 52 8 Z" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
          <path d="M 49 -12 Q 51 -14 52 -10" stroke="#b45309" strokeWidth="1" fill="none" />
          <path d="M 48 -4 Q 51 -6 52 -2" stroke="#b45309" strokeWidth="1" fill="none" />
        </g>
      );
    case "devilhorns":
      return (
        <g fill="#dc2626" stroke="#7f1d1d" strokeWidth="1">
          <path d="M 30 10 Q 26 -8 38 4 Z" />
          <path d="M 70 10 Q 74 -8 62 4 Z" />
        </g>
      );
    case "antenna":
      return (
        <g>
          <line x1="50" y1="8" x2="50" y2="-14" stroke="#0f172a" strokeWidth="2" />
          <circle cx="50" cy="-16" r="4" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
        </g>
      );

    case "scarf":
      return (
        <g>
          <rect x="20" y="80" width="60" height="8" rx="3" fill="#be123c" />
          <rect x="16" y="86" width="14" height="18" rx="3" fill="#be123c" />
          <path d="M 22 88 Q 23 96 22 102" stroke="#881337" strokeWidth="0.8" fill="none" />
          <path d="M 28 88 Q 29 96 28 102" stroke="#881337" strokeWidth="0.8" fill="none" />
        </g>
      );
    case "tie":
      return (
        <g>
          <path d="M 46 78 L 54 78 L 56 82 L 50 85 L 44 82 Z" fill="#0f172a" />
          <path d="M 44 85 L 56 85 L 58 100 L 50 104 L 42 100 Z" fill="#1e40af" />
          <path d="M 46 88 L 54 88 M 46 92 L 54 92" stroke="#1e3a8a" strokeWidth="0.6" />
        </g>
      );

    case "division":
      return (
        <g stroke="#7f1d1d" strokeWidth="0.8">
          <circle cx="50" cy="-12" r="3.2" fill="#dc2626" />
          <rect x="36" y="-5" width="28" height="4.5" rx="2.2" fill="#dc2626" />
          <circle cx="50" cy="6" r="3.2" fill="#dc2626" />
        </g>
      );

    case "none":
    default:
      return null;
  }
}

function getMouthPath(mood: Mood): (stroke: string) => React.ReactElement {
  switch (mood) {
    case "excited":
      return (stroke) => <ellipse cx="50" cy="68" rx="7" ry="8" fill={stroke} />;
    case "sad":
      return (stroke) => (
        <path
          d="M 40 72 Q 50 62 60 72"
          stroke={stroke}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "think":
      return (stroke) => (
        <path
          d="M 44 70 L 56 70"
          stroke={stroke}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "celebrate":
      return (stroke) => (
        <path
          d="M 38 62 Q 50 78 62 62 Q 50 70 38 62 Z"
          fill={stroke}
        />
      );
    case "happy":
    default:
      return (stroke) => (
        <path
          d="M 40 64 Q 50 74 60 64"
          stroke={stroke}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      );
  }
}

export interface MascotProps {
  message: string | string[];
  mood?: Mood;
  size?: keyof typeof SIZE_PX;
  side?: "left" | "right";
  variant?: MascotVariant;
}

export function Mascot({
  message,
  mood = "happy",
  size = "md",
  side = "left",
  variant,
}: MascotProps) {
  const messages = Array.isArray(message) ? message : [message];
  const [idx, setIdx] = useState(0);
  const { move, trigger, clear } = useRandomMove();

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % messages.length),
      3800,
    );
    return () => clearInterval(t);
  }, [messages.length]);

  function next() {
    if (messages.length <= 1) return;
    setIdx((i) => (i + 1) % messages.length);
  }

  return (
    <div
      className={`flex items-end gap-2 ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      <button
        type="button"
        onClick={trigger}
        className="shrink-0 cursor-pointer"
        aria-label="Tocá la mascota"
      >
        <Character
          mood={mood}
          size={size}
          variant={variant}
          animClass={move}
          onAnimationEnd={clear}
        />
      </button>
      <button
        type="button"
        onClick={next}
        className={`relative max-w-[70%] rounded-2xl bg-white px-4 py-3 text-left text-sm font-bold text-slate-800 shadow-md ring-1 ring-slate-200 animate-bubble sm:text-base ${
          messages.length > 1 ? "cursor-pointer" : "cursor-default"
        }`}
        aria-label={messages.length > 1 ? "Siguiente mensaje" : undefined}
      >
        <span key={idx} className="block animate-pop">
          {messages[idx]}
        </span>
        <span
          className={`absolute bottom-3 h-3 w-3 rotate-45 bg-white ring-1 ring-slate-200 ${
            side === "left" ? "-left-1.5" : "-right-1.5"
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
