# Implementation Plan: Compartir eventos y cursos (UI)

## Decisiones

- **`ShareEventDialog`** es un componente de datos y callbacks, probado con user-event; **`ShareEventButton`** lo conecta a los hooks generados y traduce cada cambio en un aviso (`run`).
- **Vocabulario** (`app/(components)/eventSharing.ts`): etiquetas, qué roles de enlace admite un curso y la frase de resumen.
- **Página del enlace**: `app/e/[slug]/` — `page.tsx` (sesión y datos), `SharedEventPage` (presentacional), `eventWhen` (cuándo, en palabras).
- **Compartidos contigo**: `SharedWithMe` en `/portal`.
- Los botones llenos usan `primaryButtonSx` (sin transición: axe mide el color real).

## Estructura

```text
app/(components)/eventSharing.ts
app/portal/[nodeId]/event/[id]/attendance/{ShareEventButton,ShareEventDialog}.tsx
app/e/[slug]/{page,SharedEventPage}.tsx, eventWhen.ts
app/portal/SharedWithMe.tsx
tests/sharing.spec.ts
```
