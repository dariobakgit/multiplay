/**
 * Word bank and curated sentence/pair lists for the Language module.
 * Calibrated for 8-9 year-olds (Spanish): concrete vocabulary, short
 * sentences, no abstract nouns or compound tenses.
 *
 * Each list is intentionally large enough that the question generator
 * rarely repeats the same combination within a session.
 */

// ========================================================================
//                              WORD LISTS
// ========================================================================

/** Common nouns — never proper. Lowercase, singular when possible. */
export const COMMON_NOUNS: string[] = [
  // animales
  "perro", "gato", "pájaro", "pez", "caballo", "vaca", "oveja",
  "ratón", "conejo", "león", "tigre", "oso", "lobo", "elefante",
  "jirafa", "mono", "pollo", "pato", "tortuga",
  // cosas
  "mesa", "silla", "libro", "lápiz", "cuaderno", "pelota", "juguete",
  "ventana", "puerta", "cama", "mochila", "computadora", "teléfono",
  "bicicleta", "auto", "barco", "tren", "avión", "globo",
  // personas
  "niño", "niña", "abuelo", "abuela", "amigo", "amiga", "hermano",
  "hermana", "maestra", "maestro", "doctor", "panadero", "bombero",
  // lugares
  "escuela", "casa", "parque", "plaza", "hospital", "playa", "bosque",
  // naturaleza
  "árbol", "río", "montaña", "sol", "luna", "estrella", "nube",
  "flor", "hoja", "piedra", "mar",
  // comida
  "manzana", "pan", "leche", "galleta", "helado", "queso", "agua",
  "jugo", "pizza", "sopa", "torta", "caramelo",
];

/** Proper nouns — capitalized. Names of people, places, pets. */
export const PROPER_NOUNS: string[] = [
  // personas
  "María", "Juan", "Lucía", "Pedro", "Sofía", "Tomás", "Martina",
  "Bautista", "Catalina", "Francisco", "Camila", "Mateo", "Valentina",
  "Lautaro", "Emma", "Joaquín",
  // lugares (ciudades / países / accidentes)
  "Argentina", "Brasil", "Chile", "Uruguay", "España",
  "Buenos Aires", "Mendoza", "Córdoba", "Rosario", "Bariloche",
  "Madrid", "Roma", "París", "Londres",
  "Nilo", "Amazonas", "Andes", "Aconcagua",
  // mascotas
  "Firulais", "Bobby", "Toto", "Lola", "Mimi", "Pelusa", "Rocky",
];

/** Adjectives — singular masculine form by default; some neutral. */
export const ADJECTIVES: string[] = [
  // tamaño
  "alto", "bajo", "grande", "pequeño", "chico", "gigante", "ancho",
  "angosto", "largo", "corto",
  // colores
  "rojo", "azul", "verde", "amarillo", "blanco", "negro", "rosa",
  "naranja", "violeta", "marrón", "gris",
  // estados / sentimientos
  "feliz", "triste", "contento", "enojado", "asustado", "cansado",
  "aburrido", "valiente",
  // cualidades
  "rápido", "lento", "fuerte", "débil", "bueno", "malo", "lindo",
  "feo", "nuevo", "viejo", "limpio", "sucio",
  // texturas / temperaturas / sabores
  "blando", "duro", "suave", "áspero", "frío", "caliente", "tibio",
  "dulce", "amargo", "salado",
];

/** Verbs in infinitive form — used for "¿cuál es un verbo?". */
export const VERBS_INFINITIVE: string[] = [
  // movimiento
  "correr", "saltar", "caminar", "nadar", "volar", "bailar", "brincar",
  "escalar", "trepar",
  // acciones cotidianas
  "comer", "beber", "dormir", "jugar", "leer", "escribir", "dibujar",
  "pintar", "cantar", "cocinar",
  // comunicación
  "hablar", "decir", "escuchar", "gritar", "llorar", "reír",
  // escuela / mente
  "estudiar", "aprender", "enseñar", "pensar", "recordar", "ayudar",
  // otros
  "mirar", "tocar", "abrir", "cerrar", "romper", "atrapar", "buscar",
  "encontrar", "ganar", "perder",
];

