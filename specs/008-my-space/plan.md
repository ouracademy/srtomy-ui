# Implementation Plan: Mi espacio (UI)

## Decisiones

- **Ruta** `app/portal/me/` (`page.tsx`, `MyEvents`, `MyNodes`). Una ruta estática gana a `[nodeId]`, así que `me` no choca con un id.
- **Destino por defecto**: `app/portal/page.tsx` manda a `/portal/me` a quien tiene algún nodo accesible; no depende de los permisos ni del último nodo visitado (`saveLastNode` se sigue guardando).
- **Directorio**: `DirectoryList`, `PeopleList`, `directoryTree` y `ChurchDirectory` pasan a `app/(components)/directory/`. Mi espacio no lo muestra (decisión del dueño); lo usa solo la pantalla Directorio del nodo.
- **Aceptar invitaciones**: `useAcceptInvitation` (hook de `app/portal/`) lo usan `/portal` y Mi espacio; cada uno decide a dónde ir con `onJoined`.
- **Menú**: `PortalMenu` es la lista lateral compartida; el layout del nodo agrega «Mi espacio» y filtra por permisos (`needs` ahora es «alguno de»).
- `SharedWithMe` y `PendingInvitations` reciben `showEmpty` para mostrar la sección vacía.
- API generada con `pnpm api:sync` (`/me/nodes`, `/me/events`).

## Estructura

```text
app/portal/me/{page,MyEvents,MyNodes}.tsx
app/portal/{PortalMenu,useAcceptInvitation}.ts(x)
app/(components)/directory/{ChurchDirectory,DirectoryList,PeopleList,directoryTree}
tests/my-space.spec.ts, tests/a11y.spec.ts
```
