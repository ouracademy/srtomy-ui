---
name: test-pyramid
description: Usar siempre que escribas, cambies, muevas o revises pruebas en srtomy-ui (Vitest, Testing Library, Playwright), y al corregir un bug. Dice en qué nivel de la pirámide va cada prueba (unit, component, smoke, e2e @story o @journey) y cómo se marca para que el CI la corra en su etapa.
---

# Pirámide de pruebas en srtomy-ui (Next.js, React)

Las reglas de cómo escribir cada prueba (consultas por rol, `user-event` antes que `fireEvent`, simular `@/app/(api)/generated`) están en la sección «Tests» de `AGENTS.md`. Este skill dice **en qué nivel** va.

## Reglas comunes

Estas reglas son las mismas en srtomy-api, srtomy-ui y srtomy-agent. Lo que cambia entre repos son las herramientas y los nombres de archivo (más abajo).

### Los niveles

De abajo hacia arriba: muchas pruebas abajo, pocas arriba. El CI los corre en este orden y se detiene en el primero que falla, así un error se ve en segundos y no después de los e2e.

| Nivel              | Qué prueba                                                                                                                                    | Cuántas    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **unit**           | Lógica pura: una función, una regla de negocio, una validación. Sin framework, sin red, sin base de datos.                                    | La mayoría |
| **component**      | Un módulo con sus bordes simulados: un controlador, una pantalla, una ruta HTTP con dobles.                                                   | Muchas     |
| **integration**    | Con infraestructura real: Postgres, el contexto completo, la cadena de seguridad, las migraciones.                                            | Pocas      |
| **smoke**          | Que lo compilado arranca y responde lo básico. Menos de un minuto entre todas.                                                                | Un puñado  |
| **e2e `@story`**   | Una historia de usuario: un criterio de aceptación de un spec (`specs/NNN-*`), en una pantalla, desde un estado preparado.                    | Pocas      |
| **e2e `@journey`** | El recorrido de una persona por varias funciones, de principio a fin («la iglesia crea un evento, alguien se inscribe, se marca su ingreso»). | Muy pocas  |

Las pruebas de **contrato** entre repos (que la copia del OpenAPI de la UI y del agente coincida con la API) son trabajo futuro: están en la lista de deuda técnica.

### Cómo elegir el nivel

1. **Pregúntate qué se rompería** y escribe la prueba en el nivel más bajo que lo detecta. Una regla de negocio se rompe en una función: unit. Un mapeo HTTP se rompe en el controlador: component. Una consulta SQL se rompe contra Postgres: integration.
2. **Una validación, un mensaje de error o un permiso sobre un botón nunca son e2e.** Son unit o component.
3. **No repitas arriba lo que ya prueba abajo.** El nivel de arriba prueba que las piezas se conectan (el camino feliz y uno de error), no cada caso de la regla.
4. **Un e2e es `@story` o `@journey`**, y lo dice en su etiqueta. Una `@story` cita su spec. Antes de agregar un e2e, comprueba que no basta con uno de component.
5. **Un bug se reproduce en el nivel más bajo posible**, con una prueba que falla sin la corrección.
6. **Cada prueba dice su nivel** en el nombre del archivo o en su etiqueta (ver la tabla de este repo). Los hooks y el CI lo usan para correrla en su etapa.
7. **Prueba comportamiento, no implementación**, y sin red: los servicios externos se reemplazan por dobles.

### Al reescribir una prueba que está en un nivel demasiado alto

Muévela al nivel correcto en vez de borrarla: escribe la prueba nueva abajo, comprueba que falla si rompes lo que prueba, y recién entonces quita la de arriba. Si en el nivel de arriba quedaba algo que solo él probaba (la conexión entre piezas), deja un caso que lo cubra.

## En este repo

| Nivel              | Herramienta                                                                                             | Dónde y cómo se marca                                |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **unit**           | Vitest: lógica pura, hooks, servicios de `app/(api)/services`, el mutator de `client.ts`.               | `foo.test.ts` junto a `foo.ts`                       |
| **component**      | Vitest + Testing Library + `@testing-library/user-event`, con `@/app/(api)/generated` simulado.         | `Foo.test.tsx` junto a `Foo.tsx`                     |
| **integration**    | No hay en este repo: la UI no tiene infraestructura propia. La conexión con la API se prueba en la API. | —                                                    |
| **smoke**          | Playwright: la app compila, arranca y las rutas principales cargan (login, portal, una pantalla).       | `tests/*.spec.ts` con la etiqueta `@smoke`           |
| **e2e `@story`**   | Playwright, con la API interceptada (`page.route`): un criterio de aceptación de un spec.               | `tests/*.spec.ts` con `@story` y la anotación `spec` |
| **e2e `@journey`** | Playwright, con la API interceptada: un recorrido por varias pantallas.                                 | `tests/*.spec.ts` con `@journey`                     |

Las etiquetas son las de Playwright, en el `describe` o en cada `test`. Cuando un archivo mezcla niveles, la etiqueta puede ir al final del título (`test("… @journey", …)`), que Playwright también lee. `pnpm check:tests` falla si una prueba no tiene exactamente un nivel:

```ts
test.describe(
  "Inscripción a un evento",
  {
    tag: "@story",
    annotation: { type: "spec", description: "specs/011-registration" },
  },
  () => {
    test("al agotarse los lugares la página lo dice y no deja inscribirse", async ({
      page,
    }) => {
      /* … */
    });
  },
);

test(
  "la iglesia crea un evento, alguien se inscribe y se marca su ingreso",
  { tag: "@journey" },
  async ({ page }) => {
    /* … */
  },
);
```

`tests/a11y.spec.ts` (axe) lleva `@story`: cada caso es el criterio «esta pantalla no tiene violaciones graves».

- **Al component, no al e2e**: un mensaje de validación de un formulario, lo que se ve u oculta según un permiso, los estados de carga, «No encontrado» y error (`Loading`, `ResourceError`), el formato de una fecha o un número.
- **Al e2e `@story`**: lo que solo se ve con el router, el login simulado y varias peticiones juntas, y que un spec pide como criterio de aceptación.
- **Al e2e `@journey`**: muy pocos, los recorridos que el negocio no puede perder (alta de iglesia, evento con inscripción y asistencia). Corren al final porque son los más lentos.
- Un e2e que solo revisa un detalle de una pantalla es una prueba de component mal ubicada: bájala.

### Comandos

```sh
pnpm test                                   # unit y component (Vitest)
pnpm exec vitest run app/portal/foo         # solo una carpeta
pnpm test:e2e --grep @smoke                 # solo los smoke
pnpm test:e2e --grep @story                 # historias; --grep @journey para recorridos
```
