# Research: Asistente de IA en el portal y agente unificado

Cada decisión con su motivo y lo que se descartó. Verificado contra la documentación que trae el paquete `ai` 7.0 (`node_modules/ai/docs`), no de memoria.

## 1. Dónde vive el agente

- **Decisión**: reescribir srtomy-agent en TypeScript como un solo servicio en Cloud Run con dos entradas.
- **Motivo**: un solo lugar para las reglas (herramientas, confirmación, privacidad); la llave del modelo no sale de GCP; el webhook conserva su cuenta de servicio para `/v1/internal/**`. Elegido por el dueño del producto.
- **Descartado**: chat como route handler de Next en Vercel con WhatsApp en Python (dos agentes con la lógica duplicada y la llave en Vercel); todo en Vercel (el webhook pierde la cuenta de servicio y Postgres).

## 2. Confirmación de escrituras

- **Decisión**: `toolApproval` del AI SDK con una función única (lectura: nada; el resto: `user-approval` con `reason`) y `experimental_toolApprovalSecret`.
- **Motivo**: es la misma regla de hoy, pero el SDK ya trae el estado, el protocolo hacia `useChat` (`approval-requested`, `addToolApprovalResponse`) y la revalidación. El chat del portal es sin estado en el servidor, así que el historial lo manda el cliente: sin firma, un cliente podría fabricar una aprobación. La firma HMAC ata la aprobación al nombre de la herramienta, al id de la llamada y a los datos.
- **Descartado**: guardar las acciones pendientes en Postgres también para el portal (más estado y más código para lo mismo); confiar en que el modelo «pregunte antes» (no es una garantía).

## 3. El token del usuario

- **Decisión**: pasarlo por el contexto de herramientas del SDK (`toolsContext`), que no entra al prompt, y no incluirlo en la telemetría (`includeToolsContext` vacío).
- **Motivo**: es el mecanismo del SDK para credenciales; reemplaza a la variable de contexto `Session` de Python.
- **Descartado**: una variable global por petición (`AsyncLocalStorage`): funciona, pero el SDK ya lo resuelve y lo filtra de las trazas.

## 4. Quién verifica al usuario del portal

- **Decisión**: el agente verifica el token de Auth0 con `jose` contra el JWKS del tenant (emisor y audiencia de srtomy-api) antes de llamar al modelo; después lo reenvía tal cual a srtomy-api, que decide los permisos.
- **Motivo**: sin esa verificación cualquiera podría gastar modelo. No hay cuenta de servicio ni intercambio de tokens: el agente nunca puede más que el usuario.
- **Descartado**: llamar a `GET /v1/me` en cada mensaje para validar (una llamada extra y un registro de usuario como efecto secundario).

## 5. Estado de WhatsApp sin LangGraph

- **Decisión**: una tabla `conversation` con los mensajes del hilo (los últimos 20 turnos); la aprobación pendiente es simplemente el final del hilo guardado.
- **Motivo**: lo único que LangGraph aportaba era guardar el hilo y reanudar tras el `interrupt`; el SDK continúa desde los mensajes más la respuesta de aprobación. Menos dependencias y un esquema que se entiende leyendo una fila.
- **Descartado**: migrar las tablas `checkpoints*` (formato interno de LangGraph, para una iglesia piloto no lo vale). Quedan en la base; borrarlas va a la lista de deuda y lo decide el dueño.

## 6. Cuántas herramientas ve el modelo

- **Decisión**: empezar con todas las permitidas para el canal y el nivel, con caché de prompt; medir con las evaluaciones.
- **Dato**: 95 operaciones son unos 19 000 tokens de definiciones por petición.
- **Siguiente paso si hace falta**: `toolSearch()` con `deferLoading: true` para la cola larga (roles, cargos, entradas, compartir), dejando cargadas las de uso diario. Se pospone porque al descubrir herramientas cambia la lista y se pierde la caché, y porque sin evaluaciones no hay cómo saber si mejora.
- **Descartado**: escribir a mano unas pocas herramientas «de alto nivel»: contradice la regla del agente (las herramientas salen del OpenAPI) y duplica la API.

## 7. Servidor HTTP

- **Decisión**: Hono sobre `@hono/node-server`.
- **Motivo**: trabaja con `Request`/`Response` estándar, que es lo que devuelve el SDK para el stream; pruebas con `app.request()` sin red, como `TestClient` hoy.
- **Descartado**: Next.js para el agente (no hay páginas); Express (adaptar streams a mano).

## 8. Trazas

- **Decisión**: la telemetría del AI SDK (OpenTelemetry), apagada por defecto, con `redact` aplicado antes de exportar; destino configurable por variable.
- **Motivo**: mismo comportamiento que hoy con LangSmith (apagado, enmascarado, etiquetado con nivel e iglesia y no con la persona) sin atarse a un proveedor.
- **Pendiente del dueño**: destino, región y retención, como ya decía el README.

## 9. Respuestas en el portal

- **Decisión**: texto plano con saltos de línea; las listas las escribe el modelo como líneas.
- **Motivo**: evita una dependencia de markdown y su superficie de ataque (HTML en datos de la iglesia). Si más adelante se quieren tablas o enlaces a pantallas, se evalúa.

## 10. La tarjeta de confirmación

- **Decisión**: el texto lo arma el servidor (`describe.ts`): verbo por método («Crear», «Cambiar», «Eliminar»), el recurso en español por etiqueta del OpenAPI («evento», «persona», «grupo») y los datos de la llamada con etiquetas en español para los campos comunes; el resto con su nombre.
- **Motivo**: lo que se confirma tiene que ser lo que se ejecuta, así que no puede redactarlo el modelo. El OpenAPI está en inglés (regla del repo), por eso las etiquetas en español viven en el agente.

## 11. Evaluaciones

- **Decisión**: un archivo de casos (pregunta en español, nivel, herramienta y argumentos clave esperados) y un corredor que usa el modelo real, fuera del CI (`pnpm eval`), con el resultado como tabla.
- **Motivo**: es la única forma de saber si un cambio de prompt o de descripciones mejora o empeora (SC-003). Estaba en el «trabajo futuro» del agente.
