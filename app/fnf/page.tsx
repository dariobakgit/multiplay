import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Legacy URL — la batalla ahora es el nivel 43 del topic
 * "multiplication-tables". Redirige durante 1 release de transición.
 */
export default function LegacyFnfPage() {
  redirect("/topic/multiplication-tables/level/43");
}
