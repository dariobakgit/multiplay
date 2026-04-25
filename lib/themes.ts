import type { Track } from "./tracks";

/**
 * Theme slugs are URL-safe and stored in the DB. Display names live in
 * i18n (`theme.<slug>` with dashes replaced by underscores).
 */
export type ThemeSlug = string;

/** Metadata for a theme (subject sub-section). */
export interface ThemeInfo {
  slug: ThemeSlug;
  /** i18n key for the display name. */
  nameKey: string;
}

/** Built-in themes per track. New themes are added here AND in the
 * curriculum registry (see `lib/curriculum.ts`). */
export const THEMES_BY_TRACK: Record<Track, ThemeInfo[]> = {
  math: [
    { slug: "tables", nameKey: "theme.tables" },
  ],
  language: [
    { slug: "nouns-verbs", nameKey: "theme.nouns_verbs" },
  ],
};

export function themesFor(track: Track): ThemeInfo[] {
  return THEMES_BY_TRACK[track];
}

export function getThemeInfo(track: Track, slug: ThemeSlug): ThemeInfo | undefined {
  return THEMES_BY_TRACK[track].find((th) => th.slug === slug);
}

export function isValidTheme(track: Track, slug: string): boolean {
  return THEMES_BY_TRACK[track].some((th) => th.slug === slug);
}

/** i18n-key form of the slug (`nouns-verbs` → `nouns_verbs`). */
export function themeKeyPart(slug: ThemeSlug): string {
  return slug.replace(/-/g, "_");
}
