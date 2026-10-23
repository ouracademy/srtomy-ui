# Arquitectura

Guía para quien va a tocar el código: dónde va cada cosa y por qué. Si algo de aquí deja de ser cierto, corrige el documento en el mismo PR. Las reglas de escritura están en [code-style.md](code-style.md).

> La capa de API es código generado desde la especificación OpenAPI de srtomy-api (`app/(api)/generated/`). `person.ts` y `date.ts` son lo único escrito a mano que transforma respuestas.

## Principio: cercanía

El código vive **junto a lo que lo usa**. La ruta de la pantalla es el contexto.

- Un componente o hook que solo usa una pantalla va **en la carpeta de esa pantalla**, junto a su `page.tsx`.
- Un componente o hook que usan dos o más pantallas va en una carpeta global con nombre de tipo: `app/(components)/` o `app/(hooks)/`.
- `app/(api)/` es la excepción: todo lo que habla con srtomy-api vive ahí, porque se genera de su especificación y las pantallas no deben conocerse entre sí.
- Una prueba unitaria va **al lado** del archivo que prueba (`date.ts` y `date.test.ts`).

```
app/
  (api)/                       Todo lo que habla con srtomy-api
    openapi/srtomy-api.json    Especificación OpenAPI versionada (fuente de la API)
    generated/                 NO versionado ni editable: tipos, funciones y hooks SWR (orval)
    client.ts                  Mutator de axios: token e interceptores (a mano)
    AuthTokenBridge.tsx        Entrega el token de Auth0 al cliente
    date.ts                    Convierte fechas ISO de las respuestas en Date
    person.ts                  Esquema zod de la persona (fecha de nacimiento en Date)
  (components)/                Compartidos por 2+ pantallas: Loading, ErrorMessage,
                               NotFoundMessage, ResourceError, SaveButton, ...
  (hooks)/                     Hooks de interfaz compartidos: useDebounce, usePagination, ...
  portal/                      Área autenticada
    layout.tsx                 PortalProviders (SWR, fechas en español, RequireAuth)
    MenuDrawer.tsx             Marco: barra superior, menú lateral y contenido
    LocationsDialog.tsx        Cambiar de sede (lo usa MenuDrawer)
    UserMenu.tsx               Perfil y cerrar sesión (lo usa MenuDrawer)
    [locId]/                   Una sede
      person/ location/ event/ Una carpeta por sección, con sus componentes, formularios y tablas
  error.tsx global-error.tsx not-found.tsx    Límites de error de Next
```

Los paréntesis en `(api)`, `(components)` y `(hooks)` son _route groups_ de Next: agrupan archivos sin crear una ruta.

### Dónde pongo...

| Quiero agregar...                                    | Va en...                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Un endpoint nuevo de srtomy-api                      | Agrégalo en la API, luego `pnpm api:sync` regenera el hook y el tipo en `app/(api)/generated/` |
| Una pantalla                                         | `app/portal/[locId]/<sección>/page.tsx`                                                        |
| Un componente de una sola pantalla                   | Al lado de su `page.tsx`                                                                       |
| Un componente que ya usan dos o más pantallas        | `app/(components)/`                                                                            |
| Un hook de interfaz que usan dos o más               | `app/(hooks)/`                                                                                 |
| Lógica pura (cálculos, transformaciones)             | Un `.ts` junto a quien la usa, con su `.test.ts`                                               |
| Convertir un formulario en el cuerpo de una petición | Junto al formulario que conoce sus campos                                                      |
| Una variable de entorno                              | `app/env.ts` (esquema y lectura explícita) y `.env.example`                                    |

## Datos: cómo se lee y cómo se escribe

La regla: **los componentes no construyen URLs ni usan axios**. Piden datos y modifican con lo que genera `app/(api)/generated/` a partir de la especificación.

### Generación

`app/(api)/openapi/srtomy-api.json` es la fuente. Cada tag de OpenAPI produce un archivo en `app/(api)/generated/` (`people`, `events`, `organizations`, `complaints`), con sus tipos, sus funciones y sus hooks SWR.

- `pnpm api:sync` descarga la especificación de la API en local (o `API_DOCS_URL`) y la guarda en el repo. Se ejecuta cuando cambia la API y el cambio viaja en el PR.
- `pnpm api:generate` regenera `generated/`. Corre solo al hacer `pnpm install`, `dev`, `build`, `typecheck`, `test` y `lint`; no hace falta ejecutarlo a mano.
- Nunca se edita `generated/`: está fuera del repo (`.gitignore`) y se reconstruye en cada corrida.

### Lecturas con SWR

SWR identifica cada lectura con una _clave_. En el código generado, la clave es la URL del endpoint (con sus parámetros), así que dos pantallas que piden lo mismo comparten caché y una sola petición. Para pausar una lectura hasta tener un dato, el hook acepta `null` como clave, igual que SWR.

Los hooks devuelven lo de SWR (`data`, `error`, `isLoading`, `mutate`). El tipo de la respuesta sale de la especificación.

### Escrituras

Son funciones asíncronas generadas sobre el mismo cliente; no son hooks. La pantalla las llama, avisa al usuario y revalida la lectura que mostró el dato:

```ts
await updatePerson(id, toPersonPayload(formValues, locId));
mutatePerson();
alert.showMessage("Guardado exitosamente");
```

La conversión formulario → cuerpo (por ejemplo `toPersonPayload`) vive junto al formulario, que es quien conoce sus campos.

