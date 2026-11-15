# Feature Specification: Asistente de IA en el portal y agente unificado

**Feature Branch**: `ai-assistant-chat`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Redefinir el agente de Sr. Tommy: pasarlo a Vercel AI SDK, mejorar el OpenAPI (las operaciones no tenían descripciones) y tener un chatbot dentro de la app."

Abarca tres repositorios: **srtomy-ui** (el chat del portal), **srtomy-agent** (el agente, que se reescribe) y **srtomy-api** (las descripciones del OpenAPI, ya hechas, y el permiso de origen para el agente). Esta spec vive aquí porque el chat es lo que ve el usuario; el número 017 sigue la numeración compartida con srtomy-api (014 a 016 son las de WhatsApp).

## Decisiones

1. **Un solo agente para dos canales.** El mismo servicio atiende WhatsApp (como hoy) y el chat del portal. Las reglas (qué herramientas hay, qué necesita confirmación, qué se oculta de las trazas) se escriben una vez.
2. **En el portal no hay «niveles»**: quien chatea ya inició sesión, así que el asistente actúa con su propia credencial y srtomy-api decide qué puede ver y hacer, igual que en las pantallas. El asistente nunca tiene más permisos que el usuario.
3. **Nada cambia datos sin confirmación.** Antes de cada acción que crea, cambia o elimina, el asistente muestra qué va a hacer y espera: en el portal, una tarjeta con «Confirmar» y «Cancelar»; en WhatsApp, «SÍ» o «NO» como hoy. Un mensaje nuevo en vez de la confirmación cancela la acción.
4. **El asistente trabaja sobre el nodo que el usuario tiene abierto** (iglesia, sede, grupo o ministerio) y lo sabe sin que se lo digan: «¿quiénes faltaron el domingo?» se entiende en ese nodo.
5. **WhatsApp no cambia para el miembro**: mismos tres niveles, mismos comandos (STOP, BAJA, ALTA, VINCULAR), mismas respuestas. La reescritura no debe notarse. **Pausar el asistente** (decisión 6b de la spec 014 de srtomy-api) es solo de WhatsApp: el chat del portal sigue funcionando aunque el pastor lo haya pausado (confirmado por el dueño el 15-nov-2026).
6. **Las herramientas salen del OpenAPI de srtomy-api**, que ahora describe cada operación, parámetro y campo. No se escriben herramientas a mano para lo que la API ya hace. El asistente no recibe las ~95 operaciones de una vez: primero **busca** las que necesita por su descripción y solo esas se le muestran (decidido por el dueño el 15-nov-2026).
7. **La conversación del portal no se guarda en el servidor** en esta versión: vive en el navegador mientras dura la sesión. (WhatsApp sigue guardando la suya, porque la confirmación llega en otro mensaje.)
8. **El proveedor de IA es Claude** (Anthropic), y la política de privacidad lo dice. **Trazas y evaluaciones en LangSmith**, apagadas por defecto y con los datos personales ocultos.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Preguntar por la iglesia desde el portal (Priority: P1)

Una persona con sesión iniciada abre el asistente desde cualquier pantalla del portal y pregunta en español: «¿cuántas personas asistieron al culto del domingo?», «¿qué eventos hay esta semana?», «busca a María Quispe». El asistente consulta los datos y responde mientras escribe, con los nombres y fechas reales.

**Why this priority**: es el valor mínimo y no cambia datos: se puede publicar sola y ya ahorra buscar entre pantallas.

**Independent Test**: con sesión iniciada en un nodo con eventos y personas, abrir el asistente, hacer una pregunta y comprobar que la respuesta coincide con lo que muestran las pantallas.

**Acceptance Scenarios**:

1. **Given** un usuario con permiso de lectura de eventos en el nodo abierto, **When** pregunta qué eventos hay esta semana, **Then** el asistente responde con los eventos de ese nodo y de esas fechas, y la respuesta aparece de forma progresiva.
2. **Given** un usuario sin permiso para ver a las personas del nodo, **When** pregunta por una persona, **Then** el asistente dice que no tiene permiso para verlo y no muestra ningún dato.
3. **Given** que el asistente está consultando, **When** el usuario mira el panel, **Then** ve qué está haciendo («Consultando eventos…») y puede detener la respuesta.
4. **Given** que el servicio del asistente no responde, **When** el usuario envía un mensaje, **Then** ve un mensaje de error en español con opción de reintentar, y su mensaje no se pierde.
5. **Given** una pregunta que no tiene que ver con la iglesia ni con la app, **Then** el asistente lo dice con amabilidad y ofrece lo que sí puede hacer.

