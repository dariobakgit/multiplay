/**
 * Runs supabase/schema.sql against the Postgres DB.
 * Idempotent — safe to run multiple times.
 *
 * Usage: npm run db:setup
 *
 * Needs POSTGRES_URL in .env.local (direct connection, port 5432).
 * Get it at: Supabase dashboard → Project Settings → Database
 *   → Connection string → URI (select "Transaction" or "Session" mode).
 *   Prefer the direct connection for DDL.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

// Load .env.local
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key]) continue;
    const val = rawVal.replace(/^['"]|['"]$/g, "");
    process.env[key] = val;
  }
} catch {
  // No .env.local — relies on real env vars
}

async function main() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error(
      "❌ POSTGRES_URL no está en .env.local.\n" +
        "   Copiala desde Supabase → Project Settings → Database → Connection string (URI).",
    );
    process.exit(1);
  }

  const sqlPath = resolve(process.cwd(), "supabase/schema.sql");
  const sql = readFileSync(sqlPath, "utf8");

  const client = new Client({
    connectionString: url,
    // Supabase pooler requires SSL; direct also supports it.
    ssl: { rejectUnauthorized: false },
  });

  console.log("🔌 Conectando a Postgres...");
  await client.connect();

  try {
    console.log("🧱 Aplicando schema...");
    await client.query(sql);
    console.log("✅ Schema aplicado. Tablas: profiles, progress (con RLS).");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
    console.error(
      "   ¿POSTGRES_URL correcto? Probá con la connection string directa de Supabase.",
    );
  }
  process.exit(1);
});
