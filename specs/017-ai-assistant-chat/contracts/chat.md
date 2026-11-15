# Contrato: `POST /chat` (srtomy-agent)

El portal habla con el agente por un único endpoint. El formato de los mensajes y del stream es el del AI SDK (`UIMessage` y su stream de mensajes de UI); aquí va lo que es propio de Sr. Tommy.

## Petición

```http
POST /chat
Authorization: Bearer <access token de Auth0, el mismo que usa srtomy-api>
Content-Type: application/json
```

```json
{
  "messages": [],
  "context": {
    "nodeId": "3f0c…",
    "eventId": "9a1b…",
    "personId": null,
    "timeZone": "America/Lima"
  }
}
```

- `messages`: el historial que mantiene `useChat`, incluidas las respuestas a aprobaciones.
- `context.nodeId` es obligatorio; `eventId`, `personId` y `timeZone` son opcionales. El agente no confía en ellos para permisos: solo le dicen al modelo dónde está el usuario. El nombre del nodo lo lee el agente de srtomy-api con el token del usuario; si la API responde 403 o 404, la petición se rechaza.

## Respuesta

`200` con el stream de mensajes de UI del AI SDK (texto progresivo, partes de herramienta y solicitudes de aprobación).

Una solicitud de aprobación llega como una parte de herramienta con `state: "approval-requested"` y:

- `approval.id`: lo que la UI devuelve con `addToolApprovalResponse({ id, approved })`.
- `approval.requestReason`: la acción en palabras, en español, armada por el servidor («Crear evento: Ensayo de alabanza, viernes 20 de noviembre, 7:00 p. m.»).
- `input`: los datos exactos de la llamada.

## Errores

| Código | Cuándo                                                | Qué hace la UI                                    |
| ------ | ----------------------------------------------------- | ------------------------------------------------- |
| 401    | Sin token, vencido o de otro emisor o audiencia       | Pide iniciar sesión de nuevo; conserva lo escrito |
| 403    | El usuario no puede ver el nodo de `context`          | Dice que no tiene acceso a ese nodo               |
| 422    | Cuerpo que no cumple el esquema                       | Error genérico con reintento                      |
| 429    | Demasiados mensajes del mismo usuario (`Retry-After`) | Avisa y deshabilita enviar hasta ese momento      |
| 503    | Falta la llave del modelo o el modelo no responde     | Error con reintento                               |

Una aprobación con firma inválida no es un error HTTP: la herramienta no se ejecuta y el stream lo informa como una acción no realizada.

## Reglas

- CORS: solo los orígenes del portal configurados; `Authorization` permitido; sin cookies.
- El servidor no guarda la conversación ni registra su texto.
- Las herramientas que escriben nunca se ejecutan en la misma petición en la que el modelo las pide: siempre hay una vuelta por el usuario.