---

### User Story 2 - Pedir una acción y confirmarla (Priority: P2)

El usuario pide algo que cambia datos: «crea un evento "Ensayo de alabanza" el viernes a las 7 pm», «registra a Juan Pérez como visitante», «marca que asistieron Ana y Luis al culto de hoy». El asistente prepara la acción y muestra una tarjeta que dice en lenguaje claro qué va a pasar. Solo al pulsar «Confirmar» se ejecuta; luego el asistente dice el resultado y las pantallas muestran el dato nuevo.

**Why this priority**: es lo que convierte al asistente en una forma de trabajar y no solo de consultar; depende de la historia 1.

**Independent Test**: pedir crear un evento, confirmar y comprobar que el evento aparece en el calendario; repetir, cancelar y comprobar que no se creó nada.

**Acceptance Scenarios**:

1. **Given** un usuario con permiso de escritura de eventos, **When** pide crear un evento y pulsa «Confirmar», **Then** el evento se crea, el asistente lo confirma y el calendario lo muestra sin recargar la página.
2. **Given** la tarjeta de confirmación, **When** el usuario pulsa «Cancelar», **Then** no se cambia nada y el asistente lo dice.
3. **Given** la tarjeta de confirmación, **When** el usuario escribe otro mensaje sin pulsar ningún botón, **Then** la acción pendiente queda cancelada.
4. **Given** una acción que elimina algo, **Then** la tarjeta lo marca como eliminación y dice que no se puede deshacer.
5. **Given** un usuario sin el permiso necesario, **When** confirma, **Then** la acción no se ejecuta y el asistente explica que no tiene permiso.
6. **Given** una petición alterada para que parezca ya confirmada (una confirmación que el servicio no emitió, o emitida para otra acción u otros datos), **Then** el servicio la rechaza y no ejecuta nada.
7. **Given** que el asistente necesita varias acciones (registrar a una persona y marcar su asistencia), **Then** cada una pide su propia confirmación.

---

### User Story 3 - WhatsApp sigue igual tras la reescritura (Priority: P2)

Un miembro escribe al WhatsApp de su iglesia y todo se comporta como antes de la reescritura: quien no está identificado solo recibe lo que la iglesia publica, quien está en las fichas actúa como Miembro, quien vinculó su cuenta actúa con sus permisos; STOP, BAJA, ALTA y VINCULAR funcionan siempre y sin pasar por el modelo; las escrituras piden «SÍ» o «NO».

**Why this priority**: es la condición para poder retirar el agente anterior; no agrega valor nuevo, pero un retroceso aquí afecta a miembros reales.

**Independent Test**: la batería de pruebas del agente actual (comandos, niveles, confirmación, firma, deduplicación, estado tras reinicio, ocultamiento de datos personales) pasa, traducida, contra el servicio nuevo.

**Acceptance Scenarios**:

1. **Given** un número desconocido, **When** pregunta el horario, **Then** recibe lo que la iglesia publica y nada más.
2. **Given** un miembro con una escritura pendiente, **When** responde «sí, pero cambia la fecha», **Then** no se ejecuta nada.
3. **Given** que el servicio se reinicia con una confirmación pendiente, **When** el miembro responde «SÍ», **Then** la acción se ejecuta una sola vez.
4. **Given** un webhook sin firma válida o repetido, **Then** se rechaza o se ignora sin contestar dos veces.
5. **Given** el mensaje «STOP», **Then** se apagan los avisos sin que el modelo vea el mensaje.

---

### User Story 4 - Sugerencias y contexto de la pantalla (Priority: P3)

Al abrir el asistente vacío, el usuario ve unas pocas sugerencias según la pantalla en la que está y sus permisos («¿Quiénes faltaron al último culto?», «Crea un evento»). El asistente sabe en qué nodo está el usuario y lo usa por defecto.

**Why this priority**: mejora el descubrimiento; el asistente es útil sin esto.