/** Distractor words used to fill option slots in questions where the
 * "wrong" options should not themselves be of the right class. Mostly
 * adverbs and time/place modifiers — clearly not nouns/adjectives/verbs. */
export const ADVERBS_AND_OTHERS: string[] = [
  "rápidamente", "lentamente", "ayer", "hoy", "mañana", "ahora",
  "aquí", "allí", "siempre", "nunca", "muy", "demasiado", "casi",
  "luego", "antes",
];

// ========================================================================
//                            SENTENCE LISTS
// ========================================================================

/** Sentences that contain exactly one common noun. The other words
 * are articles, verbs, adjectives, or adverbs — never nouns. */
export const SENT_ONE_COMMON_NOUN: Array<{
  sentence: string;
  noun: string;
}> = [
  { sentence: "El perro corre rápido", noun: "perro" },
  { sentence: "Mi gato duerme tranquilo", noun: "gato" },
  { sentence: "La pelota rueda lejos", noun: "pelota" },
  { sentence: "Un libro está abierto", noun: "libro" },
  { sentence: "Mi lápiz se rompió", noun: "lápiz" },
  { sentence: "El árbol crece mucho", noun: "árbol" },
  { sentence: "Su mochila pesa demasiado", noun: "mochila" },
  { sentence: "Un avión vuela alto", noun: "avión" },
  { sentence: "El sol brilla fuerte", noun: "sol" },
  { sentence: "La luna ilumina todo", noun: "luna" },
  { sentence: "Mi bicicleta es nueva", noun: "bicicleta" },
  { sentence: "El conejo salta rápido", noun: "conejo" },
  { sentence: "La torta está rica", noun: "torta" },
  { sentence: "Mi cuaderno está limpio", noun: "cuaderno" },
  { sentence: "El globo subió altísimo", noun: "globo" },
  { sentence: "La flor crece linda", noun: "flor" },
  { sentence: "Mi hermano juega contento", noun: "hermano" },
  { sentence: "El elefante camina lento", noun: "elefante" },
  { sentence: "Esa nube parece blanca", noun: "nube" },
  { sentence: "Mi abuela cocina rico", noun: "abuela" },
];

/** Sentences with exactly one proper noun and zero common nouns.
 * All sentences are 4+ words so "which is the noun?" questions can use
 * 4 distinct sentence words as options. */
export const SENT_ONE_PROPER_NOUN: Array<{
  sentence: string;
  noun: string;
}> = [
  { sentence: "Lucía canta muy bien", noun: "Lucía" },
  { sentence: "Juan corre muy rápido", noun: "Juan" },
  { sentence: "María baila siempre contenta", noun: "María" },
  { sentence: "Pedro saltó muy alto", noun: "Pedro" },
  { sentence: "Sofía dibuja muy lindo", noun: "Sofía" },
  { sentence: "Tomás llegó bastante tarde", noun: "Tomás" },
  { sentence: "Martina ríe muy fuerte", noun: "Martina" },
  { sentence: "Camila estudia siempre mucho", noun: "Camila" },
  { sentence: "Mateo grita demasiado fuerte", noun: "Mateo" },
  { sentence: "Mendoza queda muy lejos", noun: "Mendoza" },
  { sentence: "Bariloche está totalmente nevada", noun: "Bariloche" },
  { sentence: "Roma es muy antigua", noun: "Roma" },
  { sentence: "Toto es siempre travieso", noun: "Toto" },
  { sentence: "Bobby salta muy alto", noun: "Bobby" },
  { sentence: "Lola duerme siempre tranquila", noun: "Lola" },
  { sentence: "Argentina es enormemente grande", noun: "Argentina" },
  { sentence: "Joaquín pinta muy lindo", noun: "Joaquín" },
];

