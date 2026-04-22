/**
 * Shared helper: checks if a given profile belongs to the admin.
 * For now this is a single hardcoded username.
 */
export const ADMIN_USERNAME = "dario";

export function isAdminUsername(username: string | null | undefined): boolean {
  return username === ADMIN_USERNAME;
}