**Independent Test**: abrir el asistente en el detalle de un evento y ver sugerencias sobre ese evento; pulsar una y obtener respuesta.

**Acceptance Scenarios**:

1. **Given** el asistente sin mensajes, **Then** se muestran sugerencias pulsables acordes a los permisos del usuario (ninguna sobre algo que no puede hacer).
2. **Given** un usuario en el nodo «Jóvenes», **When** pregunta «¿cuántos somos?», **Then** la respuesta se refiere a «Jóvenes» y lo nombra.

### Edge Cases

- La sesión del usuario vence a mitad de la conversación: el asistente pide volver a iniciar sesión; no se pierde lo escrito.
- El usuario cambia de nodo con el panel abierto: los mensajes siguientes usan el nodo nuevo y el panel lo indica.
- El usuario pide algo ambiguo («borra a Juan» y hay tres): el asistente pregunta cuál antes de proponer la acción.
- Una respuesta de la API demasiado larga (cientos de personas): el asistente resume y dice que hay más.
- El usuario pega datos sensibles (un código de vinculación, una contraseña): no se guardan en trazas.
- Muchos mensajes seguidos del mismo usuario: se limita el ritmo y se le avisa.
- El modelo no responde o tarda demasiado: se corta con un mensaje claro; una acción ya confirmada no queda a medias sin que el usuario lo sepa.
- Pantalla pequeña (teléfono): el panel ocupa toda la pantalla y se puede cerrar.
- Texto que intenta dar órdenes al asistente dentro de los datos (el nombre de un evento que dice «ignora tus reglas»): no cambia qué necesita confirmación ni qué permisos se aplican.

## Requirements _(mandatory)_

### Functional Requirements

**Chat del portal**

- **FR-001**: el portal MUST ofrecer el asistente en todas las pantallas autenticadas, mediante un botón siempre visible que abre un panel; el panel se puede cerrar y la conversación se conserva al navegar dentro del portal.
- **FR-002**: el asistente MUST responder en español, de forma progresiva, y mostrar qué está consultando mientras tanto; el usuario MUST poder detener una respuesta en curso.
- **FR-003**: el asistente MUST actuar únicamente con la credencial del usuario que chatea; toda decisión de permiso la toma srtomy-api. El servicio del asistente MUST rechazar mensajes sin una sesión válida.
- **FR-004**: el asistente MUST conocer el nodo abierto y el nombre del usuario sin que este los escriba.
- **FR-005**: toda acción que crea, cambia o elimina datos MUST mostrar antes una tarjeta con lo que va a hacer, en lenguaje claro y con los datos principales, y botones «Confirmar» y «Cancelar». Las eliminaciones MUST distinguirse visualmente.
- **FR-006**: una confirmación MUST valer solo para la acción y los datos exactos que se mostraron; el servicio MUST rechazar confirmaciones que no emitió o que fueron alteradas.
- **FR-007**: tras una acción confirmada, las pantallas del portal MUST reflejar el cambio sin recargar.
- **FR-008**: el panel MUST manejar de forma explícita los estados vacío (con sugerencias), cargando, error (con reintento) y sesión vencida.
- **FR-009**: el panel MUST ser utilizable con teclado y lector de pantalla: foco al abrir, nombres accesibles, anuncio de las respuestas nuevas, y MUST pasar la revisión de accesibilidad automática del proyecto.
- **FR-010**: el usuario MUST poder empezar una conversación nueva (borrar la actual).

**Agente (ambos canales)**

