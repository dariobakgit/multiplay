/**
 * Seeds a user with all levels passed and all mascots unlocked.
 * Idempotent — resets the user's progress each time.
 *
 * Credentials resolved in this order:
 *   1) CLI args: npx tsx scripts/seed-user.ts <username> <password>
 *   2) Env vars: SEED_ADMIN_USERNAME + SEED_ADMIN_PASSWORD (read from .env.local)
 *
 * No hardcoded defaults — safe to commit.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

// Load .env.local
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key]) continue;
    process.env[key] = rawVal.replace(/^['"]|['"]$/g, "");
  }
} catch {
  // relies on real env
}

const TOTAL_MATH_LEVELS = 41;
const TOTAL_LANGUAGE_LEVELS = 15;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const pgUrl = process.env.POSTGRES_URL;
  if (!url || !serviceKey || !pgUrl) {
    console.error(
      "❌ Faltan env vars. Necesito NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POSTGRES_URL en .env.local",
    );
    process.exit(1);
  }

  const USERNAME =
    process.argv[2] ?? process.env.SEED_ADMIN_USERNAME ?? "";
  const PASSWORD =
    process.argv[3] ?? process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!USERNAME || !PASSWORD) {
    console.error(
      "❌ Faltan credenciales.\n" +
        "   Opción 1: npx tsx scripts/seed-user.ts <username> <password>\n" +
        "   Opción 2: definí SEED_ADMIN_USERNAME y SEED_ADMIN_PASSWORD en .env.local",
    );
    process.exit(1);
  }
  const EMAIL = `${USERNAME.toLowerCase()}@players.multiply.local`;

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`👤 Seeding user "${USERNAME}" (${EMAIL})...`);

  // Find or create auth user
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) throw listErr;

  let userId: string;
  const existing = list.users.find((u) => u.email === EMAIL);
  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: USERNAME },
    });
    if (error) throw error;
    console.log(`   ✓ Usuario ya existía — password actualizado`);
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: USERNAME },
    });
    if (error) throw error;
    userId = created.user!.id;
    console.log(`   ✓ Usuario creado (${userId})`);
  }

  // Upsert profile + all progress rows
  const pg = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();
  try {
    await pg.query(
      `insert into profiles (id, username, selected_mascot_id)
       values ($1, $2, 1)
       on conflict (id) do update set username = excluded.username`,
      [userId, USERNAME],
    );
    console.log(`   ✓ Profile listo`);

    // Wipe and reinsert progress for both tracks (math + language).
    await pg.query(`delete from progress where user_id = $1`, [userId]);
    const rows: Array<[string, number, string, number, number, boolean, number]> = [];
    for (let i = 0; i < TOTAL_MATH_LEVELS; i++) {
      rows.push([userId, i + 1, "math", 14, 14, true, 3]);
    }
    for (let i = 0; i < TOTAL_LANGUAGE_LEVELS; i++) {
      rows.push([userId, i + 1, "language", 14, 14, true, 3]);
    }
    const values: string[] = [];
    const params: Array<string | number | boolean> = [];
    rows.forEach((r, i) => {
      const base = i * 7;
      values.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, now())`,
      );
      params.push(...r);
    });
    await pg.query(
      `insert into progress (user_id, level_id, track, score, total, passed, stars, updated_at)
       values ${values.join(", ")}`,
      params,
    );
    console.log(
      `   ✓ ${TOTAL_MATH_LEVELS} niveles de Mate + ${TOTAL_LANGUAGE_LEVELS} de Lengua pasados con 3 estrellas`,
    );
  } finally {
    await pg.end();
  }

  console.log(
    `\n✅ Listo. Entrá con usuario "${USERNAME}" / password "${PASSWORD}"`,
  );
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});
