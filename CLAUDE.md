# Multiplay — guía para Claude

App educativa para que un chico de 8 años aprenda las tablas de multiplicar. Live en [multiply-psi.vercel.app](https://multiply-psi.vercel.app).

## Stack

- **Next.js 16** App Router + TypeScript + Tailwind v3
- **Supabase** (auth + Postgres con RLS)
- **Vercel** — deploy automático en cada push a `main` (git integration activa)
- **PWA** — manifest + iconos en `public/`, banner de instalación en `components/InstallBanner.tsx`

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de producción |
| `npm run lint` | Lint |
| `npm run db:setup` | Aplica `supabase/schema.sql` (idempotente) |
| `npm run icons` | Regenera PNGs del ícono PWA desde `public/icon.svg` |
| `npx tsx scripts/seed-user.ts <user> <pass>` | Crea/resetea usuario con todo desbloqueado. Sin args lee de `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` en `.env.local` |
| `vercel --prod --yes` | Deploy manual (también pasa por `git push`) |

## Estructura clave

- `app/page.tsx` + `HomeClient.tsx` — mapa de niveles, banners (examen, FNF, librería, admin)
- `app/level/[id]/` — gameplay por nivel
- `app/exam/`, `app/fnf/`, `app/library/`, `app/admin/`, `app/login/`, `app/signup/`
- `app/(auth)/actions.ts` — server actions de login/signup/logout (errores devuelven keys i18n, ej `"err.missing_fields"`)
- `lib/curriculum.ts` — los **41 niveles** generados; títulos vía `formatLevelTitle/Subtitle(level, t)` con i18n keys
- `lib/mascots.ts` — 41 variantes únicas (color + accesorio) + `EVIL_MASCOT` para FNF
- `lib/questions.ts` — generador con ventana de "recientes" para evitar repeticiones
- `lib/exam.ts` + `lib/fnf.ts` — generadores específicos
- `lib/audio.ts` — manager de audio (MP3 desde `public/sounds/`); `stopMusic` itera dinámicamente todos los tracks con loop, `stopAll` también corta SFX
- `lib/i18n/messages.ts` + `context.tsx` — diccionario es/en, hook `useI18n()`
- `lib/supabase/{server,client,admin}.ts` — clientes scopeados; admin sólo en server actions
- `lib/admin.ts` — `ADMIN_USERNAME = "dario"` hardcoded
- `proxy.ts` (antes middleware) — refresh de sesión Supabase + redirect a `/login` si no hay user
- `components/Mascot.tsx` — `Character` SVG + `Accessory` switch (32 tipos) + `Mascot` con burbuja + `useRandomMove`
- `components/InstallBanner.tsx` — banner sticky para "Add to Home Screen" cuando no estás en PWA
- `supabase/schema.sql` — tablas `profiles` (id, username, selected_mascot_id) y `progress` (user_id, level_id, score, total, passed, stars) con RLS
- `scripts/{setup-db,seed-user,gen-icons}.ts`

## Reglas de gameplay (no inventar)

- 41 niveles: por cada tabla 1-10 → aprender parte 1 (×1-5), aprender parte 2 (×6-10), 2 mezclas. Nivel 41 = Desafío Final.
- Cada nivel: **14 preguntas, pasa con 12** (constantes en `lib/curriculum.ts`).
- Desde tabla 4 en adelante, las mezclas **excluyen la tabla del 1**. El Desafío Final también.
- Opciones por pregunta crecen con el nivel (lv 1-4: 4, lv 5-8: 6, lv 9+: 8). En `optionsCountForLevel(levelId)`.
- Examen: 20 preguntas, 70% factores ≥ 4, sin tabla del 1, escribís la respuesta, nota 1-10. Se desbloquea al pasar el nivel 29.
- FNF: 5s por pregunta, 4 opciones, ±1 al indicador, gana al ±10. Se desbloquea con último examen ≥ 18 (admin siempre lo ve).
- Mascotas: del nivel 11 al 41 cada una tiene un accesorio único (no se repiten).

## Reglas operativas

- **NO commitear `.env.local`** — `.gitignore` ya cubre `.env*.local`. Las creds reales (Supabase URL, anon key, service_role, POSTGRES_URL, SEED_ADMIN_*) viven sólo ahí.
- **Audio**: si agregás un track nuevo, registralo en el mapa `FILES` de `lib/audio.ts` y `stopMusic`/`stopAll` lo cubren automáticamente (no hardcodear listas).
- **i18n**: nada de strings hardcodeados visibles al usuario en componentes. Todo va por `t("key", vars)`. Si agregás una key, ponela en **es y en** en `lib/i18n/messages.ts`.
- **Niveles / nuevos modos**: si agregás un nivel o modo, los títulos van por `titleKey`/`subtitleKey` con vars, no string literal.
- **Admin actions**: cualquier server action que mute estado de otro usuario tiene que llamar `requireAdmin()` (en `app/admin/actions.ts`) — chequea `username === "dario"` server-side.
- **Mascot variants**: si tocás `MASCOTS` no rompas el mapping `MASCOT[i]` ↔ `level.id = i+1`. El sistema de "desbloquear mascota al pasar nivel N" depende de eso.

## Env vars (todas en `.env.local`, gitignored)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
POSTGRES_URL=
POSTGRES_DB=Multiply
POSTGRES_PASSWORD=
SEED_ADMIN_USERNAME=
SEED_ADMIN_PASSWORD=
```

En Vercel production las primeras 4 están seteadas vía `vercel env`. Las `SEED_*` y `POSTGRES_*` solo se usan en scripts locales.

## Workflow

1. Editar local
2. `npm run dev` para probar
3. `git push origin main` → deploy automático a producción vía la integración Vercel↔GitHub
4. Para preview deploys: `git push origin <otra-rama>` o abrir PR

## Cosas que no son tests

No hay test suite configurada. Verificación = `npm run build` + smoke test manual. Si introducís algo crítico, considerá si vale la pena un mini test.