/** Sentences with multiple nouns (common + proper mixed). Used by
 * count-nouns questions. The "nouns" array lists every noun in the
 * sentence in order of appearance. */
export const SENT_MULTI_NOUNS: Array<{
  sentence: string;
  count: number;
  nouns: string[];
}> = [
  { sentence: "El perro come hueso", count: 2, nouns: ["perro", "hueso"] },
  { sentence: "Mi hermana lee un libro", count: 2, nouns: ["hermana", "libro"] },
  { sentence: "El gato bebe leche", count: 2, nouns: ["gato", "leche"] },
  { sentence: "Los niños juegan en la plaza", count: 2, nouns: ["niños", "plaza"] },
  { sentence: "Mi mamá compró pan", count: 2, nouns: ["mamá", "pan"] },
  { sentence: "El elefante toma agua", count: 2, nouns: ["elefante", "agua"] },
  { sentence: "Lucía vive en Mendoza", count: 2, nouns: ["Lucía", "Mendoza"] },
  { sentence: "Juan tiene un perro", count: 2, nouns: ["Juan", "perro"] },
  { sentence: "Sofía pintó una flor", count: 2, nouns: ["Sofía", "flor"] },
  {
    sentence: "El doctor revisa al niño en el hospital",
    count: 3,
    nouns: ["doctor", "niño", "hospital"],
  },
  {
    sentence: "Mi abuela cocina pollo y arroz",
    count: 3,
    nouns: ["abuela", "pollo", "arroz"],
  },
  {
    sentence: "Pedro y Lucía juegan con la pelota",
    count: 3,
    nouns: ["Pedro", "Lucía", "pelota"],
  },
  {
    sentence: "El león y el tigre viven en la selva",
    count: 3,
    nouns: ["león", "tigre", "selva"],
  },
];

/** Pairs for capitalization questions — proper + common nouns mixed.
 * "correct" must be the only one with the right capitalization. */
export const CAPITALIZATION_QUESTIONS: Array<{
  correct: string;
  variants: string[];
}> = [
  {
    correct: "Messi juega al fútbol",
    variants: [
      "messi juega al fútbol",
      "Messi juega al Fútbol",
      "messi Juega al fútbol",
    ],
  },
  {
    correct: "María vive en Buenos Aires",
    variants: [
      "maría vive en buenos aires",
      "María vive en buenos aires",
      "maría vive en Buenos Aires",
    ],
  },
  {
    correct: "Toto come en la cocina",
    variants: [
      "toto come en la cocina",
      "toto come en la Cocina",
      "Toto Come en la cocina",
    ],
  },
  {
    correct: "Pedro juega con Bobby",
    variants: [
      "pedro juega con bobby",
      "Pedro juega con bobby",
      "pedro Juega con Bobby",
    ],
  },
  {
    correct: "El río Nilo es muy largo",
    variants: [
      "el río nilo es muy largo",
      "El río nilo es Muy largo",
      "el Río Nilo es muy largo",
    ],
  },
  {
    correct: "Lucía nació en Córdoba",
    variants: [
      "lucía nació en córdoba",
      "Lucía nació en córdoba",
      "lucía nació en Córdoba",
    ],
  },
];

/** "¿Qué adjetivo describe a X?" — the most natural / most-common adj. */
export const DESCRIBE_NOUN: Array<{
  subject: string;
  adjective: string;
  /** Subject is feminine, masculine or neutral — to phrase the prompt right. */
  gender: "f" | "m";
}> = [
  { subject: "león", adjective: "fuerte", gender: "m" },
  { subject: "elefante", adjective: "grande", gender: "m" },
  { subject: "ratón", adjective: "pequeño", gender: "m" },
  { subject: "hielo", adjective: "frío", gender: "m" },
  { subject: "fuego", adjective: "caliente", gender: "m" },
  { subject: "azúcar", adjective: "dulce", gender: "f" },
  { subject: "limón", adjective: "amargo", gender: "m" },
  { subject: "nieve", adjective: "blanca", gender: "f" },
  { subject: "cielo", adjective: "azul", gender: "m" },
  { subject: "tortuga", adjective: "lenta", gender: "f" },
  { subject: "guepardo", adjective: "rápido", gender: "m" },
  { subject: "almohada", adjective: "blanda", gender: "f" },
  { subject: "piedra", adjective: "dura", gender: "f" },
  { subject: "noche", adjective: "oscura", gender: "f" },
  { subject: "sol", adjective: "brillante", gender: "m" },
];