### Cliente HTTP

`app/(api)/client.ts` crea **un solo** cliente axios y es el mutator que usa el código generado:

- `baseURL` = `NEXT_PUBLIC_API_URL` (solo el origen). Las rutas de la especificación ya incluyen `/v1`.
- Un interceptor de petición agrega `Authorization: Bearer <token>`. Si no hay token (visitante anónimo, como en el libro de reclamaciones) la petición sale sin él y la API decide.
- Un interceptor de respuesta convierte las fechas ISO con hora en `Date` (`date.ts`). Las fechas sin hora (`yyyy-MM-dd`) quedan como texto; el esquema de la persona las interpreta.

## Autenticación

1. `app/Providers.tsx` monta `Auth0Provider` y `AuthTokenBridge`, que entrega a `client.ts` la función para obtener el token.
2. `app/portal/layout.tsx` envuelve el portal en `PortalProviders`, que incluye `RequireAuth`: si no hay sesión redirige a Auth0 y **no renderiza** las páginas ni sus peticiones hasta tenerla.
3. El guard del frontend mejora la experiencia, no es seguridad: **la API es quien autoriza**.

El identificador de la iglesia llega como claim `https://sr-tommy.com/orgId` del token.

## Carga, vacío y error

Toda pantalla que lee datos trata los tres estados:

```tsx
const { data, error, isLoading } = useEvent(id);

if (isLoading) return <Loading />;
if (!data) return <ResourceError error={error} />;
```

- `ResourceError` muestra «No encontrado» si la API respondió 404 y, para cualquier otro fallo, un mensaje con botón **Reintentar** (revalida todas las claves de SWR).
- Además, `PortalProviders` configura `onError` global: cada petición fallida muestra el aviso «No se pudo cargar la información».
- Los errores de renderizado los atrapan `app/error.tsx`, `app/portal/error.tsx` y `app/global-error.tsx`; las rutas inexistentes, `app/not-found.tsx`.

## Formularios

`react-hook-form` con `zod` como resolver, a través de `react-hook-form-mui`. El esquema de zod es la fuente de verdad del tipo de los valores (`z.infer`) y de los mensajes de validación, que están en español.

El botón de envío muestra el estado de carga con `formState.isSubmitting`, que `FormContainer` mantiene mientras espera a `onSuccess`. Por eso el `onSuccess` debe hacer `await` de la llamada a la API.

## Pruebas

| Qué                               | Cómo                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Lógica pura, hooks, mutator       | Vitest junto al archivo. Para la red se reemplaza el _adapter_ de axios (ver `client.test.ts`). |
| Flujos de usuario y accesibilidad | Playwright en `tests/`, con Auth0 simulado y la API interceptada por prueba.                    |

Si cambia un endpoint, cambian dos cosas: la especificación (`pnpm api:sync`) y los `page.route` de los e2e que lo simulan.

## Deuda conocida

Cosas que el código hoy **no** hace; no son errores nuevos, conviene saberlas:

- Eliminar personas y guardar la edición de un grupo no hacen nada: el diálogo y el formulario existen, pero sus _handlers_ están vacíos (con un comentario). El formulario de un evento ya creado es de solo lectura. La API aún no está conectada para esas acciones.
- El pago con Culqi (`ProfileForm`) abre el checkout pero no envía el token a la API.
- Google Tag Manager se carga sin pedir consentimiento (`app/layout.tsx`).
- No hay Content-Security-Policy ni `X-Frame-Options`: el editor visual de Builder embebe el sitio en un iframe. Se agregan al retirar Builder.
- No hay reporte de errores en producción (Sentry u otro); los límites de error solo hacen `console.error`.
- Builder.io: `@builder.io/dev-tools` está fijado en 1.16.4 (la 1.94 rompe el build) y `next.config.js` tiene `turbopack: {}` y `images.remotePatterns` solo por él.
- `react-hooks/refs` está desactivado para `app/portal/[locId]/person/board/**`: el tablero pasa los objetos `provided` de `@hello-pangea/dnd` a `ref`, un uso documentado de la librería que la regla marca como falso positivo.

## Evolución propuesta

Lo que haría falta si el proyecto crece, en orden de utilidad:

1. **Colocar más cerca.** Varios componentes de `(components)/` los usa una sola pantalla (por ejemplo `EventForm` y `RecurrenceFields` solo los usa el módulo de eventos). Moverlos junto a esa pantalla refuerza la regla de cercanía; `(components)/` quedaría solo con lo realmente compartido.
2. **`useSWRMutation` para las escrituras.** Da estado de «guardando» y errores por operación sin `useState` manual, y puede invalidar claves tras escribir. Las funciones generadas se pueden envolver sin cambiar a sus llamadores.
3. **Claves de SWR con una fábrica por recurso** (`peopleKeys.detail(id)`), si empieza a haber invalidaciones cruzadas (al guardar una persona, refrescar la lista). Hoy cada clave se repite en un solo hook, así que no hace falta.
4. **Componentes de servidor donde se pueda.** Casi todo el portal es `"use client"` porque depende del token de Auth0 en el navegador. Las páginas públicas (landing, legales, libro de reclamaciones) y el marco del portal sí podrían ser de servidor.
5. **Tipos de `params`.** Hoy cada `page.tsx` declara sus parámetros de ruta (`{ locId: number }`) aunque en ejecución son texto. Un tipo compartido con conversión explícita evitaría la confusión.