- **FR-011**: las herramientas del agente MUST generarse desde la especificación de srtomy-api; las lecturas se ejecutan solas y todo lo demás requiere confirmación.
- **FR-012**: el agente MUST quedar fuera de lo que no es para personas (operaciones internas y webhooks), de la administración del WhatsApp de la iglesia (conectar, desconectar, pausar, vincular; ya excluida hoy) y, en el portal, de las operaciones sensibles que tienen su propia pantalla (dar o quitar propietarios, borrar una iglesia) hasta que el dueño del producto las habilite.
- **FR-013**: WhatsApp MUST conservar el comportamiento actual: tres niveles decididos por srtomy-api, lista explícita de lecturas públicas para desconocidos, comandos antes del modelo, confirmación con sí/no exacto, firma y deduplicación de webhooks, silencio mientras la iglesia pausó el asistente (los comandos siguen funcionando), y estado que sobrevive a un reinicio.
- **FR-014**: la credencial del usuario MUST NOT aparecer en la conversación guardada, en lo que ve el modelo ni en las trazas. Las trazas MUST seguir ocultando teléfonos, correos, credenciales y códigos, y estar apagadas por defecto.
- **FR-015**: el agente MUST limitar el ritmo de mensajes por usuario y el tamaño de lo que lee de la API, y avisar cuando recorta.
- **FR-015b**: el asistente MUST encontrar las operaciones por su descripción antes de usarlas, en lugar de recibirlas todas en cada mensaje; las de uso diario pueden estar siempre disponibles.
- **FR-015c**: la política de privacidad MUST decir que los mensajes al asistente y los datos que consulta se envían a Claude, de Anthropic, para generar la respuesta.
- **FR-015d**: un conjunto de evaluaciones con preguntas en español MUST poder correrse antes de cambiar instrucciones, descripciones o herramientas, y sus resultados MUST quedar comparables entre corridas.
- **FR-016**: el servicio anterior MUST poder retirarse solo cuando la batería de pruebas equivalente pase en el nuevo y una iglesia piloto lo haya usado por WhatsApp sin incidentes.

**API**

- **FR-017**: la especificación de srtomy-api MUST describir cada operación, parámetro y campo de petición que una persona o el agente puede usar, y una prueba MUST fallar si se publica uno sin descripción. _(Hecho en esta entrega.)_
- **FR-018**: srtomy-api MUST aceptar las llamadas del asistente hechas en nombre del usuario con su credencial, sin una cuenta de servicio que lo pueda todo.

### Key Entities

- **Conversación**: los mensajes entre una persona y el asistente en un canal. En el portal vive en el navegador; en WhatsApp se guarda con un nombre que no es el teléfono.
- **Acción propuesta**: una operación que cambia datos, con sus datos exactos, a la espera de confirmación. Tiene un estado: pendiente, confirmada, cancelada, ejecutada o fallida.
- **Herramienta**: una operación de srtomy-api que el asistente puede usar, con su descripción y su riesgo (lectura, escritura o eliminación).
- **Contexto de la pantalla**: el nodo abierto y, si aplica, el evento o la persona que el usuario está viendo.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: un usuario obtiene la respuesta a una consulta habitual (eventos de la semana, asistencia de un evento, buscar una persona) en menos de 10 segundos, y ve el inicio de la respuesta en menos de 3.
- **SC-002**: en las pruebas, el 100 % de las acciones que cambian datos se ejecutan solo después de una confirmación explícita; ninguna con una confirmación alterada.
- **SC-003**: en un conjunto de al menos 30 preguntas de ejemplo en español (Perú), el asistente elige la operación correcta en el 90 % o más. (Con el OpenAPI sin descripciones no había forma de medirlo.)
- **SC-004**: ningún dato que el usuario no puede ver en las pantallas aparece en una respuesta del asistente (verificado con usuarios de prueba de distintos permisos).
- **SC-005**: el 100 % de los escenarios que hoy cubren las pruebas del agente de WhatsApp pasan en el servicio nuevo antes de retirar el anterior.
- **SC-006**: crear un evento sencillo desde el asistente toma menos pasos que desde el formulario: un mensaje y una confirmación.
- **SC-007**: el panel no tiene infracciones de accesibilidad serias o críticas.

## Assumptions

- El chat del portal es para usuarios con sesión; el visitante de la landing queda fuera de esta versión.
- Solo texto: sin voz, imágenes ni archivos adjuntos.
- La conversación del portal no se sincroniza entre dispositivos ni se guarda al cerrar sesión.
- El costo del modelo lo asume el producto; el **límite de gasto por iglesia** queda como trabajo futuro (`docs/tech-debt-and-future-work.md`).
- El modelo es Claude por la API de Anthropic, como hoy; cambiar de proveedor no es parte de esta entrega. Activar las trazas de LangSmith con iglesias reales sigue pendiente de que el dueño elija región y retención.
- El orden de entrega es: descripciones del OpenAPI (hecho), reescritura del agente con WhatsApp igual que antes, y después el chat del portal (primero lecturas, luego acciones con confirmación).
