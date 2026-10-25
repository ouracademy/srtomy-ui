# Estilo de código

Reglas para escribir código en este repo. Lo que una herramienta puede hacer cumplir (Prettier, ESLint, TypeScript) está en `pnpm check:fast`; aquí está lo demás y el porqué. Para saber **dónde** va el código, ver [architecture.md](architecture.md).

## Estructura

Dos reglas: **proximidad** para lo que usa una sola pantalla, y **globales con nombre de tipo** solo para lo que usan varias.

- Una pantalla y todo lo que solo ella usa (componentes, formularios, helpers, pruebas) vive en su carpeta, junto a su `page.tsx`.
- Lo compartido va en carpetas globales dentro de `app/`: `app/(components)/` para componentes y `app/(hooks)/` para hooks de interfaz. No crees `utils/`, `features/` ni `lib/`.
- Un componente o hook se mueve a global cuando lo usa una **segunda** pantalla. Antes de eso, se queda junto a la primera.
- `app/(api)/` es la única frontera con srtomy-api:
  - `openapi/srtomy-api.json`: la especificación OpenAPI, versionada. Es la fuente de verdad de la API. Cambiarla forma parte del PR que cambia la API (`pnpm api:sync`).
  - `generated/`: generado por orval a partir de la especificación. **No se versiona ni se edita.** Contiene tipos, funciones y hooks SWR por cada tag de OpenAPI. Cambios en él se hacen regenerando, nunca a mano.
  - `client.ts`, `date.ts` y `AuthTokenBridge.tsx`: a mano. El mutator de axios vive en `client.ts`.
- Si un endpoint que necesitas no existe en la especificación, no lo escribas a mano en `(api)`: pídelo a srtomy-api y resincroniza la especificación.
- La lógica de negocio no va en `generated/` ni en `(api)/`. Por ejemplo, convertir valores de un formulario en el cuerpo de una petición se escribe junto al formulario.

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
- Los tipos de la API vienen de `app/(api)/generated/`; no los escribas a mano ni los copies a otro archivo. Los de un formulario salen de su esquema (`z.infer`).
- Importa con `@/` entre carpetas distintas y con ruta relativa dentro de la misma carpeta.
- El id de cualquier entidad de srtomy-api (persona, organización/sede/grupo, evento, cargo) es siempre `string` (UUID), nunca `number`. No lo conviertas con `Number(...)`/`parseInt(...)` ni lo valides con `z.number()`; tampoco lo tipes como `number | string` "por si acaso". Esto aplica a los tipos del frontend, los esquemas zod que validan ids seleccionados en un formulario (cargos, ponentes, miembros, líderes) y los `params` de una ruta `[id]`/`[nodeId]`.

## Componentes

- Una página es la exportación `default` de su `page.tsx`. Los componentes compartidos usan exportación nombrada.
- Las props se tipan con `Readonly<...>` (lo exige SonarCloud).
- Pon `"use client"` solo donde hace falta: hooks, eventos o APIs del navegador.
- **No definas un componente dentro de otro** (por ejemplo con `styled(...)` dentro del render): se recrea en cada render y pierde su estado. Súbelo al nivel del módulo.
- Un componente que pasa de ~200 líneas suele estar haciendo dos cosas: extrae la parte con nombre propio **junto a él** (ver `UserMenu` y `OrganizationPicker` junto a `MenuDrawer`).
- Nombres sin sufijos numéricos ni erratas (`MenuDrawer2`, `ToogleButton`): si hay dos versiones, una sobra.

## Estado y efectos

- **Deriva en lugar de sincronizar.** Si un valor se calcula a partir de otro, calcúlalo durante el render (`useMemo` si es costoso); no lo copies a un `useState` desde un `useEffect`. Ejemplo: la selección de asistencia es «lo que el usuario eligió, o lo guardado en la API».
- No leas ni escribas `ref.current` durante el render.
- No mutes datos que vienen de SWR, de props ni constantes de módulo: copia primero.

## Datos

- Toda llamada a la API pasa por `app/(api)/generated/` (hooks y funciones generados). Nada de `axios`, `fetch` ni URLs sueltas en componentes ni en código a mano fuera de `(api)`.
- Toda pantalla que lee datos maneja **carga, error y no encontrado** (`Loading` y `ResourceError`). Un `if (!data) return <div>Not found</div>` es un error: mientras carga `data` también es `undefined`.
- Tras una escritura: avisa al usuario (`alert.showMessage`) y revalida con el `mutate` del hook correspondiente.
- Todo botón que llama a la API muestra un spinner y queda bloqueado mientras dura la petición (`SaveButton` o `Button` con el `loading` prop). Ver [el skill `api-submit-button`](../.claude/skills/api-submit-button/SKILL.md).

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

- Lógica pura y hooks: prueba unitaria al lado del archivo (`foo.ts` y `foo.test.ts`). El código generado no se prueba; sí el mutator de `client.ts`.
- Un flujo de usuario nuevo o modificado: prueba e2e en `tests/`, con la API interceptada.
- Un bug corregido lleva una prueba que falla sin la corrección.

## Dependencias

- Antes de agregar una librería, comprueba que MUI, SWR, react-hook-form, zod o date-fns no resuelvan ya el problema. Justifica la nueva en el PR.
- No agregues nada que dependa de Builder.io: se está retirando.
