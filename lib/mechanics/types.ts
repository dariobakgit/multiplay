import type { ReactNode } from "react";
import type { MascotVariant } from "@/lib/mascots";

export type MechanicId = "multiple_choice" | "exam" | "battle" | "hangman";

/**
 * A level row coming from `topic_levels`, narrowed for one mechanic.
 * Generic over the mechanic's config shape.
 */
export interface MechanicLevel<TConfig = unknown> {
  id: string; // topic_levels.id (uuid)
  topicId: string; // topic_levels.topic_id (uuid)
  position: number; // topic_levels.position
  emoji?: string | null;
  titleKey?: string | null;
  titleVars?: Record<string, string | number> | null;
  subtitleKey?: string | null;
  subtitleVars?: Record<string, string | number> | null;
  config: TConfig;
  unlocksMascotId?: number | null;
  coinReward?: { base?: number; perStar?: number } | null;
  replayable?: boolean;
}

export interface MechanicResult {
  passed: boolean;
  score: number;
  total: number;
  /** Optional 0-3 estrellas, calculado desde score/total si no se pasa. */
  starsEarned?: number;
}

export interface MechanicRendererProps<TConfig = unknown> {
  level: MechanicLevel<TConfig>;
  selectedMascot: MascotVariant;
  userId: string;
  /** Llamado cuando el nivel termina (passed o failed). El page wrapper se
   *  encarga de persistir el resultado, pagar monedas, etc. */
  onResult: (result: MechanicResult) => Promise<void> | void;
  /** Llamado cuando el usuario quiere salir / volver al mapa. */
  onExit?: () => void;
}

export interface Mechanic<TConfig = unknown> {
  id: MechanicId;
  /** Componente que renderiza el flujo completo del nivel
   *  (intro + playing + result), llamando onResult al terminar. */
  Renderer: (props: MechanicRendererProps<TConfig>) => ReactNode;
  /** Valida el shape de `config` que viene de la DB. Lanza si es inválido. */
  validateConfig(config: unknown): TConfig;
}
