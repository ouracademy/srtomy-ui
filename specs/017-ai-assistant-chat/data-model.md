# Data Model: Asistente de IA en el portal y agente unificado

## Postgres del agente

### `seen_key` (sin cambios)

Mensajes y entregas ya atendidos. «¿Visto?» y «marcar visto» son un solo paso (`insert … on conflict do nothing`). Se limpia sola a las 24 h.

| Columna   | Tipo                 | Nota                                          |
| --------- | -------------------- | --------------------------------------------- |
| `key`     | text, clave primaria | `message:<id>` o `delivery:<idempotency-key>` |
| `seen_at` | timestamptz          |                                               |

### `conversation` (nueva; reemplaza a `checkpoints*`)

Un hilo de WhatsApp por fila. El portal no usa esta tabla.

| Columna      | Tipo                 | Nota                                                                                                   |
| ------------ | -------------------- | ------------------------------------------------------------------------------------------------------ |
| `thread_id`  | text, clave primaria | hash del número de la iglesia y del remitente; nunca el teléfono                                       |
| `messages`   | jsonb                | mensajes del modelo (usuario, asistente, herramientas, aprobaciones); como mucho los últimos 20 turnos |
| `updated_at` | timestamptz          | para la limpieza futura de hilos viejos (deuda 32)                                                     |

- La **acción pendiente** no es una tabla: es una solicitud de aprobación sin respuesta al final de `messages`.
- Leer el hilo y guardarlo con el turno nuevo ocurre con la fila bloqueada (`select … for update`), para que dos mensajes seguidos del mismo miembro no se pisen.
- El token nunca se escribe aquí.

## Tipos del agente

- **Tool**: `name`, `description`, `method`, `path`, `inputSchema`, `risk` (`read`, `write`, `destructive`), `tag`.
- **Channel**: `whatsapp` o `portal`. **Tier** (solo WhatsApp): `public` o `member`.
- **Caller**: lo que es cierto de quien escribe en esta petición: canal, nivel, token (o ninguno), nombre, iglesia. No se guarda.
- **ScreenContext** (solo portal): `nodeId`, `nodeName`, y opcionales `eventId`, `personId`, `timeZone`.

## Estados de una acción propuesta

```text
pendiente ──Confirmar / «sí»──▶ aprobada ──▶ ejecutada
    │                               └──────▶ fallida (la API la rechazó: 403, 409…)
    └──Cancelar / «no» / otro mensaje──▶ cancelada
```

Una aprobación cuya firma no corresponde a la acción y a sus datos nunca llega a «aprobada».

## Navegador (portal)

La conversación vive en memoria de la pestaña (el estado de `useChat`), por usuario; se borra al cerrar sesión o con «Conversación nueva». No se guarda en `localStorage`: puede contener datos de personas.
