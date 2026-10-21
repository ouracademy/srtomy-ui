# Estilo de código

Reglas para escribir código en este repo. Lo que una herramienta puede hacer cumplir (Prettier, ESLint, TypeScript) está en `pnpm check:fast`; aquí está lo demás y el porqué. Para saber **dónde** va el código, ver [architecture.md](architecture.md).

## Lo hace la herramienta, no lo discutas

- **Formato**: Prettier. Tu editor lo aplica al guardar (`.vscode/settings.json`), Claude Code lo aplica al editar y `pnpm format` lo aplica a todo. No pelees con él.
- **Tipos**: TypeScript en `strict` con `noUncheckedIndexedAccess` y `noImplicitReturns`. Acceder a `lista[i]` o `mapa[clave]` da `T | undefined`: trátalo.
- **Lint**: `no-explicit-any`, `no-console`, `no-unused-vars` y las reglas de hooks de React son errores. No agregues `@ts-ignore`, `eslint-disable` ni pruebas omitidas para que algo pase; arregla la causa. Si una regla da un falso positivo, la excepción va acotada en `eslint.config.mjs`, con un comentario que la explique.

## Idioma

- Código, identificadores y comentarios: **inglés**.
- Todo texto que ve el usuario (etiquetas, mensajes, validaciones, `alt`, `aria-label`): **español**. Va escrito directamente en el componente; no hay librería de traducción.
- Commits y títulos de PR: Conventional Commits en inglés, en minúsculas y modo imperativo (`fix: send person ids in attendance`).

## TypeScript

- Prefiere `type` a `interface`, salvo que necesites extender una declaración existente.
- `unknown` en lugar de `any`. Si vas a leer algo `unknown`, acótalo (`isAxiosError(error)`, un esquema de zod).
- No uses `!` (aserción de no nulo) para callar un posible `undefined`: maneja el caso.
- Los tipos de la API viven en `app/(api)/types.ts`; los de un formulario salen de su esquema (`z.infer`).
- Importa con `@/` entre carpetas distintas y con ruta relativa dentro de la misma carpeta.
- El id de cualquier entidad de srtomy-api (persona, organización/sede/grupo, evento, rol) es siempre `string` (UUID), nunca `number`. No lo conviertas con `Number(...)`/`parseInt(...)` ni lo valides con `z.number()`; tampoco lo tipes como `number | string` "por si acaso". Esto aplica a los tipos en `types.ts`, los esquemas zod que validan ids seleccionados en un formulario (roles, ponentes, miembros, líderes) y los `params` de una ruta `[id]`/`[locId]`.

## Componentes

- Una página es la exportación `default` de su `page.tsx`. Los componentes compartidos usan exportación nombrada.
- Las props se tipan con `Readonly<...>` (lo exige SonarCloud).
- Pon `"use client"` solo donde hace falta: hooks, eventos o APIs del navegador.
- **No definas un componente dentro de otro** (por ejemplo con `styled(...)` dentro del render): se recrea en cada render y pierde su estado. Súbelo al nivel del módulo.
- Un componente que pasa de ~200 líneas suele estar haciendo dos cosas: extrae la parte con nombre propio **junto a él** (ver `UserMenu` y `LocationsDialog` junto a `MenuDrawer`).
- Nombres sin sufijos numéricos ni erratas (`MenuDrawer2`, `ToogleButton`): si hay dos versiones, una sobra.

## Estado y efectos

- **Deriva en lugar de sincronizar.** Si un valor se calcula a partir de otro, calcúlalo durante el render (`useMemo` si es costoso); no lo copies a un `useState` desde un `useEffect`. Ejemplo: la selección de asistencia es «lo que el usuario eligió, o lo guardado en la API».
- No leas ni escribas `ref.current` durante el render.
- No mutes datos que vienen de SWR, de props ni constantes de módulo: copia primero.

## Datos

- Toda llamada a la API pasa por `app/(api)/services`. Nada de `axios`, `fetch` ni URLs sueltas en componentes.
- Toda pantalla que lee datos maneja **carga, error y no encontrado** (`Loading` y `ResourceError`). Un `if (!data) return <div>Not found</div>` es un error: mientras carga `data` también es `undefined`.
- Tras una escritura: avisa al usuario (`alert.showMessage`) y revalida con el `mutate` del hook correspondiente.

## Comentarios y logs

- Comenta el **porqué**, no el qué. Si el código necesita un comentario para entenderse, quizá necesita un mejor nombre.
- No dejes código comentado: está en git. Tampoco `TODO` en el código: abre un issue.
- `console.warn` y `console.error` están permitidos; `console.log` no. Nunca registres tokens ni datos personales.

## Interfaz y accesibilidad

- Todo control interactivo tiene nombre accesible; toda imagen, `alt`; todo formulario muestra sus errores de validación.
- Contraste de texto de al menos 4,5:1 (WCAG AA). `tests/a11y.spec.ts` lo verifica con axe en las pantallas principales; si agregas una pantalla de formulario, agrégala allí.
- No anides elementos interactivos (un `<button>` dentro de un `<a>`): usa `<Button component={NextLink} href=...>`.
- Imágenes con `next/image`, no `<img>`.
- Estilos con `sx` de MUI. Evita colores sueltos nuevos: usa el tema o, si no hay alternativa, comprueba el contraste.

## Pruebas

- Lógica pura, hooks y servicios: prueba unitaria al lado del archivo (`foo.ts` y `foo.test.ts`).
- Un flujo de usuario nuevo o modificado: prueba e2e en `tests/`, con la API interceptada.
- Un bug corregido lleva una prueba que falla sin la corrección.

## Dependencias

- Antes de agregar una librería, comprueba que MUI, SWR, react-hook-form, zod o date-fns no resuelvan ya el problema. Justifica la nueva en el PR.
- No agregues nada que dependa de Builder.io: se está retirando.
