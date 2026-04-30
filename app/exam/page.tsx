import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Legacy URL — el modo Examen ahora es el nivel 42 del topic
 * "multiplication-tables". Redirige durante 1 release de transición.
 */
export default function LegacyExamPage() {
  redirect("/topic/multiplication-tables/level/42");
}
