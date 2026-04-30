/**
 * Backfill `progress.topic_level_id` y `user_mascots` para todos los
 * usuarios existentes. Set-based, idempotente, multi-tenant safe.
 *
 * Usage: npm run migrate:progress
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
} catch {
  // relies on real env
}

async function main() {
  const pgUrl = process.env.POSTGRES_URL;
  if (!pgUrl) {
    console.error("❌ POSTGRES_URL no está en .env.local");
    process.exit(1);
  }

  const pg = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();

  try {
    // 1) Estado previo
    const before = await pg.query<{ count: string }>(
      `select count(*)::text from public.progress`,
    );
    console.log(`📊 progress rows totales: ${before.rows[0].count}`);

    const beforeNull = await pg.query<{ count: string }>(
      `select count(*)::text from public.progress where topic_level_id is null`,
    );
    console.log(`   topic_level_id NULL: ${beforeNull.rows[0].count}`);

    // 2) Backfill progress.topic_level_id
    console.log("\n🔗 Backfill progress.topic_level_id ...");
    const updRes = await pg.query<{ count: number }>(`
      with updated as (
        update public.progress p
        set topic_level_id = tl.id
        from public.topic_levels tl
        join public.topics t on t.id = tl.topic_id
        where t.slug = 'multiplication-tables'
          and tl.position = p.level_id
          and p.topic_level_id is null
        returning 1
      )
      select count(*)::int as count from updated
    `);
    console.log(`   ✓ ${updRes.rows[0].count} filas actualizadas`);

    const afterNull = await pg.query<{ count: string }>(
      `select count(*)::text from public.progress where topic_level_id is null`,
    );
    console.log(`   topic_level_id NULL después: ${afterNull.rows[0].count}`);

    // 3) Backfill user_mascots desde niveles pasados con mascot
    console.log("\n🎁 Backfill user_mascots desde progress passed=true ...");
    const insRes = await pg.query<{ count: number }>(`
      with inserted as (
        insert into public.user_mascots (user_id, mascot_id, source, acquired_at)
        select p.user_id, tl.unlocks_mascot_id, 'level', p.updated_at
        from public.progress p
        join public.topic_levels tl on tl.id = p.topic_level_id
        where p.passed = true
          and tl.unlocks_mascot_id is not null
        on conflict (user_id, mascot_id) do nothing
        returning 1
      )
      select count(*)::int as count from inserted
    `);
    console.log(`   ✓ ${insRes.rows[0].count} mascot rows insertadas`);

    const totalMascots = await pg.query<{ count: string }>(
      `select count(*)::text from public.user_mascots`,
    );
    console.log(`   user_mascots totales en DB: ${totalMascots.rows[0].count}`);

    // 4) Verificación por usuario
    console.log("\n👥 Verificación por usuario:");
    const perUser = await pg.query<{
      username: string;
      passed: string;
      mascots: string;
    }>(`
      select
        coalesce(pf.username, '(no profile)') as username,
        (select count(*)::text from public.progress p where p.user_id = u.id and p.passed) as passed,
        (select count(*)::text from public.user_mascots m where m.user_id = u.id) as mascots
      from auth.users u
      left join public.profiles pf on pf.id = u.id
      order by pf.username nulls last
    `);
    for (const row of perUser.rows) {
      console.log(
        `   ${row.username.padEnd(22)} passed=${row.passed.padStart(3)}  mascots=${row.mascots.padStart(3)}`,
      );
    }

    // 5) Sanity final
    if (Number(afterNull.rows[0].count) === 0) {
      console.log("\n✅ Backfill completo. Todas las filas tienen topic_level_id.");
    } else {
      console.warn(
        `\n⚠️  ${afterNull.rows[0].count} filas siguen sin topic_level_id. ` +
          `Probablemente level_id está fuera del rango 1..43 del topic actual.`,
      );
    }
  } finally {
    await pg.end();
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});
