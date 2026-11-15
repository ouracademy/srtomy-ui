# Implementation Plan: Asistente de IA en el portal y agente unificado

**Branch**: `ai-assistant-chat` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-ai-assistant-chat/spec.md`

## Summary

srtomy-agent se reescribe de Python + LangGraph a **TypeScript + Vercel AI SDK 7** y pasa a tener dos entradas: el webhook de Kapso (WhatsApp, sin cambios para el miembro) y `POST /chat`, que el portal consume con `useChat`. Las herramientas se siguen generando del OpenAPI de srtomy-api, que desde esta entrega describe cada operación, parámetro y campo. La regla «nada cambia datos sin confirmación» deja de ser código propio (el `interrupt` del grafo) y pasa a ser la **aprobación de herramientas** del SDK, firmada por el servidor. En srtomy-ui se agrega un panel de chat en el portal.

## Estado

Este documento es solo el plan; **la reescritura y el chat no están empezados**. Lo que sí quedó hecho, en la rama `ccr-e703f55f-lo650n` de cada repo y sin PR:

| Repo                  | Qué                                                                                                                                                                                                                                | Estado                                                                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| srtomy-api            | Javadoc → OpenAPI (`therapi-runtime-javadoc`), descripciones de las 95 operaciones para personas, sus parámetros y los campos de petición, `OpenApiDocumentationTests`, `OpenApiTextCustomizer` y la regla en `docs/code-style.md` | Commit local, verificado con la suite completa (1262 pruebas) **antes** de rebasar sobre `main`. Tras el rebase falta: describir `PUT /v1/organizations/{id}/whatsapp/agent` (el Javadoc quedó escrito sin commit) y volver a correr `./mvnw verify`. |
| srtomy-agent (Python) | La descripción de cada parámetro llega a la herramienta y se usa la descripción completa de la operación                                                                                                                           | Commit local con sus pruebas en verde, **sin rebasar** sobre `main` (chocará en `openapi/srtomy-api.json` y `tests/test_openapi_tools.py`).                                                                                                           |
| srtomy-ui             | Esta spec y este plan                                                                                                                                                                                                              | La especificación sincronizada (`app/(api)/openapi/srtomy-api.json`) no se incluyó: hay que regenerarla desde la API ya rebasada.                                                                                                                     |

Siguiente paso tras revisar este plan: `/speckit-tasks`.

### Lo que cambió en `main` mientras se escribía (PR de pausar el asistente)

- **Pausa del asistente**: srtomy-api responde `AGENT_PAUSED` a la identidad y el agente calla. El agente nuevo debe portar ese estado y su prueba. La pausa es del WhatsApp de la iglesia; el chat del portal no se pausa con ella (supuesto a confirmar por el dueño).
- **El asistente no administra su propio WhatsApp**: `/v1/organizations/{id}/whatsapp/**` ya quedó fuera de las herramientas (`_is_whatsapp_admin`). Es el primer elemento de la lista de operaciones sensibles de FR-012; se porta tal cual, con su prueba.
- **Kapso**: el cliente ahora registra por qué Kapso rechaza un mensaje (sin datos personales); se porta.
- **ADR**: lo que el dueño decide no hacer va a `docs/adr/`. Las alternativas descartadas de [research.md](./research.md) son de diseño; si el dueño descarta alguna como decisión de producto (por ejemplo, guardar la conversación del portal), se anota allí.

## Technical Context

**Language/Version**: TypeScript 6 `strict` en Node 22, en los dos repos (srtomy-agent hoy es Python 3.13).

**Primary Dependencies**:

- srtomy-agent: `ai` 7 (`ToolLoopAgent`, `dynamicTool`, `jsonSchema`, `toolApproval`, `ai/test`), `@ai-sdk/anthropic` (y `@ai-sdk/google-vertex` para volver a Vertex), `hono` + `@hono/node-server`, `jose` (verificar el token de Auth0), `pg`, `zod`, `google-auth-library` (ID token para `/v1/internal/**`).
- srtomy-ui: `ai` y `@ai-sdk/react` (nuevas; justificación en Constitution Check). El resto es lo que ya hay: MUI, SWR, Auth0.

**Storage**: Postgres del agente, como hoy. Tabla `seen_key` sin cambios; tabla nueva `conversation` (un hilo de WhatsApp por fila) en lugar de las `checkpoints*` de LangGraph. El chat del portal no guarda nada en el servidor.

**Testing**: Vitest en ambos. En el agente, `MockLanguageModelV4` de `ai/test` hace de modelo guionizado (el `ScriptedModel` de hoy), `fetch` inyectado hace de srtomy-api y de Kapso, y Postgres real para el estado. En la UI, Testing Library + user-event, y Playwright + axe para el flujo y la accesibilidad. Ninguna prueba llama a la red.

**Target Platform**: Cloud Run (`southamerica-west1`) con buildpacks de Google para Node; la UI en Vercel.

**Project Type**: servicio web (agente) + aplicación web (portal).

**Performance Goals**: primer texto de la respuesta en menos de 3 s y consulta habitual completa en menos de 10 s (SC-001).

**Constraints**: el token del usuario no entra en mensajes, estado ni trazas; ninguna escritura sin aprobación firmada; sin datos personales en logs; respuestas de la API recortadas a un tamaño fijo antes de llegar al modelo.

**Scale/Scope**: una iglesia piloto; 95 operaciones de la API (unos 19 000 tokens de definiciones de herramientas por petición si se envían todas); unas 1 000 líneas de Python y 13 archivos de pruebas a portar.

## Constitution Check

| Principio                     | Cumple                | Nota                                                                                                                                                                                                                                                           |
| ----------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Quality gates              | Sí                    | El agente nuevo trae el mismo conjunto que la UI: `tsc`, ESLint, Prettier, Vitest con umbral del 80 %, en un `pnpm check:fast` y en CI.                                                                                                                        |
| II. Test what matters         | Sí                    | Se portan todas las pruebas del agente; cada regla de seguridad tiene su prueba del camino de rechazo (confirmación alterada, token ausente, firma inválida). e2e del chat con el agente interceptado.                                                         |
| III. Security and privacy     | Sí                    | Permisos solo en srtomy-api; token fuera del modelo y de las trazas; aprobaciones firmadas; `NEXT_PUBLIC_AGENT_URL` validada en `app/env.ts`. Pendiente del dueño: mencionar al proveedor de IA en la política de privacidad.                                  |
| IV. Accessible, Spanish-first | Sí                    | Panel con foco, nombres accesibles, región viva para respuestas y estados vacío, cargando, error y sesión vencida.                                                                                                                                             |
| V. Deliberate dependencies    | Sí, con justificación | `ai` y `@ai-sdk/react`: el protocolo de streaming, el estado de las aprobaciones y la reanudación de mensajes son justo lo que habría que escribir a mano con SWR; no duplican nada existente. Sin librería de markdown: el asistente responde en texto plano. |
| VI. Small, traceable changes  | Sí                    | Cuatro fases, cada una un PR que se puede publicar sola (ver Fases).                                                                                                                                                                                           |

Regla de arquitectura «todo acceso a la API pasa por `app/(api)`»: el agente es un segundo backend, así que su transporte vive en `app/(api)/assistant.ts` y usa el mismo proveedor de token que `client.ts`; los componentes no leen tokens ni arman URL.

## Project Structure

### Documentation (this feature)

```text
specs/017-ai-assistant-chat/
├── spec.md
├── plan.md
├── research.md        decisiones y alternativas
├── data-model.md      tablas y tipos
├── quickstart.md      cómo comprobar que funciona
├── contracts/chat.md  contrato de POST /chat
└── tasks.md           (lo crea /speckit-tasks)
```

### Source Code

```text
srtomy-agent/                    (reemplaza a src/srtomy_agent y tests/ en Python)
├── src/
│   ├── main.ts                  app Hono: /health, /webhooks/kapso, /chat
│   ├── config.ts                variables de entorno (zod)
│   ├── agent.ts                 ToolLoopAgent: prompt, herramientas, política de aprobación
│   ├── prompt.ts                instrucciones por canal y nivel
│   ├── tools/openapi.ts         herramientas desde openapi/srtomy-api.json; riesgo; listas
│   ├── tools/describe.ts        una acción en palabras, para la tarjeta y para WhatsApp
│   ├── api-client.ts            srtomy-api: identidad, vincular, stop, y las herramientas
│   ├── privacy.ts               redact (teléfonos, correos, tokens, códigos)
│   ├── telemetry.ts             trazas apagadas por defecto y con redact
│   ├── rate-limit.ts            ritmo por usuario (interfaz; memoria)
│   ├── chat/route.ts            POST /chat: verifica el token, arma el contexto, hace stream
│   ├── chat/auth.ts             verificación del JWT de Auth0 (JWKS)
│   ├── whatsapp/service.ts      un mensaje entra, una respuesta sale
│   ├── whatsapp/commands.ts     STOP, ALTA, VINCULAR, antes del modelo
│   ├── whatsapp/identity.ts     quién escribe y su nivel
│   ├── whatsapp/confirm.ts      isYes y el texto «¿Confirmas?»
│   ├── whatsapp/conversation.ts hilo guardado (interfaz; memoria y Postgres)
│   ├── whatsapp/seen.ts         deduplicación (interfaz; memoria y Postgres)
│   └── kapso/                   firma, webhook y envío
├── evals/                       preguntas de ejemplo en español y su corredor (fuera del CI)
├── openapi/srtomy-api.json
└── (pruebas *.test.ts junto a cada archivo)

srtomy-ui/
├── app/(api)/assistant.ts               transporte del chat con el token del usuario
├── app/portal/assistant/
│   ├── AssistantButton.tsx              botón flotante que abre el panel
│   ├── AssistantPanel.tsx               Drawer (pantalla completa en móvil)
│   ├── MessageList.tsx                  mensajes, «Consultando…», región viva
│   ├── ApprovalCard.tsx                 qué se va a hacer + Confirmar / Cancelar
│   ├── useAssistant.ts                  useChat + contexto de pantalla + revalidar SWR
│   ├── suggestions.ts                   sugerencias según permisos y pantalla
│   └── screenContext.ts                 nodo, evento o persona a partir de la ruta
├── app/portal/PortalProviders.tsx       monta el asistente si hay NEXT_PUBLIC_AGENT_URL
├── app/env.ts                           NEXT_PUBLIC_AGENT_URL (opcional)
└── tests/assistant.spec.ts              e2e y axe

srtomy-api/
├── (hecho) Javadoc → OpenAPI, OpenApiDocumentationTests, OpenApiTextCustomizer
└── infra/terraform/modules/agent        secreto de aprobaciones, variables de Auth0 y orígenes
```

**Structure Decision**: el agente sigue siendo un servicio aparte (decisión del dueño), con WhatsApp y el chat como dos entradas delgadas sobre un mismo `agent.ts`. En la UI el código del asistente vive junto al portal (`app/portal/assistant/`), que es quien lo usa.

## Diseño

### El agente (compartido)

- **Herramientas**: `tools/openapi.ts` recorre el OpenAPI y crea un `dynamicTool` por operación con `jsonSchema` (parámetros de ruta y consulta, y `body`). Mismo nombre que hoy (`post_organizations_id_invitations`), misma exclusión de `/v1/internal/**` y `/v1/webhooks/**`, mismo riesgo por método (GET lee, DELETE elimina, el resto escribe). La descripción de cada herramienta es la de la operación.
- **Qué herramientas ve cada quien**: una función pura `toolsFor(channel, tier)`. WhatsApp sin identificar: la lista explícita `PUBLIC_READS`. WhatsApp identificado y portal: todo menos `/v1/public/**` y menos una lista explícita de operaciones sensibles (FR-012). Con prueba del camino de rechazo.
- **Confirmación**: `toolApproval` como función única: lectura → se ejecuta; cualquier otra cosa → `user-approval` con `reason` = la acción en palabras (`describe.ts`). `experimental_toolApprovalSecret` firma cada solicitud, de modo que una aprobación fabricada o cambiada en el cliente no se ejecuta (FR-006).
- **Token**: viaja en el contexto de ejecución del SDK (`toolsContext`), no en los mensajes; la telemetría no lo incluye. Sustituye a la variable de contexto `Session`.
- **Instrucciones**: comunes (español, breve, no inventar, no pedir contraseñas, no reintentar lo cancelado) más un bloque por canal: WhatsApp (texto plano, niveles, vinculación) o portal (nombre del usuario, nodo abierto con su id y su nombre, fecha y zona horaria de hoy).
- **Límites**: `stopWhen: isStepCount(8)`, tope de tokens de salida, resultados de herramientas recortados (4 000 caracteres, como hoy) y ritmo por usuario.
- **Costo**: instrucciones y herramientas con caché de prompt del proveedor. Se empieza enviando todas las herramientas permitidas; si las evaluaciones muestran que el modelo se confunde o el costo pesa, se pasa la cola larga a `toolSearch` con `deferLoading` (ver research.md).

### Chat del portal (`POST /chat`)

Contrato en [contracts/chat.md](./contracts/chat.md). El servidor no guarda nada: recibe los mensajes del cliente, verifica el token de Auth0 (mismo emisor y audiencia que srtomy-api), arma las instrucciones con el contexto de pantalla y responde con el stream de mensajes de UI del SDK. Las solicitudes de aprobación llegan a la UI como partes en estado `approval-requested`; la UI responde con `addToolApprovalResponse` y reenvía.

### WhatsApp

`service.ts` conserva el orden de hoy: deduplicar → comandos → identidad → agente → responder por Kapso. El hilo (mensajes del modelo) se guarda en `conversation`. Si el último turno dejó una solicitud de aprobación, el mensaje siguiente es la respuesta: `isYes` (palabras exactas) aprueba, cualquier otra cosa niega; después se continúa el agente. Esto reemplaza al `interrupt` de LangGraph y a su guardado.

### UI

`useAssistant` envuelve `useChat` con un `DefaultChatTransport` cuya cabecera `authorization` sale del proveedor de token de `client.ts`, y agrega al cuerpo el contexto de pantalla. Cuando una herramienta que escribe termina bien, revalida SWR para que las pantallas muestren el cambio (FR-007). `ApprovalCard` muestra el `reason` del servidor y los datos de la acción; una eliminación va con color de peligro. Si se envía un mensaje con una aprobación pendiente, antes se responde «no» a esa aprobación. Sin `NEXT_PUBLIC_AGENT_URL` el botón no aparece, lo que permite publicar por partes.

## Fases

Cada fase es un PR publicable por sí solo.

1. **Agente en TypeScript con WhatsApp igual que hoy** (srtomy-agent). Portar módulo por módulo con sus pruebas; desplegar como revisión sin tráfico; probar con la iglesia piloto; pasar el tráfico. El código Python se borra en el mismo PR que cambia el despliegue.
2. **`POST /chat`, solo lecturas** (srtomy-agent + Terraform en srtomy-api): verificación del token, CORS, contexto de pantalla, ritmo. En esta fase toda herramienta que escribe se niega automáticamente.
3. **Panel del asistente** (srtomy-ui): botón, panel, mensajes, estados, sugerencias, e2e y axe. Con esto queda publicada la historia 1.
4. **Acciones con confirmación** (ambos): política `user-approval`, firma, `ApprovalCard`, revalidación de SWR. Historia 2.
5. **Evaluaciones** (srtomy-agent): 30 preguntas en español con la herramienta esperada, para medir SC-003 antes de cada cambio de prompt o de herramientas.

## Riesgos

| Riesgo                                                                                  | Mitigación                                                                                                                             |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| La reescritura cambia el comportamiento de WhatsApp sin que nadie lo note.              | Las pruebas actuales se portan una a una antes de tocar nada más; piloto antes de pasar tráfico (FR-016).                              |
| Confirmaciones pendientes en el momento del cambio.                                     | Los hilos de LangGraph no se migran: quien tenía una pregunta pendiente recibe que se pida de nuevo. Se cambia en horario de poco uso. |
| Texto dentro de los datos que intenta dar órdenes al asistente.                         | La confirmación y los permisos no dependen del modelo: los decide la política y srtomy-api.                                            |
| La tarjeta dice una cosa y se ejecuta otra.                                             | La tarjeta se arma en el servidor con los datos exactos de la llamada y la firma ata la aprobación a esos datos.                       |
| 95 herramientas por petición encarecen o confunden.                                     | Caché de prompt; lista de sensibles fuera; `toolSearch` si las evaluaciones lo piden.                                                  |
| El buildpack de Node no arranca como se espera (el de Python tampoco se había probado). | Primer despliegue a una revisión sin tráfico.                                                                                          |
| API experimental del SDK (`experimental_toolApprovalSecret`).                           | Una prueba propia del camino de rechazo, que avisa si una actualización cambia el comportamiento.                                      |

## Complexity Tracking

Sin violaciones de la constitución.
