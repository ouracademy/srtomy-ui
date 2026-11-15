# Quickstart: comprobar el asistente y el agente unificado

Guía para validar la entrega de punta a punta. Los detalles están en [plan.md](./plan.md), [data-model.md](./data-model.md) y [contracts/chat.md](./contracts/chat.md).

## Requisitos

- Node 22 y pnpm; Postgres local (`docker compose up -d` en srtomy-agent).
- srtomy-api corriendo en local con el perfil `local`.
- En srtomy-agent, `.env` con `ANTHROPIC_API_KEY`, `SRTOMY_API_URL`, `DATABASE_URL`, `TOOL_APPROVAL_SECRET`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` y `CORS_ORIGINS=http://localhost:3000`.
- En srtomy-ui, `.env.local` con `NEXT_PUBLIC_AGENT_URL=http://localhost:8000`.

## 0. OpenAPI con descripciones (hecho)

```sh
cd srtomy-api && ./mvnw test -Dtest=OpenApiDocumentationTests
```

Pasa, y deja `target/openapi/srtomy-api.json`. Quitar el Javadoc de un método de un controlador hace que falle nombrando la operación.

## 1. Pruebas automáticas

```sh
cd srtomy-agent && pnpm check:fast     # tipos, lint, formato y pruebas (con Postgres)
cd srtomy-ui && pnpm check:fast && E2E_PORT=3100 pnpm test:e2e
```

Deben cubrir, como mínimo: comandos antes del modelo; tres niveles; nada se escribe sin un sí; «sí, pero…» es no; una aprobación alterada no ejecuta; firma y deduplicación del webhook; el hilo sobrevive a un reinicio; `redact`; `POST /chat` sin token responde 401.

## 2. Consultar desde el portal (historia 1)

1. `pnpm dev` en srtomy-agent y en srtomy-ui; iniciar sesión y entrar a un nodo con eventos.
2. Abrir el asistente y preguntar «¿qué eventos hay esta semana?».
3. Esperado: aparece «Consultando eventos…», la respuesta se escribe de a poco y coincide con el calendario.
4. Con un usuario sin permiso de personas, preguntar por una persona: el asistente dice que no tiene permiso.

## 3. Acción con confirmación (historia 2)

1. Pedir «crea un evento Ensayo el viernes a las 7 pm».
2. Esperado: una tarjeta con el nombre, la fecha y la hora, y los botones «Confirmar» y «Cancelar». En srtomy-api no hay ninguna llamada `POST /v1/events` todavía.
3. «Confirmar»: se crea, el asistente lo dice y el calendario lo muestra sin recargar.
4. Repetir y pulsar «Cancelar»: no se crea nada.
5. Repetir y, con las herramientas del navegador, cambiar el nombre en la petición antes de confirmar: no se ejecuta.

## 4. WhatsApp (historia 3)

Con un túnel y el webhook del número registrado, como describe el README de srtomy-agent:

1. Desde un número desconocido: pregunta el horario; responde solo lo publicado.
2. «STOP» y luego «ALTA»: responden sin pasar por el modelo.
3. Desde un número de las fichas, pedir una escritura, reiniciar el servicio y responder «SÍ»: se ejecuta una sola vez.

## 5. Evaluaciones

```sh
cd srtomy-agent && pnpm eval
```

Tabla con las 30 preguntas y si eligió la operación esperada; el objetivo es 90 % o más (SC-003).
