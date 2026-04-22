export type AccessoryKind =
  | "none"
  // tier 1 (kept from before)
  | "bow"
  | "hat"
  | "flower"
  | "crown"
  // face wear
  | "glasses"
  | "mustache"
  | "hearts"
  | "stars"
  | "monocle"
  | "eyepatch"
  // hats / head wear
  | "cap"
  | "chef"
  | "wizard"
  | "pirate"
  | "cowboy"
  | "santa"
  | "astronaut"
  | "viking"
  | "hardhat"
  | "graduate"
  | "beret"
  | "sombrero"
  | "tiara"
  | "headphones"
  | "bandana"
  | "halo"
  | "unicorn"
  | "devilhorns"
  | "antenna"
  // neck / chest
  | "scarf"
  | "tie"
  // special (not in regular catalog)
  | "division";

export interface MascotColor {
  main: string;
  belly: string;
  leg: string;
}

export interface MascotVariant {
  id: number; // matches level.id
  name: string;
  color: MascotColor;
  accessory: AccessoryKind;
}

const COLORS: MascotColor[] = [
  { main: "#22c55e", belly: "#86efac", leg: "#15803d" },
  { main: "#3b82f6", belly: "#93c5fd", leg: "#1e40af" },
  { main: "#a855f7", belly: "#d8b4fe", leg: "#6b21a8" },
  { main: "#ec4899", belly: "#f9a8d4", leg: "#9f1239" },
  { main: "#f97316", belly: "#fdba74", leg: "#9a3412" },
  { main: "#eab308", belly: "#fde68a", leg: "#854d0e" },
  { main: "#06b6d4", belly: "#67e8f9", leg: "#155e75" },
  { main: "#ef4444", belly: "#fca5a5", leg: "#991b1b" },
  { main: "#64748b", belly: "#cbd5e1", leg: "#1e293b" },
  { main: "#14b8a6", belly: "#5eead4", leg: "#115e59" },
];

// 31 unique accessories, one per level from 11 to 41.
const UNIQUE_ACCESSORIES: AccessoryKind[] = [
  "bow",
  "hat",
  "flower",
  "crown",
  "glasses",
  "mustache",
  "cap",
  "chef",
  "wizard",
  "pirate",
  "cowboy",
  "santa",
  "antenna",
  "viking",
  "hardhat",
  "graduate",
  "beret",
  "sombrero",
  "tiara",
  "headphones",
  "hearts",
  "stars",
  "monocle",
  "scarf",
  "tie",
  "eyepatch",
  "halo",
  "unicorn",
  "devilhorns",
  "bandana",
  "astronaut",
];

const NAMES = [
  "Multi",    "Azuli",    "Pipo",     "Rosy",     "Tango",
  "Soli",     "Kai",      "Chili",    "Pepón",    "Mentina",
  "Moñito",   "Galera",   "Flori",    "Rey",      "Lupa",
  "Bigotes",  "Capi",     "Chef",     "Merlín",   "Corsario",
  "Sheriff",  "Nicolás",  "Marcián",  "Thor",     "Bob",
  "Graduado", "Boino",    "Pancho",   "Princi",   "Beats",
  "Lovi",     "Starly",   "Monó",     "Bufa",     "Elegante",
  "Pirata",   "Angie",    "Uni",      "Diablín",  "Tato",
  "Cosmo",
];

function buildMascots(): MascotVariant[] {
  const out: MascotVariant[] = [];
  for (let i = 0; i < 41; i++) {
    const levelId = i + 1;
    const accessory: AccessoryKind =
      levelId <= 10 ? "none" : UNIQUE_ACCESSORIES[levelId - 11] ?? "none";
    out.push({
      id: levelId,
      name: NAMES[i],
      color: COLORS[i % COLORS.length],
      accessory,
    });
  }
  return out;
}

export const MASCOTS: MascotVariant[] = buildMascots();

export const DEFAULT_MASCOT: MascotVariant = MASCOTS[0];

/** Special one-off variant for the FNF enemy. Not part of the catalog. */
export const EVIL_MASCOT: MascotVariant = {
  id: -1,
  name: "Multi Malvado",
  color: { main: "#0f172a", belly: "#334155", leg: "#020617" },
  accessory: "division",
};

export function getMascotForLevel(levelId: number): MascotVariant | undefined {
  return MASCOTS[levelId - 1];
}
