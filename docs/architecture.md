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
  e/[slug]/                    Página del enlace de un evento o curso (ver e inscribirse)
  g/[slug]/                    Página pública de un nodo (iglesia, sede, grupo o ministerio)
  invitacion/[token]/          Página pública de una invitación (aceptarla); returnTo.ts decide a dónde volver tras el login
  portal/                      Área autenticada
    me/                        «Mi espacio» (/portal/me): mis eventos y cursos, mis grupos, compartidos e invitaciones
    layout.tsx                 PortalProviders (SWR, fechas en español, RequireAuth)
    MenuDrawer.tsx             Marco: barra superior, menú lateral y contenido
    OrganizationPicker.tsx     Cambiar de iglesia, sede o grupo (lo usa MenuDrawer)
    organizationTree.ts        Árbol de nodos del usuario (GET /me/organizations): ruta, iglesia, nodo inicial
    CreateChurchForm.tsx       Alta de iglesia con su primera sede, sus cargos con nivel y su propio cargo (página /portal)
    UserMenu.tsx               Perfil y cerrar sesión (lo usa MenuDrawer)
    [nodeId]/                  Un nodo: iglesia, sede, grupo o ministerio (anidables)
      person/ location/ event/ positions/
                               Una carpeta por sección, con sus componentes, formularios y tablas

  error.tsx global-error.tsx not-found.tsx    Límites de error de Next
