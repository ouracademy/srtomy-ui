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

## 6. Cuántas herramientas ve el modelo: búsqueda primero

- **Decisión**: una herramienta de búsqueda (`toolSearch()` del AI SDK) delante de las operaciones. Cada operación del OpenAPI se registra con `deferLoading: true`; el modelo empieza viendo solo `search` y un **núcleo** pequeño siempre cargado (quién soy y mis nodos, mis permisos, buscar personas, listar eventos, ver un evento, ver la asistencia). Cuando necesita otra cosa, busca («cerrar inscripciones») y en el paso siguiente recibe solo las que coinciden (cinco por defecto). La búsqueda es propia (callback `search`): puntúa por palabras sobre el nombre, la descripción, la etiqueta del OpenAPI y sinónimos en español de cada recurso («evento», «curso», «cargo», «sede»), porque los usuarios escriben en español y el OpenAPI está en inglés.
- **Motivo**: 95 operaciones son unos 19 000 tokens en cada mensaje, y el modelo elige peor entre muchas parecidas. Con las descripciones nuevas la búsqueda tiene de qué agarrarse. El núcleo cubre la mayoría de las preguntas sin un paso extra. Es una pieza del SDK, no código nuestro de orquestación, y el núcleo es una lista explícita y revisable.
- **Costo conocido**: descubrir herramientas cambia la lista enviada al modelo y puede invalidar parte de la caché de prompt; el núcleo e instrucciones van primero para que su caché se conserve. El modo «code mode» del SDK la conserva, pero agrega un intérprete: se descarta por ahora.
- **Cómo se valida**: las evaluaciones (sección 11) comparan núcleo + búsqueda contra «todas las herramientas»; si la búsqueda falla, se ajustan los sinónimos o el núcleo, no se vuelve a mandar todo.
- **Descartado — un servidor MCP de srtomy-api**: expondría las mismas operaciones a cualquier cliente MCP (por ejemplo Claude Desktop), pero no resuelve el problema (un cliente MCP también recibiría 95 herramientas y necesitaría búsqueda), agrega un proceso y un protocolo más que mantener y otra frontera de autenticación. El AI SDK puede consumir MCP más adelante sin cambiar el agente (`deferLoading` aplica igual). Queda en trabajo futuro, por si se quiere usar Sr. Tommy desde otros asistentes.
- **Descartado — pocas herramientas «de alto nivel» escritas a mano**: contradice la regla del agente (las herramientas salen del OpenAPI) y duplica la API.

## 7. Servidor HTTP

- **Decisión**: Hono sobre `@hono/node-server`.
- **Motivo**: trabaja con `Request`/`Response` estándar, que es lo que devuelve el SDK para el stream; pruebas con `app.request()` sin red, como `TestClient` hoy.
- **Descartado**: Next.js para el agente (no hay páginas); Express (adaptar streams a mano).

## 8. Trazas: LangSmith

- **Decisión**: LangSmith, como hoy, con su integración para el AI SDK (`langsmith/experimental/vercel`, que envuelve las llamadas del SDK) y su anonimizador (`langsmith/anonymizer`) alimentado con las mismas reglas de `privacy.ts` (teléfonos, correos, tokens, códigos). Apagadas por defecto (`LANGSMITH_TRACING`); cada traza lleva canal, nivel e iglesia, nunca a la persona; el hilo de WhatsApp se nombra con su hash.
- **Motivo**: mantiene lo que ya funciona y lo que el README promete, y deja trazas y evaluaciones en la misma herramienta (sección 11).
- **Descartado**: OpenTelemetry genérico hacia otro destino (más configuración sin necesidad actual; queda la opción de Langfuse ya anotada como trabajo futuro del agente).
- **Pendiente del dueño**: región y retención en LangSmith antes de activarlas con iglesias reales.

## 9. Respuestas en el portal

- **Decisión**: texto plano con saltos de línea; las listas las escribe el modelo como líneas.
- **Motivo**: evita una dependencia de markdown y su superficie de ataque (HTML en datos de la iglesia). Si más adelante se quieren tablas o enlaces a pantallas, se evalúa.

## 10. La tarjeta de confirmación

- **Decisión**: el texto lo arma el servidor (`describe.ts`): verbo por método («Crear», «Cambiar», «Eliminar»), el recurso en español por etiqueta del OpenAPI («evento», «persona», «grupo») y los datos de la llamada con etiquetas en español para los campos comunes; el resto con su nombre.
- **Motivo**: lo que se confirma tiene que ser lo que se ejecuta, así que no puede redactarlo el modelo. El OpenAPI está en inglés (regla del repo), por eso las etiquetas en español viven en el agente.

## 11. Evaluaciones: LangSmith

- **Decisión**: un dataset de LangSmith con unas 30 preguntas en español (Perú) por canal y nivel, cada una con la operación esperada y, si aplica, los argumentos clave y si debe pedir confirmación. Se corren con la integración de Vitest de LangSmith (`langsmith/vitest`): cada caso ejecuta el agente con el modelo real contra una srtomy-api simulada con respuestas fijas, y registra un experimento en LangSmith para comparar corridas. Evaluadores: código (¿llamó la operación esperada? ¿pidió confirmación antes de escribir? ¿encontró la operación con la búsqueda?) y, para el tono y el idioma, un juez con Claude. Fuera del CI (`pnpm eval`, requiere `ANTHROPIC_API_KEY` y `LANGSMITH_API_KEY`); se corre antes de cambiar instrucciones, descripciones del OpenAPI, el núcleo o la búsqueda.
- **Motivo**: sin evaluaciones no se puede saber si un cambio mejora (SC-003). Ya se usa LangSmith para trazas; las evaluaciones quedan en el mismo lugar y comparables en el tiempo. Los casos viven versionados en el repo (`evals/cases.ts`) y se suben al dataset, para que el repo siga siendo la fuente.
- **Descartado**: un corredor propio con una tabla en consola (no compara corridas ni guarda historial).
