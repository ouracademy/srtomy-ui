---
description: "Task list for 017-ai-assistant-chat"
---

# Tasks: Asistente de IA en el portal y agente unificado

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/chat.md](./contracts/chat.md), [quickstart.md](./quickstart.md)

**Tests**: obligatorios. Las reglas de srtomy-ui y srtomy-agent piden pruebas con cada cambio y, para lo que toca seguridad (firma, permisos, confirmación), la prueba del camino de rechazo. Ninguna prueba llama a la red (ni a Anthropic, ni a Kapso, ni a srtomy-api, ni a LangSmith).

**Organización**: por PR apilado (tabla «PRs apilados» del plan) y por repo. Dos sesiones trabajan en paralelo: **sesión agente** (srtomy-agent y el Terraform de srtomy-api) y **sesión UI** (srtomy-ui). Cada PR tiene como base el anterior de su pila.

**Rutas**: relativas a la raíz de cada repo; el repo va al inicio de cada sección.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otros archivos, sin dependencias pendientes).
- **[US1]** consultar desde el portal, **[US2]** acciones con confirmación, **[US3]** WhatsApp igual, **[US4]** sugerencias y contexto.

---

## PR 0 — Base (hecho en esta sesión)

- [x] T001 srtomy-api: descripciones de operaciones, parámetros y campos desde el Javadoc, `OpenApiDocumentationTests` y `OpenApiTextCustomizer` en `src/main/java/org/ouracademy/ovejafiel/shared/` (rama `ccr-e703f55f-lo650n`)
- [x] T002 srtomy-agent (Python): la descripción de cada parámetro llega a la herramienta en `src/srtomy_agent/tools/openapi.py` (rama `ccr-e703f55f-lo650n`)
- [x] T003 srtomy-ui: spec, plan, research, data-model, contrato, quickstart y estas tareas en `specs/017-ai-assistant-chat/`; sección del asistente (Claude, de Anthropic) en `app/privacy-policy/content.ts`; trabajo futuro en `docs/tech-debt-and-future-work.md` (rama `ccr-e703f55f-lo650n`)

---

## PR 1 — srtomy-agent `ccr-e703f55f-lo650n-ts` (base `ccr-e703f55f-lo650n`) · sesión agente

**Objetivo**: el agente en TypeScript hace exactamente lo que hace hoy el de Python por WhatsApp. Al final del PR se borra el Python y el despliegue usa Node.

### Setup