```

Los paréntesis en `(api)`, `(components)` y `(hooks)` son _route groups_ de Next: agrupan archivos sin crear una ruta.

### Dónde pongo...

| Quiero agregar...                                    | Va en...                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Un endpoint nuevo de srtomy-api                   | Agrégalo en la API, luego `pnpm api:sync` regenera el hook y el tipo en `app/(api)/generated/` |
| Una pantalla                                         | `app/portal/[nodeId]/<sección>/page.tsx`                                                       |
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
await updatePerson(id, toPersonPayload(formValues, nodeId));
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

Las iglesias del usuario **no** vienen en el token: `GET /me/organizations` devuelve los nodos a los que tiene acceso (iglesias, sedes, grupos y ministerios, con su `parentId`) y `organizationTree.ts` arma el árbol, la ruta de la barra superior y el nodo al que entra (`lastNode.ts` recuerda el último). Un usuario sin iglesias ve el alta de iglesia en `/portal`.

### Permisos

Los accesos funcionan como IAM de GCP, pero **nacen del cargo**: cada cargo de la iglesia (Pastor, Diácono, Catequista...) da una lista de permisos, y quien lo tiene —a través de la persona vinculada a su usuario— obtiene esos permisos en el nodo donde tiene el cargo y en todo lo que cuelga de él. Un cargo sin permisos es solo un nombre. El API guarda los permisos de un cargo como la unión de sus **roles** (grupos de permisos, vinculados) y sus permisos sueltos; **la UI solo muestra y edita permisos**, agrupados por módulo, y deja los roles para cuando haga falta. **Propietario** es la excepción: no se agrega a un cargo, se agrega aparte. `usePermissions(nodeId)` (`app/(hooks)/`) pide `GET /me/permissions` y responde `can("members.write")`, etc. La UI solo **oculta** lo que el usuario no puede hacer (menú, botones de guardar, crear o borrar); la API rechaza con 403 cualquier petición sin permiso, incluida la escalada de privilegios (dar un cargo con más permisos de los que uno tiene). Los mensajes de error de la API (`detail`) se muestran tal cual con `apiErrorMessage`.

Una sola pantalla, **Cargos y accesos** (`positions/`), con pestañas:

- **Cargos**: la tabla de cargos con cuántos permisos dan y cuántas personas los tienen. Cada fila se abre y muestra sus permisos por módulo (`PermissionPicker`, en `app/(components)/`, el mismo del alta de iglesia) y las personas que lo tienen, con su correo o «sin cuenta». Avisa antes de cambiar los permisos o borrar un cargo que da acceso a personas con cuenta. Un cargo nuevo puede nacer de un nombre sugerido (trae sus permisos habituales, una copia) o copiando los permisos de otro cargo.
- **Personas con acceso** (`access/AccessManager.tsx`, `AccessList`): solo lectura y con filtro, con el origen de cada acceso (cargo y nodo, liderazgo de grupo o Propietario). Hace falta `iam.read`.
- **Propietarios** (`OwnersPanel`): solo en la iglesia; se agregan y quitan por correo.

El formulario de persona muestra, al elegir un cargo, cuántos permisos da.

**Invitaciones.** Quien tiene `invitations.send` invita por correo desde la pestaña **Invitaciones** de «Cargos y accesos» (`InvitationsPanel`) y, al guardar un grupo o ministerio, a los líderes con correo (`leaderInvitations.ts`). El enlace del correo abre `/invitacion/{token}` (pública): quien lo abre inicia sesión con ese correo (Auth0 vuelve a la misma página gracias a `appState.returnTo`, que `returnToFrom` limita a rutas del sitio) y acepta; el API compara su correo **verificado** con el invitado. Quien ya tiene la sesión y un correo con invitaciones las ve en `/portal` (`PendingInvitations`).

**Correos en cola.** El API no envía el correo dentro de la petición: lo guarda en una cola (outbox) junto con la invitación o el compartido y una tarea de Cloud Tasks lo envía a los pocos segundos, reintentando si el proveedor falla. Por eso la respuesta normal trae `emailStatus: PENDING` («En cola»), no un error; solo `FAILED` es un problema («No salió»). La tabla de invitaciones muestra su estado (Enviado, En cola, No salió), se refresca sola mientras haya alguno en cola y ofrece «Reenviar», que vuelve a invitar al mismo correo.

**Visibilidad.** Cada nodo decide quién ve su lista de personas (`memberVisibility`: cualquiera con el enlace, toda la iglesia, solo los miembros, solo líderes) y tiene un horario; su información básica y sus líderes están siempre en el **Directorio** de la iglesia. Los formularios lo editan con `VisibilityFields` (sección «Horario y visibilidad»). La UI no calcula quién ve qué: el API ya entrega la lista vacía y `membersVisible=false` cuando corresponde. `/g/{slug}` es la página pública (sin sesión); el API solo nombra a adultos conocidos y nunca da edad, teléfono ni correo.

**Mi espacio.** `/portal/me` está abierta a cualquier usuario con sesión y muestra solo lo propio: `GET /me/events` (donde se inscribió o asistió), `GET /me/nodes` (donde su persona vinculada es miembro o líder), `GET /me/shared-events` y `GET /me/invitations`. Todos aterrizan ahí desde `/portal` tras iniciar sesión y de ahí abren su nodo; el menú de un miembro (solo `org.read` y `events.read`) no trae «Cargos y accesos», «Personas» ni el Dashboard. Cada sección carga y falla por su cuenta.

**Compartir.** Un evento o curso se comparte desde su detalle (`ShareEventButton` → `ShareEventDialog`): con personas por correo (Lector o Editor), con la iglesia o con cualquiera que tenga el enlace, y en un curso el enlace puede permitir inscribirse. `/e/{slug}` es la página del enlace: el API decide si el visitante la puede abrir (404 si no) y si puede inscribirse (`canRegister`); la inscripción no necesita cuenta. El nivel de acceso a un evento lo calcula el API (árbol de la iglesia, compartido con tu correo verificado o acceso general) y `GET/PUT/DELETE /events/{id}` lo respetan.

**Cómo se nombran los permisos.** `app/(components)/permissionLabels.ts` traduce el catálogo del API al español, y `permissionLabel(permiso, tipoDeNodo?)` tiene dos redacciones, porque un permiso vale para el nodo donde se otorga **y para todo lo que cuelga de él**:

- **Neutra** (sin tipo de nodo): en el editor de permisos de un cargo, que es de toda la iglesia y aún no saben dónde se otorgarán. Dice «la iglesia, sede, grupo o ministerio».
- **Según el nodo** (`CHURCH`, `LOCATION`, `GROUP` o `MINISTRY`): hoy ninguna pantalla la usa (ver la deuda técnica 11 en [redesign.md](redesign.md)).

Al sumar un permiso al catálogo del API, agrégalo a `permissionLabels` (y a `nodePermissionLabels` si su texto cambia con el nodo); si falta, la pantalla muestra el valor técnico en vez de romperse. Nunca pases `permissionLabel` directo a `.map(...)`: el índice entraría como tipo de nodo. Diseño completo: [redesign.md](redesign.md).

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
- `react-hooks/refs` está desactivado para `app/portal/[nodeId]/person/board/**`: el tablero pasa los objetos `provided` de `@hello-pangea/dnd` a `ref`, un uso documentado de la librería que la regla marca como falso positivo.

## Evolución propuesta

Lo que haría falta si el proyecto crece, en orden de utilidad:

1. **Colocar más cerca.** Varios componentes de `(components)/` los usa una sola pantalla (por ejemplo `EventForm` y `RecurrenceFields` solo los usa el módulo de eventos). Moverlos junto a esa pantalla refuerza la regla de cercanía; `(components)/` quedaría solo con lo realmente compartido.
2. **`useSWRMutation` para las escrituras.** Da estado de «guardando» y errores por operación sin `useState` manual, y puede invalidar claves tras escribir. Las funciones generadas se pueden envolver sin cambiar a sus llamadores.
3. **Claves de SWR con una fábrica por recurso** (`peopleKeys.detail(id)`), si empieza a haber invalidaciones cruzadas (al guardar una persona, refrescar la lista). Hoy cada clave se repite en un solo hook, así que no hace falta.
4. **Componentes de servidor donde se pueda.** Casi todo el portal es `"use client"` porque depende del token de Auth0 en el navegador. Las páginas públicas (landing, legales, libro de reclamaciones) y el marco del portal sí podrían ser de servidor.
5. **Tipos de `params`.** Hoy cada `page.tsx` declara sus parámetros de ruta (`{ nodeId: number }`) aunque en ejecución son texto. Un tipo compartido con conversión explícita evitaría la confusión.