/** "¿Qué hace X?" — typical action verb (3rd person singular). */
export const SUBJECT_VERB: Array<{
  subject: string;
  verb: string;
  /** Article and gender for prompt phrasing. */
  article: "un" | "una";
}> = [
  { subject: "perro", verb: "ladra", article: "un" },
  { subject: "gato", verb: "maúlla", article: "un" },
  { subject: "pájaro", verb: "vuela", article: "un" },
  { subject: "pez", verb: "nada", article: "un" },
  { subject: "caballo", verb: "galopa", article: "un" },
  { subject: "vaca", verb: "muge", article: "una" },
  { subject: "oveja", verb: "bala", article: "una" },
  { subject: "cocinero", verb: "cocina", article: "un" },
  { subject: "panadero", verb: "amasa", article: "un" },
  { subject: "doctor", verb: "cura", article: "un" },
  { subject: "maestra", verb: "enseña", article: "una" },
  { subject: "cantante", verb: "canta", article: "un" },
  { subject: "bailarina", verb: "baila", article: "una" },
  { subject: "flor", verb: "florece", article: "una" },
  { subject: "estrella", verb: "brilla", article: "una" },
];

/** Sentences with exactly one adjective. */
export const SENT_ONE_ADJECTIVE: Array<{
  sentence: string;
  adjective: string;
}> = [
  { sentence: "El perro grande corre", adjective: "grande" },
  { sentence: "Mi gato negro duerme", adjective: "negro" },
  { sentence: "La pelota roja rebota", adjective: "roja" },
  { sentence: "El niño feliz salta", adjective: "feliz" },
  { sentence: "Una flor amarilla crece", adjective: "amarilla" },
  { sentence: "Mi abuela vieja cocina", adjective: "vieja" },
  { sentence: "El elefante enorme camina", adjective: "enorme" },
  { sentence: "Un libro nuevo apareció", adjective: "nuevo" },
  { sentence: "Mi mochila azul pesa", adjective: "azul" },
  { sentence: "El árbol alto crece", adjective: "alto" },
  { sentence: "La leche fría sirve", adjective: "fría" },
  { sentence: "El tren rápido pasa", adjective: "rápido" },
  { sentence: "Mi cuaderno limpio brilla", adjective: "limpio" },
  { sentence: "Una galleta dulce cayó", adjective: "dulce" },
];

/** Sentences with exactly one verb (other words are nouns/adj/articles). */
export const SENT_ONE_VERB: Array<{
  sentence: string;
  verb: string;
}> = [
  { sentence: "El niño juega contento", verb: "juega" },
  { sentence: "Mi mamá cocina rico", verb: "cocina" },
  { sentence: "El sol brilla mucho", verb: "brilla" },
  { sentence: "La flor crece linda", verb: "crece" },
  { sentence: "Mi gato duerme tranquilo", verb: "duerme" },
  { sentence: "El pájaro canta lindo", verb: "canta" },
  { sentence: "Un avión vuela alto", verb: "vuela" },
  { sentence: "El pez nada rápido", verb: "nada" },
  { sentence: "Mi hermana baila bien", verb: "baila" },
  { sentence: "El bebé llora fuerte", verb: "llora" },
  { sentence: "El abuelo lee tranquilo", verb: "lee" },
  { sentence: "El conejo salta alto", verb: "salta" },
  { sentence: "La maestra explica claro", verb: "explica" },
  { sentence: "Mi perro corre feliz", verb: "corre" },
];
