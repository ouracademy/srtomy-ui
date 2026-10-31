import { test, expect } from "./fixtures";

test.describe("Eventos compuestos", () => {
  const nodeId = "11111111-1111-1111-1111-111111111111";
  const megaId = "55555555-5555-5555-5555-555555555555";
  const childId = "66666666-6666-6666-6666-666666666666";

  type Child = { id: string; title: string; start: string; end: string };
  let postedMega: Record<string, unknown> | undefined;
  let postedChild: Record<string, unknown> | undefined;
  let children: Child[] = [];

  test.beforeEach(async ({ page }) => {
    postedMega = undefined;
    postedChild = undefined;
    children = [];
    await page.route(`**/organizations/${nodeId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: nodeId, address: "Calle Principal 123" }),
      }),
    );
    await page.route("**/people*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ content: [] }),
      }),
    );
    await page.route("**/events", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
        return;
      }
      const body = request.postDataJSON();
      if (body.parentEventId) {
        postedChild = body;
        children = [
          {
            id: childId,
            title: body.name,
            start: body.startTime,
            end: body.endTime,
          },
        ];
      } else {
        postedMega = body;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(body.parentEventId ? childId : megaId),
      });
    });
    await page.route(`**/events/${megaId}**`, async (route) => {
      if (route.request().url().endsWith("/attendance")) {
        await route.fulfill({ status: 204 });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: megaId,
          title: "Congreso",
          start: "2026-11-08T00:00:00Z",
          end: "2026-11-10T00:30:00Z",
          isACourse: false,
          speakers: [],
          organization: { id: nodeId, name: "Sede" },
          children: children.map((child) => ({
            ...child,
            isACourse: false,
            registrationMode: "INHERIT",
          })),
        }),
      });
    });
  });

  test("crear un evento de varios días lleva a su pantalla, donde el programa es opcional", async ({
    page,
  }) => {
    await page.goto(`/portal/${nodeId}/event`);
    await page
      .getByRole("grid")
      .getByRole("gridcell")
      .first()
      .click({ force: true });

    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/Agregar título/i).fill("Congreso");
    // It ends on a day far from the one picked, so it lasts several days.
    const until = dialog.getByRole("group", { name: "Hasta" });
    await until.getByRole("spinbutton", { name: "Month" }).click();
    await page.keyboard.type("12");
    await until.getByRole("spinbutton", { name: "Day" }).click();
    await page.keyboard.type("28");
    await until.getByRole("spinbutton", { name: "Year" }).click();
    await page.keyboard.type("2099");
    await expect(
      dialog.getByRole("combobox", { name: "Se repite" }),
    ).toBeHidden();
    await dialog.getByRole("button", { name: "Guardar" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/portal/${nodeId}/event/${megaId}/attendance$`),
    );
    expect(String(postedMega?.endTime)).toMatch(/^2099-12-28T/);
    expect(String(postedMega?.startTime)).not.toMatch(/^2099/);

    const program = page.getByRole("region", { name: "Programa" });
    await expect(program.getByText(/Es opcional/)).toBeVisible();
  });

  test("desde el programa se agrega un sub-evento que forma parte del evento", async ({
    page,
  }) => {
    await page.goto(`/portal/${nodeId}/event/${megaId}/attendance`);
    const program = page.getByRole("region", { name: "Programa" });
    await program.getByRole("button", { name: "Agregar sub-evento" }).click();

    const dialog = page.getByRole("dialog", { name: "Agregar sub-evento" });
    await expect(dialog.getByText("Parte de «Congreso»")).toBeVisible();
    await dialog
      .getByPlaceholder(/Agregar título/i)
      .fill("Taller de liderazgo");
    await dialog.getByRole("button", { name: "Guardar" }).click();

    await expect(
      program.getByRole("link", { name: /Taller de liderazgo/ }),
    ).toBeVisible();
    expect(postedChild).toMatchObject({
      name: "Taller de liderazgo",
      parentEventId: megaId,
      registrationMode: "INHERIT",
    });
    expect(postedChild?.recurrence).toBeUndefined();
  });

  test("un sub-evento dice de qué evento forma parte y cómo se inscribe", async ({
    page,
  }) => {
    await page.route(`**/events/${childId}**`, async (route) => {
      if (route.request().url().endsWith("/attendance")) {
        await route.fulfill({ status: 204 });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: childId,
          title: "Taller de liderazgo",
          start: "2026-11-09T15:00:00Z",
          end: "2026-11-09T16:00:00Z",
          isACourse: false,
          speakers: [],
          parentEventId: megaId,
          parentTitle: "Congreso",
          registrationMode: "INHERIT",
        }),
      });
    });
    await page.goto(`/portal/${nodeId}/event/${childId}/attendance`);

    await expect(page.getByText(/Parte de «Congreso»/).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ver el evento" }),
    ).toHaveAttribute("href", `/portal/${nodeId}/event/${megaId}/attendance`);
    await expect(page.getByRole("region", { name: "Programa" })).toBeHidden();
  });
});
