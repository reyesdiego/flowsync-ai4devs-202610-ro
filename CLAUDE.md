# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este repo

FlowSync es el proyecto de ejercicio de un curso (LIDR, cohorte 202610-ro). Monorepo sin workspaces con dos apps independientes, TypeScript de punta a punta:

- `backend/`: API REST en **AdonisJS 7** (Lucid + SQLite, VineJS, auth por access tokens).
- `frontend/`: **React 19 + Vite**, todavía la plantilla por defecto de Vite. El curso prevé usar **shadcn/ui** (componentes copiados al repo, no dependencia), aún sin instalar.

El backend ya existe y en el ejercicio de la sesión 1 **no se modifica**: el trabajo es en el frontend. `README.md` es generado desde la lección del curso ("no se edita a mano"); `prompts.md` es una plantilla que rellena el alumno.

Requiere **Node.js 24+** (con versiones anteriores falla con `Unknown file extension ".ts"`).

## Comandos

Backend (`cd backend`):

```bash
npm install
cp .env.example .env && node ace generate:key   # primera vez
node ace migration:run                           # crea tmp/db.sqlite3 y regenera database/schema.ts
npm run dev          # node ace serve --hmr → http://localhost:3333
npm test             # node ace test (Japa)
node ace test --files tests/functional/foo.spec.ts   # un solo archivo
node ace test functional                         # una sola suite (unit | functional)
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run format       # prettier (@adonisjs/prettier-config)
```

Frontend (`cd frontend`, en otra terminal):

```bash
npm install
npm run dev          # Vite → http://localhost:5173
npm run build        # tsc -b && vite build
npm run lint         # oxlint
```

El frontend no tiene formateador ni tests configurados. Tampoco hay proxy en Vite: el frontend llama directamente a `http://localhost:3333` (CORS en dev acepta cualquier origen, `config/cors.ts`).

Aún no existen tests en el backend (`tests/` solo tiene `bootstrap.ts`); las suites esperan `tests/unit/**/*.spec.ts` y `tests/functional/**/*.spec.ts`. Los tests usan `.env.test` (`SESSION_DRIVER=memory`).

## Arquitectura del backend

Flujo de una petición: `start/routes.ts` → controlador (`app/controllers`) → validador VineJS (`app/validators`) → modelo Lucid (`app/models`) → transformer (`app/transformers`) → `ctx.serialize(...)`.

Piezas que no se ven leyendo un solo archivo:

- **Imports con alias** `#controllers/*`, `#models/*`, `#validators/*`, etc. (definidos en `backend/package.json` → `imports`). Úsalos en vez de rutas relativas.
- **Controladores en rutas** se referencian vía `controllers.X` de `#generated/controllers`, generado en `.adonisjs/server/` por el hook `indexEntities` de `adonisrc.ts`. Lo mismo `.adonisjs/client/` (registry de rutas tipadas de Tuyau, exportado como `backend/registry`). No editar `.adonisjs/` a mano; se regenera al arrancar el servidor.
- **Modelos sobre esquema generado**: `database/schema.ts` lo genera `migration:run` a partir de las migraciones (no editar). Los modelos extienden esas clases (`User extends compose(UserSchema, withAuthFinder(hash))`). Para cambiar el esquema: nueva migration en `database/migrations/`, nunca editar una existente ni la tabla a mano.
- **Respuestas envueltas en `data`**: `providers/api_provider.ts` añade `ctx.serialize()`, que envuelve todo en `{ data: ... }`. Los transformers deciden qué campos se exponen (p. ej. `UserTransformer` omite `password` e incluye el getter `initials`).
- **Respuestas siempre JSON**: `force_json_response_middleware` fuerza `Accept: application/json`, así que los errores (validación, credenciales, auth) llegan como JSON del exception handler por defecto.
- **Auth**: guard por defecto `api` (access tokens con prefijo `oat_`, tabla `auth_access_tokens`). El cliente envía `Authorization: Bearer <token>`. El middleware nombrado `auth` protege el grupo `/account`.

### Contrato de la API (`/api/v1`)

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| POST | `/auth/signup` | no | `email`, `password` (8-32), `passwordConfirmation` (igual a `password`), `fullName` (opcional, nullable) | `{ data: { user, token } }` |
| POST | `/auth/login` | no | `email`, `password` | `{ data: { user, token } }` |
| GET | `/account/profile` | sí | — | `{ data: user }` |
| POST | `/account/logout` | sí | — | `{ message }` (sin envolver) |

Ojo: el signup exige `passwordConfirmation`, y el email debe ser único (falla la validación si ya existe). Fuente de verdad: `app/validators/user.ts`.

## Reglas de proceso

Obligatorias en cualquier tarea que toque código:

1. **Rama nueva antes de tocar código.** Nunca trabajes sobre `main`, `s1/start` ni la rama de partida: crea una desde ella (`git checkout -b feat/<clave-ticket>-<slug>`, o `fix/…`, `refactor/…`). Anota cuál es la rama de partida: es la base del PR.
2. **Al cerrar, `/commit`.** Prepara solo los archivos de la tarea (`git add <rutas>`, nunca `git add -A`) y crea el commit con la skill `/commit`.
3. **Pull request con `gh pr create`.** Empuja la rama a `origin` y abre el PR contra el fork propio (`origin`), nunca contra `upstream` (el repo del curso):

   ```bash
   gh pr create --repo "$(git remote get-url origin | sed -E 's#^.*github\.com[:/]##; s#\.git$##')" --base <rama-de-partida>
   ```

   Título en formato convencional; en el cuerpo, qué cambia, cómo se verificó y la clave del ticket.
4. **Revisión con el subagente `adversarial-reviewer`** sobre el PR recién abierto. Si devuelve bloqueantes, corrígelos, commitea de nuevo con `/commit`, empuja y repite la revisión.
5. **En el chat, solo la URL del pull request.** Ni resumen de cambios ni resultado de la revisión: el detalle va en el PR.
