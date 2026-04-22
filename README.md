# Multiplay ✖️

App web para que un chico aprenda las tablas de multiplicar — estilo Duolingo — pensada para completar en 3 días.

🌐 **Live**: [multiply-psi.vercel.app](https://multiply-psi.vercel.app)

## Features

- **41 niveles** progresivos. Por cada tabla: aprender parte 1 (× 1-5) → aprender parte 2 (× 6-10) → 2 mezclas de refuerzo → siguiente tabla. Termina con un Desafío Final con todas las tablas.
- **Sistema de mascotas** — 41 personajes únicos (colores + accesorios distintos: anteojos, galera, casco espacial, etc.). Ganás una nueva cada vez que pasás un nivel. Podés elegir cuál mostrar como tu mascota.
- **Racha** de respuestas correctas que persiste entre niveles + mejor racha histórica en el home.
- **Modo Examen** (se desbloquea al pasar el nivel 29) — 20 preguntas escribiendo la respuesta, sin feedback hasta el final, nota del 1 al 10.
- **FNF Battle** (se desbloquea al sacar 18+/20 en el examen) — batalla rápida contra Multi Malvado estilo Friday Night Funkin', con timer de 5s por pregunta y barra de combate.
- **PWA** — instalable en tablet/mobile, ícono propio, pantalla completa sin navegador.
- **Audio** — música de menú, música de juego, música de batalla + SFX de win/lose.
- **Multi idioma** — español (default) e inglés. Detecta el idioma del navegador.
- **Panel admin** — el usuario admin puede cambiar passwords de otros usuarios y resetearles el juego.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) — auth + Postgres con Row Level Security
- [Vercel](https://vercel.com) — hosting + deploy

## Quick start

### 1. Clonar e instalar

```bash
git clone https://github.com/dariobakgit/multiplay.git
cd multiplay
npm install
```

### 2. Crear proyecto en Supabase

1. Crear un proyecto nuevo en [supabase.com/dashboard](https://supabase.com/dashboard).
2. **Settings → API** — copiá `Project URL`, `anon key` y `service_role key`.
3. **Database → Connection string → URI** — copiá la connection string y reemplazá `[YOUR-PASSWORD]` por tu password real.

### 3. Configurar `.env.local`

Creá un archivo `.env.local` en la raíz con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
POSTGRES_URL=postgresql://postgres.XXXX:password@aws-X-XXX.pooler.supabase.com:5432/postgres

# Opcional — si usás scripts/seed-user.ts sin args
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=changeme
```

### 4. Aplicar el schema en la DB

```bash
npm run db:setup
```

Crea las tablas `profiles` y `progress` con RLS policies. Es idempotente, lo podés correr varias veces.

### 5. (Opcional) Crear usuario admin de ejemplo

```bash
npx tsx scripts/seed-user.ts <username> <password>
# o sin args si definiste SEED_ADMIN_USERNAME/SEED_ADMIN_PASSWORD en .env.local
```

Crea un usuario con los 41 niveles pasados y las 41 mascotas desbloqueadas. El username "dario" es admin por default (configurable en [lib/admin.ts](lib/admin.ts)).

### 6. Levantar el dev server

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) y creá tu usuario desde `/signup`.

## Deploy a Vercel

```bash
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add POSTGRES_URL production
npx vercel --prod
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Correr el build |
| `npm run lint` | Lint |
| `npm run db:setup` | Aplica `supabase/schema.sql` sobre `POSTGRES_URL` (idempotente) |
| `npm run icons` | Regenera los PNG del ícono PWA desde `public/icon.svg` |
| `npx tsx scripts/seed-user.ts <user> <pass>` | Crea/resetea un usuario con todo desbloqueado |

## Estructura

```
app/
  (auth)/actions.ts      # login / signup / logout
  admin/                 # panel admin (solo para dario)
  exam/                  # modo examen
  fnf/                   # FNF Battle
  level/[id]/            # gameplay de cada nivel
  library/               # librería de mascotas
  login/ signup/         # auth screens
  page.tsx               # home (mapa de niveles)
components/
  Mascot.tsx             # Character SVG + Accessory variants + Mascot bubble
lib/
  curriculum.ts          # definición de los 41 niveles
  mascots.ts             # 41 variantes + EVIL_MASCOT
  questions.ts           # generador de preguntas multiple choice
  exam.ts exam-state.ts  # lógica + persistencia del examen
  fnf.ts                 # lógica FNF
  audio.ts               # manager de audio (MP3 + HTMLAudioElement)
  streak.ts              # tracking de racha
  progress-db.ts         # CRUD progress + server actions
  i18n/                  # sistema de traducciones (es + en)
  supabase/              # clientes server/browser/admin
public/
  sounds/                # menu.mp3, game.mp3, fnf.mp3, win.mp3, lose.mp3
  icon.svg + icon-*.png  # PWA icons
scripts/
  setup-db.ts            # aplica schema SQL
  seed-user.ts           # crea usuario con todo desbloqueado
  gen-icons.ts           # rasteriza icon.svg → PNG
supabase/schema.sql      # profiles + progress + RLS policies
proxy.ts                 # refresh de sesión Supabase (antes middleware.ts)
```

## Customización

- **Admin username** — [lib/admin.ts](lib/admin.ts) (hardcoded `"dario"`)
- **Cantidad de preguntas / mínimo para pasar** — constantes `Q_COUNT` / `MIN_PASS` en [lib/curriculum.ts](lib/curriculum.ts)
- **Reglas del examen** — [lib/exam.ts](lib/exam.ts) (actualmente: 70% con factores ≥ 4, sin tabla del 1)
- **Mascotas** — array `MASCOTS` en [lib/mascots.ts](lib/mascots.ts)
- **Traducciones** — [lib/i18n/messages.ts](lib/i18n/messages.ts)

## License

MIT. Hecho con ❤️ para mi hijo.
