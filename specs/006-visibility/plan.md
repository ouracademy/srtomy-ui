# Implementation Plan: Visibilidad (UI)

## Decisiones

- **Un componente para los cuatro formularios**: `VisibilityFields` (`app/(components)/`) usa los campos `schedule`, `memberVisibility` y `showOrgChart` del formulario; `visibility.ts` tiene el esquema, las conversiones y las etiquetas. Los esquemas de sede y grupo lo extienden con `visibilitySchema.shape`.
- **Directorio**: `directoryTree.ts` arma el árbol (el API lo entrega plano), `DirectoryList` lo pinta y `PeopleList` muestra la gente de un nodo; `page.tsx` pide `directory-entry` solo al abrir un nodo.
- **Página pública**: `app/g/[slug]/` (fuera del portal), `PublicPage` presentacional.
- **Copiar enlace**: `copyLink` con aviso si el portapapeles no está disponible.

## Estructura

```text
app/(components)/{visibility.ts,VisibilityFields.tsx,copyLink.ts,buttonStyles.ts}
app/portal/[nodeId]/directory/{page,DirectoryList,PeopleList,directoryTree}
app/g/[slug]/{page,PublicPage}.tsx
tests/visibility.spec.ts, tests/a11y.spec.ts
```
