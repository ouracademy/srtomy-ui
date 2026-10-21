# Arquitectura

Guía para quien va a tocar el código: dónde va cada cosa y por qué. Si algo de aquí deja de ser cierto, corrige el documento en el mismo PR.

## Principio: cercanía

El código vive **junto a lo que lo usa**. No hay carpetas globales por tipo (`features/`, `hooks/`, `utils/`) ni por funcionalidad; la ruta de la pantalla es el contexto.

- Un componente que solo usa una pantalla va **en la carpeta de esa pantalla**, junto a su `page.tsx`.
- Un componente que usan varias pantallas va en `app/(components)/`.
- Los tipos y las llamadas a la API **no** siguen esta regla: viven en `app/(api)/` (ver abajo), porque son compartidos por naturaleza y las pantallas no deben conocerse entre sí.
- Una prueba unitaria va **al lado** del archivo que prueba (`date.ts` y `date.test.ts`).

```
app/
  (api)/                       Todo lo que habla con srtomy-api
    client.ts                  Único cliente HTTP (axios), token e interceptores
    AuthTokenBridge.tsx        Entrega el token de Auth0 al cliente
    date.ts                    Convierte fechas ISO de las respuestas en Date
    person.ts                  Esquema zod de una persona
    pagination.ts              Tipo de página de Spring
    types.ts                   Forma de las respuestas de la API
    services/
      people.ts                /people
      organizations.ts         iglesias, sedes, grupos, roles
      events.ts                eventos y asistencia
      complaints.ts            libro de reclamaciones
  (components)/                Compartidos: Loading, ErrorMessage, NotFoundMessage,
                               ResourceError, SaveButton, EventForm, ...
  portal/                      Área autenticada
    layout.tsx                 PortalProviders (SWR, fechas en español, RequireAuth)
    MenuDrawer.tsx             Marco: barra superior, menú lateral y contenido
    LocationsDialog.tsx        Cambiar de sede (lo usa MenuDrawer)
    UserMenu.tsx               Perfil y cerrar sesión (lo usa MenuDrawer)
    [locId]/                   Una sede
      person/ location/ event/ Una carpeta por sección, con sus formularios y tablas
  error.tsx global-error.tsx not-found.tsx    Límites de error de Next
```

Los paréntesis en `(api)` y `(components)` son _route groups_ de Next: agrupan archivos sin crear una ruta.

### Dónde pongo...

| Quiero agregar...                             | Va en...                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Una llamada nueva a la API                    | Una función o hook en `app/(api)/services/<recurso>.ts`, más su tipo en `types.ts` |
| Una pantalla                                  | `app/portal/[locId]/<sección>/page.tsx`                                            |
| Un componente de una sola pantalla            | Al lado de su `page.tsx`                                                           |
| Un componente que ya usan dos o más pantallas | `app/(components)/`                                                                |
| Lógica pura (cálculos, transformaciones)      | Un `.ts` junto a quien la usa, con su `.test.ts`                                   |
| Una variable de entorno                       | `app/env.ts` (esquema y lectura explícita) y `.env.example`                        |

## Datos: cómo se lee y cómo se escribe

La regla: **los componentes no construyen URLs ni usan axios**. Piden datos con un hook y modifican con una función, y ambos viven en `app/(api)/services`.

### Lecturas con SWR

SWR identifica cada lectura con una _clave_. Aquí **la clave es la URL** (o `[url, { params }]`), y un único `fetcher` global (en `app/portal/PortalProviders.tsx`) la ejecuta con el cliente HTTP. Por eso cada hook de servicio es una línea:

```ts
// app/(api)/services/people.ts
export const usePerson = (id: number | string) => useSWR(`/people/${id}`);

export const usePeople = <T = PersonResponse>(params: PeopleParams) =>
  useSWR<SpringPage<T>>(["/people", { params }]);
```

Dos pantallas que piden la misma clave comparten caché y una sola petición. Para pausar una lectura hasta tener un dato, el hook acepta `undefined` y usa clave `null`:

```ts
export const useOrganization = <T = LocationDetail>(id: Id | undefined) =>
  useSWR<T>(id ? `/organizations/${id}` : null);
```

Los hooks devuelven lo de SWR (`data`, `error`, `isLoading`, `mutate`). El tipo de la respuesta se declara en el hook; si una pantalla necesita otra forma, el hook es genérico (`usePeople<PersonListItem>`).

### Escrituras

Son funciones asíncronas simples sobre `apiClient`; no son hooks. La pantalla las llama, avisa al usuario y revalida con el `mutate` del hook que mostró el dato:

```ts
await updatePerson(id, toPersonPayload(formValues, locId));
mutatePerson();
alert.showMessage("Guardado exitosamente");
```

El cuerpo de la petición tiene su tipo en el servicio (`PersonPayload`). La conversión formulario → cuerpo (por ejemplo `toPersonPayload`) vive junto al formulario, que es quien conoce sus campos.

### Cliente HTTP

`app/(api)/client.ts` crea **un solo** cliente axios:

- `baseURL` = `NEXT_PUBLIC_API_URL` + `/v1`.
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

## Pruebas

| Qué                               | Cómo                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Lógica pura, hooks, capa de API   | Vitest junto al archivo. Para la red se reemplaza el _adapter_ de axios (ver `client.test.ts`). |
| Flujos de usuario y accesibilidad | Playwright en `tests/`, con Auth0 simulado y la API interceptada por prueba.                    |

Si cambias la URL de un endpoint, cambian tres cosas: el servicio, su prueba (`services.test.ts` o `hooks.test.tsx`) y los `page.route` de los e2e que lo simulan.

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
2. **`useSWRMutation` para las escrituras.** Da estado de «guardando» y errores por operación sin `useState` manual, y puede invalidar claves tras escribir. Las funciones actuales de los servicios se pueden envolver sin cambiar a sus llamadores.
3. **Claves de SWR con una fábrica por recurso** (`peopleKeys.detail(id)`), si empieza a haber invalidaciones cruzadas (al guardar una persona, refrescar la lista). Hoy cada clave se repite en un solo hook, así que no hace falta.
4. **Generar los tipos de la API** desde su OpenAPI, si srtomy-api lo publica, y dejar `types.ts` solo para los tipos del frontend.
5. **Componentes de servidor donde se pueda.** Casi todo el portal es `"use client"` porque depende del token de Auth0 en el navegador. Las páginas públicas (landing, legales, libro de reclamaciones) y el marco del portal sí podrían ser de servidor.
6. **Tipos de `params`.** Hoy cada `page.tsx` declara sus parámetros de ruta (`{ locId: number }`) aunque en ejecución son texto. Un tipo compartido con conversión explícita evitaría la confusión.
