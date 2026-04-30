import type { Mechanic, MechanicId } from "./types";
import { multipleChoice } from "./multiple-choice";
import { exam } from "./exam";
import { battle } from "./battle";

/** Registro de mecánicas disponibles. */
const MECHANICS: Partial<Record<MechanicId, Mechanic<unknown>>> = {
  multiple_choice: multipleChoice as unknown as Mechanic<unknown>,
  exam: exam as unknown as Mechanic<unknown>,
  battle: battle as unknown as Mechanic<unknown>,
};

export function getMechanic(id: string): Mechanic<unknown> | undefined {
  return MECHANICS[id as MechanicId];
}

export function listMechanicIds(): MechanicId[] {
  return Object.keys(MECHANICS) as MechanicId[];
}
