# Implementation Plan: 003 en la UI

**Spec**: [spec.md](./spec.md)

## Decisiones

- La ruta `app/portal/[locId]` pasa a `app/portal/[nodeId]`, porque un nodo puede ser una iglesia, una sede, un grupo o un ministerio.
- Lógica pura en `app/portal/organizationTree.ts`: `pathTo`, `churchOf`, `buildForest`, `flatten` y `pickLandingNode`. `app/portal/lastNode.ts` usa `localStorage` dentro de try/catch.
- `app/(hooks)/usePermissions.ts` envuelve `GET /me/permissions`.
- `OrganizationPicker` reemplaza a `LocationsDialog`. `MenuDrawer` muestra la ruta del nodo y el nombre de la iglesia.
- `[nodeId]/location/page.tsx` según el tipo de nodo:
  - Iglesia o sede: `LocationForm` (sin roles, con redes) y la lista de sedes o de grupos.
  - Grupo o ministerio: `GroupForm` y la lista de subgrupos.
  - Abrir un hijo lo vuelve el nodo actual. Se elimina `groups/[id]`.
- Rutas nuevas: `[nodeId]/location/new` para registrar una sede (en una iglesia) y `[nodeId]/positions` para los cargos.
- Se eliminan `app/portal/location/create`, `Roles.tsx` y `LocationPayload.ts`.
- Componentes compartidos nuevos: `SocialLinks`/`SocialLinksFields` ("Otras opciones"), `NamesInput` (lista libre con autocompletado) y `TelFieldElement`, que ahora usan tres pantallas.
- Se agrega `@testing-library/user-event` (con `@testing-library/dom`) para las pruebas de interacción.

## Verificación

- `pnpm check:fast`, con cobertura ≥ 80 %.
- Playwright: `tests/onboarding.spec.ts` (nuevo) y las pruebas existentes adaptadas. `tests/fixtures.ts` simula `/me`, `/me/organizations` y `/me/permissions`.
