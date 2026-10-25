# Implementation Plan: Mi espacio (UI)

## Decisiones

- **Ruta** `app/portal/me/` (`page.tsx`, `MyEvents`, `MyNodes`). Una ruta estática gana a `[nodeId]`, así que `me` no choca con un id.
- **Destino por defecto**: `app/portal/page.tsx` pide los permisos del nodo de aterrizaje (`usePermissions`) y, si `hasManagementAccess` (cualquier permiso más allá de `org.read` y `events.read`) es falso, va a `/portal/me`.
- **Directorio compartido**: `DirectoryList`, `PeopleList` y `directoryTree` pasan a `app/(components)/directory/` y `ChurchDirectory` (carga + lista) lo usan la pantalla Directorio y Mi espacio, sin duplicar.
- **Aceptar invitaciones**: `useAcceptInvitation` (hook de `app/portal/`) lo usan `/portal` y Mi espacio; cada uno decide a dónde ir con `onJoined`.
- **Menú**: `PortalMenu` es la lista lateral compartida; el layout del nodo agrega «Mi espacio» y filtra por permisos (`needs` ahora es «alguno de»).
- `SharedWithMe` y `PendingInvitations` reciben `showEmpty` para mostrar la sección vacía.
- API generada con `pnpm api:sync` (`/me/nodes`, `/me/events`).

## Estructura

```text
app/portal/me/{page,MyEvents,MyNodes}.tsx
app/portal/{PortalMenu,useAcceptInvitation}.ts(x)
app/(components)/directory/{ChurchDirectory,DirectoryList,PeopleList,directoryTree}
app/(hooks)/usePermissions.ts   (hasManagementAccess)
tests/my-space.spec.ts, tests/a11y.spec.ts
```
