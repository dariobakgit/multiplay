import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Legacy URL — redirige al nuevo flow basado en topic + position.
 * Se mantiene durante 1 release para no romper bookmarks de PWAs viejas.
 */
export default async function LegacyLevelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/topic/multiplication-tables/level/${id}`);
}
