# Sr. Tommy UI

Un sistema para iglesias: registro de personas, sedes, grupos y ministerios, y eventos y cursos con toma de asistencia.

Este repositorio es el frontend. Consume la API [srtomy-api](https://github.com/ouracademy/srtomy-api) y autentica con Auth0.

## Stack

| Capa               | Tecnología                                                          |
| ------------------ | ------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router, Turbopack) y React 19                       |
| Lenguaje           | TypeScript 6 en modo `strict`                                       |
| UI                 | MUI 7 y MUI X (DataGrid, DatePickers), FullCalendar                 |
| Datos              | SWR para lecturas, axios para escrituras                            |
| Formularios        | react-hook-form y zod                                               |
| Autenticación      | Auth0 (`@auth0/auth0-react`)                                        |
| Páginas de landing | Builder.io (en proceso de retiro)                                   |
| Pruebas            | Vitest y Testing Library (unitarias), Playwright y axe (e2e y a11y) |

## Puesta en marcha

Requiere Node >= 22 y pnpm (ver `.nvmrc` y `packageManager`).

```sh
nvm use
corepack enable   # o: npm i -g pnpm
pnpm install
cp .env.example .env.local   # y completa los valores (pídelos al equipo)
pnpm dev
```

La app queda en <http://localhost:3000>.

### Variables de entorno

Todas son públicas (`NEXT_PUBLIC_*`): Next las incrusta en el bundle **al compilar**, así que cambiarlas exige volver a compilar. `app/env.ts` las valida con zod y la app falla al arrancar, nombrando la variable, si falta una obligatoria.

| Variable                      | Obligatoria | Para qué sirve                                                                                     |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`         | Sí          | Origen de srtomy-api (sin `/v1`; el cliente lo agrega).                                            |
| `NEXT_PUBLIC_AUTH0_DOMAIN`    | Sí          | Dominio del tenant de Auth0.                                                                       |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | Sí          | Client ID de la aplicación SPA en Auth0.                                                           |
| `NEXT_PUBLIC_AUTH0_AUDIENCE`  | No          | Audience de la API; sin él Auth0 no emite un token para srtomy-api.                                |
| `NEXT_PUBLIC_BUILDER_API_KEY` | Sí\*        | Key de Builder.io. \*Las páginas de landing, políticas y términos la usan; sin ella responden 404. |
| `NEXT_PUBLIC_CULQI_API_KEY`   | No          | Llave pública de Culqi (pagos, aún no conectados al backend).                                      |

Solo `.env.example` se versiona. `.env` y `.env.local` están en `.gitignore`.

## Scripts

| Comando              | Qué hace                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`           | Servidor de desarrollo.                                                                                      |
| `pnpm build`         | Compilación de producción (`pnpm start` la sirve).                                                           |
| `pnpm check:fast`    | Tipos, lint, formato y pruebas unitarias. **Córrelo antes de terminar.**                                     |
| `pnpm typecheck`     | `tsc --noEmit`.                                                                                              |
| `pnpm lint`          | ESLint (config plana en `eslint.config.mjs`).                                                                |
| `pnpm format`        | Prettier sobre todo el repo (`format:check` solo verifica).                                                  |
| `pnpm test`          | Pruebas unitarias (Vitest).                                                                                  |
| `pnpm test:coverage` | Igual, con cobertura y umbral del 80 %.                                                                      |
| `pnpm test:e2e`      | Playwright (ver abajo).                                                                                      |
| `pnpm analyze`       | Analizador de bundles de Next (interactivo, solo Turbopack).                                                 |
| `pnpm api:sync`      | Descarga la especificación de srtomy-api a `app/(api)/openapi/`.                                             |
| `pnpm api:generate`  | Regenera el cliente de `app/(api)/generated/` (lo hacen solos `dev`, `build`, `test`, `lint` y `typecheck`). |

## Generación de la API

El cliente HTTP y sus tipos **se generan** desde la especificación OpenAPI de srtomy-api, no se escriben a mano.

