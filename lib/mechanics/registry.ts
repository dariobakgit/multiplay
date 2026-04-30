import type { Mechanic, MechanicId } from "./types";
import { multipleChoice } from "./multiple-choice";

/** Registro de mecánicas disponibles. Se va llenando en cada commit
 *  de la fase 2 — exam y battle se agregan en commits siguientes. */
const MECHANICS: Partial<Record<MechanicId, Mechanic<unknown>>> = {
  multiple_choice: multipleChoice as unknown as Mechanic<unknown>,
};

export function getMechanic(id: string): Mechanic<unknown> | undefined {
  return MECHANICS[id as MechanicId];
}

export function listMechanicIds(): MechanicId[] {
  return Object.keys(MECHANICS) as MechanicId[];
}
