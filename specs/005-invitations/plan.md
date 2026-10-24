# Implementation Plan: Invitaciones (UI)

## Summary

Sin dependencias nuevas. `pnpm api:sync` trae el tag `invitations` y el campo `email` de las personas.

## Decisiones

- **Pestaña «Invitaciones»** en `positions/page.tsx`; `InvitationsPanel` es un componente puro (datos y callbacks) probado con user-event. La validación del formulario es un esquema zod en `invitationForm.ts`.
- **Página pública** `app/invitacion/[token]/`: `page.tsx` conecta Auth0 y los hooks; `InvitationAccept` es presentacional. Hay que llamar a `GET /me` antes de aceptar: registra al usuario en el API.
- **Volver tras el login**: `Auth0Provider.onRedirectCallback` usa `returnToFrom(appState)` (`app/returnTo.ts`), que solo acepta rutas del sitio.
- **Portal**: `PendingInvitations` en `/portal`.
- **Líderes**: `GroupAutocomplete` pasa el correo de cada opción; `leaderInvitations.ts` invita a cada líder con correo tras guardar y resume el resultado. Un fallo no detiene a los demás.

## Estructura

```text
app/invitacion/[token]/{page,InvitationAccept}.tsx (+ test)
app/returnTo.ts
app/portal/PendingInvitations.tsx
app/portal/[nodeId]/positions/{InvitationsPanel.tsx,invitationForm.ts}
app/portal/[nodeId]/location/groups/{leaderInvitations.ts,GroupForm.tsx}
tests/invitations.spec.ts
```
