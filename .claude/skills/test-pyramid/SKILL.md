---
name: test-pyramid
description: El estándar de pruebas de srtomy-ui. Usar siempre que escribas, cambies, muevas o revises pruebas (Vitest, Testing Library, Playwright) o un doble de prueba, y al corregir un bug. Dice en qué nivel de la pirámide va cada prueba (unit, component, smoke, e2e @story o @journey), cómo se marca para que el CI la corra en su etapa, cómo se escribe aquí (consultas por rol, user-event) y qué tipo de doble usar (dummy, stub, spy, mock, fake) y cómo nombrarlo.
---

# Estándar de pruebas de srtomy-ui (Next.js, React)

Este skill es **el** estándar de pruebas del repo: la única fuente de los niveles, los nombres, los dobles, las herramientas y cómo escribir cada prueba. La constitución (`.specify/memory/constitution.md`, principio II) tiene la regla y su porqué; `AGENTS.md`, `README.md`, `docs/architecture.md` y `docs/code-style.md` solo apuntan aquí.

## Común a los tres repos

> Este bloque es **idéntico** en srtomy-api, srtomy-ui y srtomy-agent. Si lo cambias, cámbialo en los tres en el mismo momento. Lo propio de cada repo va en «En este repo», más abajo.

### Los niveles

De abajo hacia arriba: muchas pruebas abajo, pocas arriba. El CI los corre en este orden y se detiene en el primero que falla, así un error se ve en segundos y no después de los e2e.

| Nivel              | Qué prueba                                                                                                                                    | Cuántas    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **unit**           | Lógica pura: una función, una regla de negocio, una validación. Sin framework, sin red, sin base de datos.                                    | La mayoría |
| **component**      | Un módulo con sus bordes reemplazados por dobles: un controlador, una pantalla, una ruta HTTP.                                                | Muchas     |
| **integration**    | Con infraestructura real: Postgres, el contexto completo, la cadena de seguridad, las migraciones.                                            | Pocas      |
| **smoke**          | Que lo compilado arranca y responde lo básico. Menos de un minuto entre todas.                                                                | Un puñado  |
| **e2e `@story`**   | Una historia de usuario: un criterio de aceptación de un spec (`specs/NNN-*`), en una pantalla, desde un estado preparado.                    | Pocas      |
| **e2e `@journey`** | El recorrido de una persona por varias funciones, de principio a fin («la iglesia crea un evento, alguien se inscribe, se marca su ingreso»). | Muy pocas  |

Las pruebas de **contrato** entre repos son trabajo futuro (lista de deuda técnica de srtomy-ui).

### Cómo elegir el nivel

1. **Todo cambio de lógica trae su prueba**, junto al archivo que prueba; el hook Stop de Claude Code la pide si falta.
2. **Pregúntate qué se rompería** y escribe la prueba en el nivel más bajo que lo detecta. Una regla de negocio se rompe en una función: unit. Un mapeo HTTP se rompe en el controlador: component. Una consulta SQL se rompe contra Postgres: integration.
3. **Una validación, un mensaje de error, un estado de carga o un permiso sobre un botón nunca son e2e.** Son unit o component.
4. **No repitas arriba lo que ya prueba abajo.** El nivel de arriba prueba que las piezas se conectan (el camino feliz y un caso de error), no cada variante de la regla.
5. **Un e2e es `@story` o `@journey`**, y lo dice en su etiqueta. Una `@story` cita su spec. Antes de agregar un e2e, comprueba que no basta con uno de component.
6. **Un bug se reproduce en el nivel más bajo posible**, con una prueba que falla sin la corrección.
7. **Cada prueba dice su nivel** en el nombre del archivo o en su etiqueta (ver «En este repo»). El CI y los hooks lo usan para correrla en su etapa, y lo comprueban.
8. **Prueba comportamiento, no implementación**, y sin red: lo que está fuera del repo se reemplaza por un doble.

### Dobles de prueba

Se usa el vocabulario de _xUnit Test Patterns_ (Gerard Meszaros), en la versión web del libro: <http://xunitpatterns.com/Test%20Double%20Patterns.html>. Un **doble de prueba** reemplaza, solo en la prueba, algo de lo que depende el código bajo prueba. **Cada doble es de un solo tipo, y el tipo lo da para qué lo usa la prueba**, no cómo está hecho:

| Tipo             | Para qué lo usa la prueba                                                                                                                                   | Quién verifica y cuándo                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Dummy Object** | Llenar un argumento que el código bajo prueba no usa. Si alguien lo llama, debería fallar.                                                                  | Nadie lo verifica: la prueba mira el resultado del código bajo prueba.                                               |
| **Test Stub**    | Darle al código bajo prueba sus _entradas indirectas_: un valor fijo (_Responder_) o un error o valor inesperado (_Saboteur_), para llevarlo por un camino. | La prueba, después, por el resultado o el estado. Al stub no se le pregunta nada.                                    |
| **Test Spy**     | Anotar las _salidas indirectas_ del código bajo prueba (lo que le envía) para revisarlas después. Puede además devolver valores: sigue siendo un spy.       | **La prueba**, **después** de ejercitar, con lo que el spy anotó.                                                    |
| **Mock Object**  | Comprobar las salidas indirectas con expectativas fijadas **antes** de ejercitar.                                                                           | **El mock mismo**, **durante** la ejecución (falla en la primera llamada que no coincide), y una verificación final. |
| **Fake Object**  | Reemplazar una dependencia por una implementación de verdad, más liviana (por ejemplo en memoria), sin usarla para controlar ni para observar.              | La prueba, después, por el estado, como con la dependencia real.                                                     |

- **El nombre dice el tipo**: `StubIdentity`, `SpyKapso`, `FakeSeen`, `DummyToken`, y lo mismo en variables y funciones que los crean (`stubFetch`, `spyLog`). `TestX`, o `FakeX` para algo que no es un Fake Object, no dice qué es.
- **Stub o spy**: si la prueba solo usa las respuestas del doble, es un stub. Si revisa lo que el doble anotó, es un spy, aunque también responda. Un objeto no es «stub y spy a la vez».
- **Prefiere verificar el estado** (stub, fake) antes que las llamadas (spy, mock): una prueba que fija la secuencia exacta de llamadas se rompe con cualquier cambio interno. Verifica llamadas solo cuando la llamada es el comportamiento: un correo que se envía, un mensaje que sale, un pago que se cobra.
- **Las librerías no dan el tipo con su nombre.** Mockito (`mock()`, `@Mock`, `@MockitoBean`), Vitest (`vi.fn`, `vi.mock`) y `MockLanguageModelV4` crean dobles de cualquier tipo. Con `given(...).willReturn(...)` y sin `verify`, es un stub. Con `verify(...)` **después** de ejercitar, la prueba revisa lo anotado, así que es un spy. Es un mock solo si las expectativas se fijan antes y el doble falla por su cuenta.
- Un Dummy Object no es un Null Object: el dummy no se usa, y el null object sí se usa pero no hace nada.

### Al bajar una prueba de nivel

Muévela en vez de borrarla: escribe la prueba nueva abajo, comprueba que falla si rompes lo que prueba, y recién entonces quita la de arriba. Si arriba quedaba algo que solo ella probaba (la conexión entre piezas), deja un caso que lo cubra.

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
  'Inscripción a un evento',
  {
    tag: '@story',
    annotation: { type: 'spec', description: 'specs/011-registration' },
  },
  () => {
    test('al agotarse los lugares la página lo dice y no deja inscribirse', async ({ page }) => {
      /* … */
    });
  },
);

test(
  'la iglesia crea un evento, alguien se inscribe y se marca su ingreso',
  { tag: '@journey' },
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

### Cómo escribirlas aquí

- **Consulta los elementos por lo que ve la persona**: `getByRole`, `getByLabelText`, `getByText`. Los _test ids_ solo cuando nada más sirve.
- **`@testing-library/user-event` primero** para lo que hace una persona: `user.type` dispara `pointerdown`, `focus`, `keydown`, `keypress`, `input` y `keyup`, y `user.click` respeta los elementos deshabilitados y el foco. Siempre con `await`.
- `fireEvent.change` dispara un solo evento `input`/`change`, así que no reproduce el tipeo: no lo uses para probar tipeo. Usa `fireEvent` solo cuando `user-event` no puede:
  - la interacción o el evento no existe en `user-event`;
  - hay que disparar el evento directo sobre un componente interno o compuesto, adonde `user-event` no llega o no propaga el evento como hace falta;
  - basta con comprobar que un evento se dispara (un `dispatchEvent` directo), sin repetir la cadena del navegador.
- No mezcles los dos en la misma interacción. La elección depende de la interacción, no del nivel: unit y component usan `user-event` igual.
- **Ninguna prueba llama a la red.** Si un componente llama a la API, reemplaza `@/app/(api)/generated` con `vi.mock`. Para la capa HTTP se reemplaza el _adapter_ de axios (ver `client.test.ts`). El código generado no se prueba; sí el mutator de `client.ts`.
- **Los e2e** corren contra el servidor de desarrollo: `tests/fixtures.ts` simula el login de Auth0 y cada prueba intercepta las llamadas a la API con `page.route`. `tests/a11y.spec.ts` corre axe (WCAG A y AA, impacto serio o crítico); si agregas una pantalla de formulario, agrégala allí. Si cambia un endpoint, cambian la especificación (`pnpm api:sync`) y los `page.route` que lo simulan.

### Comandos

```sh
pnpm test                                   # unit y component (Vitest)
pnpm exec vitest run app/portal/foo         # solo una carpeta
pnpm test:e2e --grep @smoke                 # solo los smoke
pnpm test:e2e --grep @story                 # historias; --grep @journey para recorridos
```
