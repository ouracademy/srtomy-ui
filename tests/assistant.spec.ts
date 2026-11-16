import type { Page, Request } from "@playwright/test";
import {
  askToCreateEvent,
  CHAT_URL,
  eventCreated,
  eventsThisWeek,
  fulfillChat,
  textAnswer,
} from "./chatStream";
import { NODE_ID } from "./e2e-env";
import { expect, test } from "./fixtures";

// The portal assistant against a simulated srtomy-agent: every POST /chat is
// answered here with a recorded UI message stream.

const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const mockNode = async (page: Page) => {
  await page.route(`**/v1/organizations/${NODE_ID}`, (route) =>
    route.fulfill(
      json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
    ),
  );
  await page.route(`**/v1/organizations/${NODE_ID}/childs**`, (route) =>
    route.fulfill(json([])),
  );
};

const openAssistant = async (page: Page) => {
  await page.goto(`/portal/${NODE_ID}/location`);
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  return page.getByRole("dialog", { name: "Asistente" });
};

const lastQuestion = (request: Request) => {
  const { messages } = request.postDataJSON() as {
    messages: Array<{ role: string; parts: Array<{ text?: string }> }>;
  };
  return messages.at(-1)?.parts[0]?.text;
};

test.describe("Asistente del portal", () => {
  test.beforeEach(async ({ page }) => {
    await mockNode(page);
  });

  test("responde una pregunta con el token del usuario y el nodo abierto", async ({
    page,
  }) => {
    let answer: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => (answer = resolve));
    const requests: Request[] = [];
    await page.route(CHAT_URL, async (route) => {
      requests.push(route.request());
      // Holds the answer so the test sees the panel while it waits.
      await answered;
      await fulfillChat(route, eventsThisWeek);
    });

    const panel = await openAssistant(page);
    await expect(panel).toContainText("En Sede Central");
    const field = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
    await expect(field).toBeFocused();

    await field.fill("¿Qué eventos hay esta semana?");
    await field.press("Enter");

    await expect(panel.getByText("Pensando…")).toBeVisible();
    await expect(panel.getByRole("button", { name: "Detener" })).toBeVisible();
    answer();

    const conversation = panel.getByRole("list", { name: "Conversación" });
    await expect(conversation).toContainText(
      "Esta semana hay dos eventos:\n- Culto dominical\n- Ensayo de alabanza",
    );
    await expect(panel.getByRole("status")).toContainText(
      "Esta semana hay dos eventos",
    );

    expect(requests).toHaveLength(1);
    const request = requests[0] as Request;
    expect(await request.headerValue("authorization")).toBe(
      "Bearer e2e-access-token",
    );
    expect(lastQuestion(request)).toBe("¿Qué eventos hay esta semana?");
    expect(request.postDataJSON().context).toMatchObject({ nodeId: NODE_ID });
  });

  test("pregunta con una sugerencia", async ({ page }) => {
    const requests: Request[] = [];
    await page.route(CHAT_URL, async (route) => {
      requests.push(route.request());
      await fulfillChat(route, textAnswer("Hay 40 personas en Sede Central."));
    });

    const panel = await openAssistant(page);
    await panel
      .getByRole("list", { name: "Sugerencias" })
      .getByRole("button", { name: "¿Cuántas personas hay aquí?" })
      .click();

    await expect(
      panel.getByRole("list", { name: "Conversación" }),
    ).toContainText("Hay 40 personas en Sede Central.");
    expect(lastQuestion(requests[0] as Request)).toBe(
      "¿Cuántas personas hay aquí?",
    );
  });

  test("ofrece reintentar si el asistente falla y no pierde la pregunta", async ({
    page,
  }) => {
    const questions: Array<string | undefined> = [];
    await page.route(CHAT_URL, async (route) => {
      questions.push(lastQuestion(route.request()));
      if (questions.length === 1) {
        await route.fulfill({
          status: 503,
          headers: { "access-control-allow-origin": "*" },
          body: "",
        });
        return;
      }
      await fulfillChat(route, textAnswer("Ahora sí: somos 40."));
    });

    const panel = await openAssistant(page);
    const field = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
    await field.fill("¿Cuántos somos?");
    await field.press("Enter");

    await expect(panel.getByRole("alert")).toContainText(
      "El asistente no pudo responder",
    );
    const conversation = panel.getByRole("list", { name: "Conversación" });
    await expect(conversation).toContainText("¿Cuántos somos?");

    await panel.getByRole("button", { name: "Reintentar" }).click();

    await expect(conversation).toContainText("Ahora sí: somos 40.");
    await expect(panel.getByRole("alert")).toHaveCount(0);
    expect(questions).toEqual(["¿Cuántos somos?", "¿Cuántos somos?"]);
  });

  test("pide iniciar sesión si la sesión venció", async ({ page }) => {
    await page.route(CHAT_URL, (route) =>
      route.fulfill({
        status: 401,
        headers: { "access-control-allow-origin": "*" },
        body: "",
      }),
    );

    const panel = await openAssistant(page);
    const field = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
    await field.fill("¿Cuántos somos?");
    await field.press("Enter");

    await expect(panel.getByRole("alert")).toContainText("Tu sesión venció");
    await expect(
      panel.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeVisible();
    await expect(
      panel.getByRole("list", { name: "Conversación" }),
    ).toContainText("¿Cuántos somos?");
  });

  test("se cierra y devuelve el foco al botón", async ({ page }) => {
    const panel = await openAssistant(page);

    await panel.getByRole("button", { name: "Cerrar asistente" }).click();

    await expect(panel).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Abrir asistente" }),
    ).toBeFocused();
  });

  // The agent is simulated end to end: the first POST /chat asks to create an
  // event; the second carries the user's answer and, only if it is a yes, the
  // simulated agent "runs" the write (recorded in `writes`).
  const simulateCreation = async (page: Page) => {
    const writes: unknown[] = [];
    const answers: Array<boolean | undefined> = [];
    let eventListReads = 0;
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (request.method() === "GET" && url.pathname === "/v1/events") {
        eventListReads += 1;
      }
    });
    await page.route("**/v1/events?**", (route) => route.fulfill(json([])));
    await page.route(CHAT_URL, async (route) => {
      const { messages } = route.request().postDataJSON() as {
        messages: Array<{
          parts: Array<{ approval?: { approved?: boolean } }>;
        }>;
      };
      const answered = messages
        .flatMap((message) => message.parts)
        .find((part) => part.approval?.approved !== undefined);
      if (!answered) {
        await fulfillChat(route, askToCreateEvent);
        return;
      }
      answers.push(answered.approval?.approved);
      if (answered.approval?.approved) writes.push("post_events");
      await fulfillChat(
        route,
        answered.approval?.approved
          ? eventCreated
          : textAnswer("Está bien, no creé nada."),
      );
    });
    return { writes, answers, reads: () => eventListReads };
  };

  test("pide confirmación, crea el evento al confirmar y revalida el calendario", async ({
    page,
  }) => {
    const agent = await simulateCreation(page);
    await page.goto(`/portal/${NODE_ID}/event`);
    await page.getByRole("button", { name: "Abrir asistente" }).click();
    const panel = page.getByRole("dialog", { name: "Asistente" });
    const field = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
    await field.fill(
      'Crea un evento "Ensayo de alabanza" el viernes a las 7 pm',
    );
    await field.press("Enter");

    const card = panel.getByRole("group", { name: "Confirmar acción" });
    await expect(card).toContainText("Crear evento: Ensayo de alabanza");
    await expect(card).toContainText("Nombre:");
    // Nothing is written until the user confirms.
    expect(agent.writes).toEqual([]);
    const readsBefore = agent.reads();

    await card.getByRole("button", { name: "Confirmar" }).click();

    await expect(
      panel.getByRole("list", { name: "Conversación" }),
    ).toContainText("Listo, creé el evento.");
    expect(agent.writes).toEqual(["post_events"]);
    expect(agent.answers).toEqual([true]);
    await expect.poll(() => agent.reads()).toBeGreaterThan(readsBefore);
  });

  test("al cancelar no sale ninguna escritura", async ({ page }) => {
    const agent = await simulateCreation(page);
    await page.goto(`/portal/${NODE_ID}/event`);
    await page.getByRole("button", { name: "Abrir asistente" }).click();
    const panel = page.getByRole("dialog", { name: "Asistente" });
    const field = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
    await field.fill("Crea un evento Ensayo de alabanza");
    await field.press("Enter");

    await panel
      .getByRole("group", { name: "Confirmar acción" })
      .getByRole("button", { name: "Cancelar" })
      .click();

    await expect(
      panel.getByRole("list", { name: "Conversación" }),
    ).toContainText("Está bien, no creé nada.");
    expect(agent.writes).toEqual([]);
    expect(agent.answers).toEqual([false]);
  });
});