- `app/(api)/openapi/srtomy-api.json` es la fuente, y va versionada. Cuando cambie la API, actualízala con `pnpm api:sync` (por defecto desde `http://localhost:8080/v3/api-docs`; con `API_DOCS_URL` y `API_DOCS_TOKEN` se usa otra URL o un token). El diff del JSON va en el PR.
- `app/(api)/generated/` lo produce `pnpm api:generate` con orval. **No se versiona ni se edita.** No tienes que acordarte de ejecutarlo: `pnpm install`, `dev`, `build`, `test`, `lint` y `typecheck` lo regeneran.
- Lo escrito a mano es `app/(api)/client.ts` (token, fechas y el mutator que usa lo generado).

## Pruebas

- **Unitarias** (`*.test.ts(x)` junto al código): lógica pura, hooks y la capa de API. La cobertura se mide sobre los módulos que cargan las pruebas.
- **e2e y accesibilidad** (`tests/`): Playwright contra el servidor de desarrollo. No usan Auth0 ni backend reales: `tests/fixtures.ts` simula el login y cada prueba intercepta las llamadas a la API. `tests/a11y.spec.ts` corre axe (WCAG A y AA, impacto serio o crítico).
  - Necesitan `NEXT_PUBLIC_BUILDER_API_KEY` (de `.env.local`, o del entorno `dev` en CI).
  - Si ya tienes `pnpm dev` en el puerto 3000, corre `E2E_PORT=3100 pnpm test:e2e` para que las pruebas levanten su propio servidor en lugar de reutilizar el tuyo (que usa valores reales).

## Estructura

```
app/
  (api)/          cliente HTTP, servicios por recurso y tipos de la API
  (components)/   componentes compartidos entre pantallas
  portal/         área autenticada: /portal/[locId]/{person,location,event}
  footer/ header/ landing y legales (Builder)
tests/            e2e (Playwright)
.specify/         constitución y plantillas de spec-kit
```

Guías para escribir código:

- [docs/architecture.md](docs/architecture.md): dónde va cada cosa, cómo se leen y escriben datos, autenticación, manejo de errores y deuda conocida.
- [docs/code-style.md](docs/code-style.md): convenciones de código, componentes, estado, accesibilidad y pruebas.

## Integración continua

Cada push y PR ejecuta (`.github/workflows`):

- **commits**: mensajes en Conventional Commits (commitlint).
- **tipos, lint, formato**: `pnpm check:fast` y la cobertura mínima.
- **build**: `pnpm build` con valores falsos de entorno.
- **pnpm audit**: vulnerabilidades en dependencias de producción.
- **Playwright**: e2e en Chromium (solo para ramas de este repo; usa el entorno `dev` de GitHub).
- **SonarCloud**: análisis de calidad; el Quality Gate exige calificación A en confiabilidad del código nuevo.

Las acciones de GitHub están fijadas por SHA con un comentario de versión; Dependabot las actualiza junto con las dependencias npm (agrupadas, semanalmente).

## Despliegue

Se despliega en **Vercel**, con integración directa con Git: cada push a `main` publica a producción. La configuración vive en Vercel, no en este repositorio (no hay `vercel.json`).

- Las variables `NEXT_PUBLIC_*` se fijan en el **build**; se administran en Vercel (_Settings > Environment Variables_) y hay que definirlas para cada entorno que se use. Si falta una obligatoria, el build falla nombrando la variable (`app/env.ts`).
- En Auth0, la aplicación debe permitir como _Allowed Callback URLs_ `<origen>/portal` y como _Allowed Logout URLs_ y _Web Origins_ el `<origen>` de cada entorno.
- srtomy-api debe permitir en CORS el origen de cada entorno.
- El CI de GitHub valida el código (tipos, pruebas, build); **no** despliega. Que un PR esté en verde no significa que esté publicado.

## Convenciones

Las reglas del proyecto están en [AGENTS.md](AGENTS.md) y en la [constitución](.specify/memory/constitution.md). En resumen: ramas y PR (nunca push a `main`), Conventional Commits en minúsculas, código e identificadores en inglés y textos de la interfaz en español, y `pnpm check:fast` en verde.