- [ ] T004 Crear el proyecto Node 22 + TypeScript 6 `strict` con pnpm: `package.json` (scripts `dev`, `build`, `start`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:coverage`, `check:fast`, `eval`), `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts` (umbral de cobertura 80 %), `.nvmrc`
- [ ] T005 [P] Instalar las últimas versiones de `ai`, `@ai-sdk/anthropic`, `@ai-sdk/google-vertex`, `hono`, `@hono/node-server`, `jose`, `pg`, `zod`, `google-auth-library`, `langsmith`; dev: `vitest`, `@vitest/coverage-v8`, `typescript`, `eslint`, `prettier`, `tsx`
- [ ] T006 [P] Hooks de git con husky + commitlint (Conventional Commits) y `pre-push` con `pnpm check:fast`; reemplazar `.pre-commit-config.yaml`
- [ ] T007 [P] Reemplazar `.claude/hooks/format-on-edit.sh` (hoy ruff) por Prettier + ESLint `--fix`
- [ ] T008 [P] `src/config.ts`: leer con zod las mismas variables que `src/srtomy_agent/config.py` (todas opcionales; la parte que falta se niega, no adivina) más `TOOL_APPROVAL_SECRET`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `CORS_ORIGINS`; con `src/config.test.ts`
- [ ] T009 [P] `.env.example` con todas las variables y `docker-compose.yml` sin cambios

### Fundamentos (bloquean todo lo demás)

- [ ] T010 [P] `src/privacy.ts` + `src/privacy.test.ts`: `redact` de teléfonos, correos, tokens y códigos de vinculación (portar `privacy.py` y sus casos)
- [ ] T011 [P] `src/tools/openapi.ts` + test: un `dynamicTool` por operación con `jsonSchema` (parámetros de ruta y consulta con su descripción, y `body` con `$ref` resueltos hasta 6 niveles), nombre `<método>_<ruta>` como en Python, exclusión de `/v1/internal/**`, `/v1/webhooks/**` y de la administración del WhatsApp (`_is_whatsapp_admin`), riesgo por método (GET read, DELETE destructive, resto write); portar todos los casos de `tests/test_openapi_tools.py`, incluido «toda herramienta de la API real tiene descripción»
- [ ] T012 [P] `src/tools/access.ts` + test: `toolsFor(channel, tier)`: WhatsApp `public` → solo `PUBLIC_READS` (lista explícita, como hoy); WhatsApp `member` y portal → todo menos `/v1/public/**` y menos `SENSITIVE` (dar o quitar propietarios, borrar un nodo); pruebas del rechazo (un GET público nuevo no aparece para desconocidos; una sensible no aparece en el portal)
- [ ] T013 `src/tools/search.ts` + test: `CORE` (lista explícita: `get_me_organizations`, `get_me_permissions`, `get_people`, `get_events`, `get_events_id`, `get_events_id_attendance`) sin `deferLoading`; el resto con `deferLoading: true` detrás de `toolSearch({ search })` con búsqueda propia por palabras sobre nombre, descripción, etiqueta y sinónimos en español (`evento/curso → events`, `persona/miembro/visitante → people`, `cargo → positions`, `sede/grupo/ministerio → organizations`, `asistencia → attendance`, `inscripción/entrada → registration`, `invitación → invitations`); pruebas: «cerrar inscripciones» encuentra `put_events_id_registration_open`; una herramienta que no está en `toolsFor` nunca se devuelve
- [ ] T014 [P] `src/api-client.ts` + test (con `fetch` inyectado): `identity`, `link`, `optIn`, `optOut` con el ID token de Google; `call(tool, input, token)` que arma ruta, consulta y cuerpo, traduce 403 y 404 a mensajes en español y recorta el resultado a 4 000 caracteres con «… (recortado)»; portar `tests/test_api_client.py`
- [ ] T015 [P] `src/google-id-token.ts` + test: ID token para la audiencia interna, en caché 45 minutos (portar de `wiring.py`)
- [ ] T016 `src/agent.ts` + test con `MockLanguageModelV4` de `ai/test`: `ToolLoopAgent` con instrucciones de `src/prompt.ts`, herramientas de T011–T013, token por `toolsContext` (nunca en mensajes ni en telemetría), `stopWhen: isStepCount(8)`, tope de salida de 1024 tokens y `toolApproval` (lecturas: se ejecutan; resto: `user-approval` con `reason` de `src/tools/describe.ts`); pruebas: el token no aparece en ningún mensaje ni en lo que recibe el modelo; una escritura nunca se ejecuta en la misma llamada que la pide
- [ ] T017 [P] `src/prompt.ts` + test: instrucciones comunes y de WhatsApp portadas de `system_prompt` en `graph.py` (desconocido, con cuenta sin vincular, identificado); «no reintentes una acción cancelada»
- [ ] T018 [P] `src/tools/describe.ts` + test: la acción en palabras para la tarjeta y para «Voy a hacer esto…»: verbo por método (Crear, Cambiar, Eliminar), recurso en español por etiqueta, datos de la llamada con etiquetas en español para los campos comunes (`name` Nombre, `startTime` Inicio, `firstName` Nombres…); nunca lo redacta el modelo
- [ ] T019 [P] `src/telemetry.ts` + test: LangSmith con `langsmith/experimental/vercel` y el anonimizador de `langsmith/anonymizer` con las reglas de `privacy.ts`; apagado salvo `LANGSMITH_TRACING=true` y `LANGSMITH_API_KEY`; metadatos: canal, nivel e iglesia; prueba de redacción de cada campo que va a la traza

### US3 — WhatsApp igual que hoy

- [ ] T020 [P] [US3] `src/kapso/signature.ts`, `src/kapso/webhook.ts`, `src/kapso/client.ts` + tests: firma contra el cuerpo crudo, sin secreto se rechaza todo con 401, lotes, deduplicación por `X-Idempotency-Key`, registro de por qué Kapso rechaza un mensaje sin datos personales (portar `test_signature.py`, `test_webhook.py`, `test_kapso_client.py`)
- [ ] T021 [P] [US3] `src/whatsapp/commands.ts` + test: STOP, BAJA, ALTA y VINCULAR sobre el mensaje entero (portar `test_commands.py`)
- [ ] T022 [P] [US3] `src/whatsapp/identity.ts` + test: estados `LINKED`, `CHURCH_NOT_CONNECTED`, `AGENT_PAUSED`, `UNKNOWN`, `AMBIGUOUS`, `NEEDS_VERIFICATION` → nivel o silencio (portar `test_identity_tiers.py`, con `AGENT_PAUSED` callado)
- [ ] T023 [P] [US3] `src/whatsapp/confirm.ts` + test: `isYes` con las palabras exactas de hoy y 👍 👌; «sí, pero cambia la fecha» es no; texto «Voy a hacer esto: … ¿Confirmas? Responde SÍ o NO.»
- [ ] T024 [P] [US3] `src/whatsapp/seen.ts` + test: interfaz `SeenStore` (memoria y Postgres, tabla `seen_key`: «`key` text, clave primaria»; «`seen_at` timestamptz»; limpieza a las 24 h); «visto y marcar» en un solo `insert … on conflict do nothing` (portar `test_seen.py`)
- [ ] T025 [US3] `src/whatsapp/conversation.ts` + test: interfaz con memoria y Postgres, tabla `conversation` («`thread_id` text, clave primaria: hash del número de la iglesia y del remitente; nunca el teléfono», «`messages` jsonb: como mucho los últimos 20 turnos», «`updated_at` timestamptz»); leer y guardar con `select … for update`; el token nunca se guarda
- [ ] T026 [US3] `src/whatsapp/service.ts` + test: deduplicar → comandos → identidad (pausado o iglesia no conectada: silencio) → agente → Kapso; si el hilo termina en una aprobación pendiente, el mensaje es la respuesta (`isYes` aprueba, cualquier otra cosa niega) y luego se continúa; nunca lanza (responde «Tuve un problema…»); portar todos los casos de `tests/test_service.py`, incluido «se ejecuta una sola vez tras reiniciar» con Postgres
- [ ] T027 [US3] `src/main.ts` + test con `app.request()`: Hono con `/health` y `POST /webhooks/kapso` (responde antes de pensar; el trabajo sigue después); arma todo desde `config.ts` (portar `test_wiring.py` y la parte de `main.py`)

### Cierre del PR 1

- [ ] T028 [US3] `scripts/check.sh` y `.github/workflows/ci.yml`: `pnpm check:fast` con Postgres como servicio; `.github/workflows/deploy-dev.yml` con el buildpack de Node (`Procfile`: `web: node dist/main.js`) y despliegue a una revisión **sin tráfico**
- [ ] T029 [US3] Borrar `src/srtomy_agent/`, `tests/*.py`, `pyproject.toml`, `uv.lock`, `.python-version`; anotar en `docs/tech-debt-and-future-work.md` de srtomy-ui (deuda 32) que las tablas `checkpoints*` quedan sin uso y que borrarlas lo decide el dueño
- [ ] T030 [US3] Reescribir `README.md` y `AGENTS.md` de srtomy-agent para TypeScript (mismas reglas de arquitectura; herramientas por búsqueda; LangSmith)

---

## PR 2 — srtomy-agent `ccr-e703f55f-lo650n-chat` (base `-ts`) · sesión agente

**Objetivo**: `POST /chat` responde preguntas del portal con el token del usuario. Toda escritura se niega automáticamente en este PR.

- [ ] T031 [P] [US1] `src/chat/auth.ts` + test: verificar el JWT de Auth0 con `jose` y el JWKS del tenant (emisor `https://${AUTH0_DOMAIN}/`, audiencia `AUTH0_AUDIENCE`); rechazo sin token, vencido, de otro emisor y de otra audiencia
- [ ] T032 [P] [US1] `src/rate-limit.ts` + test: interfaz con implementación en memoria, ventana por usuario (`sub`); 429 con `Retry-After`
- [ ] T033 [US1] `src/chat/route.ts` + test: cuerpo con zod según `contracts/chat.md` (`messages`, `context.nodeId` obligatorio; `eventId`, `personId`, `timeZone` opcionales; 422 si no cumple); leer el nombre del nodo de srtomy-api con el token (403/404 → se rechaza); instrucciones del portal en `src/prompt.ts` (nombre del usuario, nodo con id y nombre, fecha y zona de hoy, texto plano); `toolApproval` que niega toda escritura con `reason` «Por ahora el asistente del portal solo consulta»; respuesta con el stream de mensajes de UI del SDK; 503 sin llave del modelo
- [ ] T034 [P] [US1] CORS en `src/main.ts` solo para `CORS_ORIGINS`, con `Authorization` permitido y sin cookies; test de un origen no permitido
- [ ] T035 [US1] Test: el texto de la conversación no aparece en los logs y el servidor no guarda nada
- [ ] T036 srtomy-api (rama `ccr-e703f55f-lo650n-agent-infra`, base `ccr-e703f55f-lo650n`): en `infra/terraform/modules/agent`, el secreto `agent-tool-approval-secret`, las variables `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` y `CORS_ORIGINS` del servicio, y acceso público de Cloud Run para `/chat` (la autenticación la hace el agente)

---

## PR 3 — srtomy-ui `ccr-e703f55f-lo650n-panel` (base `ccr-e703f55f-lo650n`) · sesión UI

**Objetivo**: el panel del asistente, solo lecturas (US1) y sugerencias (US4). Puede empezar sin esperar al PR 2: las pruebas simulan `POST /chat`.

- [x] T037 [US1] Instalar las últimas `ai` y `@ai-sdk/react`; `NEXT_PUBLIC_AGENT_URL` opcional en `app/env.ts` con su prueba en `app/env.test.ts`; documentar en `README.md` y `.env.example`
- [x] T038 [US1] `app/(api)/assistant.ts` + test: `DefaultChatTransport` hacia `${NEXT_PUBLIC_AGENT_URL}/chat` con `authorization` del mismo proveedor de token que `app/(api)/client.ts` (exportar un `getAccessToken` desde allí) y el contexto de pantalla en el cuerpo
- [x] T039 [P] [US4] `app/portal/assistant/screenContext.ts` + test: `nodeId`, `eventId` y `personId` a partir de la ruta `/portal/[nodeId]/...`; `timeZone` del navegador
- [x] T040 [US1] `app/portal/assistant/useAssistant.ts` + test: `useChat` con el transporte, el contexto actual en cada envío, «Conversación nueva», manejo de 401 (pedir iniciar sesión sin perder lo escrito), 429 (deshabilitar enviar hasta `Retry-After`) y error con reintento
- [x] T041 [P] [US1] `app/portal/assistant/MessageList.tsx` + test: mensajes en texto plano con saltos de línea, «Consultando eventos…» con el nombre del recurso en español mientras una herramienta corre, región viva `aria-live="polite"` para la respuesta nueva
- [x] T042 [P] [US4] `app/portal/assistant/suggestions.ts` + test: 3 o 4 sugerencias según la pantalla y los permisos (`useMyPermissions` existente); ninguna sobre algo que el usuario no puede hacer
- [x] T043 [US1] `app/portal/assistant/AssistantPanel.tsx` + test (user-event): `Drawer` a la derecha, pantalla completa en móvil; campo de texto con etiqueta, enviar con Enter, botón «Detener» mientras responde, «Conversación nueva», estados vacío (sugerencias), cargando, error y sesión vencida; foco al campo al abrir y de vuelta al botón al cerrar
- [x] T044 [US1] `app/portal/assistant/AssistantButton.tsx` + test: botón flotante con nombre accesible «Abrir asistente»; montado en `app/portal/PortalProviders.tsx` solo con `NEXT_PUBLIC_AGENT_URL`; la conversación se conserva al navegar dentro del portal y se borra al cerrar sesión
- [x] T045 [US1] `tests/assistant.spec.ts` (Playwright): interceptar `POST /chat` con un stream grabado; preguntar y ver la respuesta progresiva; error con reintento; `tests/a11y.spec.ts` con el panel abierto sin infracciones serias o críticas
- [x] T046 [US1] `docs/architecture.md`: el asistente como segundo backend y por qué su transporte vive en `app/(api)/assistant.ts`

---

## PR 4a — srtomy-agent `ccr-e703f55f-lo650n-approvals` (base `-chat`) · sesión agente

**Objetivo**: el portal también cambia datos, siempre con confirmación firmada (US2).

- [ ] T047 [US2] `src/chat/route.ts`: `toolApproval` = `user-approval` con `reason` de `describe.ts` para toda escritura y eliminación, y `experimental_toolApprovalSecret` = `TOOL_APPROVAL_SECRET` (sin secreto, el portal sigue en solo lectura)
- [ ] T048 [US2] Tests del camino de rechazo: aprobación sin firma, con firma de otra acción, con los datos cambiados después de firmar y con otro id de llamada → no se ejecuta y el stream lo informa; una aprobación válida ejecuta una sola vez
- [ ] T049 [US2] Test: con dos escrituras en un mismo paso, cada una pide su propia aprobación; una eliminación lleva la marca de que no se puede deshacer en su `reason`
- [ ] T050 [US2] Test: 403 de srtomy-api tras confirmar se explica como falta de permiso

## PR 4b — srtomy-ui `ccr-e703f55f-lo650n-approvals` (base `-panel`) · sesión UI

- [ ] T051 [US2] `app/portal/assistant/ApprovalCard.tsx` + test (user-event): muestra `approval.requestReason` y los datos principales de `input`; «Confirmar» y «Cancelar» con `addToolApprovalResponse`; una eliminación con color de peligro y «No se puede deshacer»; botones con spinner y bloqueados mientras se envía (skill `api-submit-button`)
- [ ] T052 [US2] `useAssistant.ts`: `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses`; enviar un mensaje nuevo con una aprobación pendiente la responde antes con «no»; al terminar bien una herramienta que escribe, revalidar SWR (`mutate` global) para que las pantallas muestren el cambio; con tests
- [ ] T053 [US2] `tests/assistant.spec.ts`: pedir crear un evento → tarjeta → «Confirmar» → la llamada sale y el calendario se revalida; «Cancelar» → no sale ninguna escritura

---

## PR 5 — srtomy-agent `ccr-e703f55f-lo650n-evals` (base `-ts`) · sesión agente

**Objetivo**: medir si el asistente elige bien (SC-003) antes de cambiar instrucciones, descripciones o herramientas. Puede ir en paralelo a los PR 2 a 4.

- [ ] T054 [P] `evals/cases.ts`: unas 30 preguntas en español (Perú) por canal y nivel, cada una con la operación esperada, los argumentos clave y si debe pedir confirmación; incluir preguntas que solo se resuelven con la búsqueda
- [ ] T055 [P] `evals/fake-api.ts`: srtomy-api simulada con respuestas fijas (sin red salvo Anthropic y LangSmith)
- [ ] T056 `evals/agent.eval.ts` con `langsmith/vitest`: dataset `srtomy-agent-es`; evaluadores de código (operación correcta, confirmación antes de escribir, la búsqueda la encontró) y un juez con Claude para español y tono; `pnpm eval` con su propio `vitest.eval.config.ts`, fuera del CI
- [ ] T057 Comparar en LangSmith núcleo + búsqueda contra todas las herramientas y anotar el resultado en `specs/017-ai-assistant-chat/research.md` de srtomy-ui (sección 6)

---

## Final — Pulido y retiro

- [ ] T058 Probar con la iglesia piloto la revisión sin tráfico del PR 1 (quickstart, sección 4) y pasar el tráfico; sin incidentes, el PR 1 queda cerrado (FR-016)
- [ ] T059 [P] Revisar con el dueño la política de privacidad antes de activar LangSmith con iglesias reales (región y retención)
- [ ] T060 [P] Correr `quickstart.md` completo y marcar en `spec.md` el estado «Implementado»

---

## Dependencias

```text
PR 0 ──▶ PR 1 (agente TS, WhatsApp) ──▶ PR 2 (/chat lecturas) ──▶ PR 4a (aprobaciones servidor)
  │                    └──────────────▶ PR 5 (evals)
  └──▶ PR 3 (panel UI, con /chat simulado) ──▶ PR 4b (tarjeta UI)
```

- PR 3 no espera al PR 2: el contrato está en `contracts/chat.md` y las pruebas lo simulan. Para probarlo de punta a punta sí hace falta el PR 2 desplegado.
- PR 4b necesita el formato de aprobación del PR 4a solo para la prueba manual; las pruebas automáticas lo simulan.
- Dentro del PR 1: T004–T009 → T010–T019 → T020–T027 → T028–T030.

## Paralelismo

- **Sesión agente** y **sesión UI** trabajan a la vez desde el primer día.
- En el PR 1, todo lo marcado [P] de Fundamentos y de US3 son archivos distintos sin dependencias entre sí.
- PR 5 puede empezar en cuanto el PR 1 tiene `agent.ts` (T016).

## Estrategia

1. **MVP**: PR 1 + PR 2 + PR 3 → el chat del portal responde preguntas (US1) y WhatsApp no cambió (US3).
2. Después PR 4a + 4b → acciones con confirmación (US2).
3. PR 5 en paralelo, para decidir con datos el núcleo y la búsqueda.
4. Cada PR deja todo en verde (`pnpm check:fast` / `scripts/check.sh`) y se puede publicar solo.
