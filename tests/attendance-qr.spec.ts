import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import { NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const eventId = "55555555-5555-5555-5555-555555555555";

async function mockService(page: import("@playwright/test").Page) {
  await page.route(`**/v1/events/${eventId}`, (route) =>
    route.fulfill(
      json({
        id: eventId,
        title: "Culto dominical",
        start: "2030-01-06T15:00:00Z",
        end: "2030-01-06T17:00:00Z",
        isACourse: false,
        speakers: [],
      }),
    ),
  );
  await page.route("**/people*", (route) =>
    route.fulfill(json({ content: [] })),
  );
  await page.route(`**/v1/events/${eventId}/registration`, (route) =>
    route.fulfill(json({ enabled: false, tickets: [] })),
  );
  await page.route(`**/v1/events/${eventId}/registrations`, (route) =>
    route.fulfill(json([])),
  );
}

test.describe("Asistencia con QR y visitantes", () => {
  test("un culto sin inscripción: agregar un visitante y contar a quienes no dieron su nombre", async ({
    page,
  }) => {
    let guests = 0;
    let visitor: unknown;
    let guestsSent: unknown;
    await mockService(page);
    await page.route(`**/v1/events/${eventId}/attendance`, (route) =>
      route.fulfill(json({ personIds: [], guestCount: guests, marks: [] })),
    );
    await page.route(
      `**/v1/events/${eventId}/attendance/visitors`,
      async (route) => {
        visitor = route.request().postDataJSON();
        await route.fulfill(json({ personId: "p-visitante" }, 201));
      },
    );
    await page.route(
      `**/v1/events/${eventId}/attendance/guests`,
      async (route) => {
        guestsSent = route.request().postDataJSON();
        guests = 5;
        await route.fulfill(json({ guestCount: 5 }));
      },
    );

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);
    await expect(
      page.getByText(
        "Este evento no pide inscripción: cualquiera puede venir.",
      ),
    ).toBeVisible();

    await page.getByLabel(/Nombre del visitante/).fill("Rosa");
    await page.getByLabel("Teléfono del visitante").fill("999");
    await page.getByRole("button", { name: "Agregar visitante" }).click();
    await expect(
      page.getByText("Visitante agregado y marcado como presente"),
    ).toBeVisible();
    expect(visitor).toEqual({
      firstName: "Rosa",
      phoneNumber: "999",
    });

    await page.getByLabel("Visitantes sin nombre", { exact: true }).fill("5");
    await page.getByRole("button", { name: "Guardar cantidad" }).click();
    await expect(page.getByText("Cantidad guardada")).toBeVisible();
    expect(guestsSent).toEqual({ guestCount: 5 });
  });

  test("el ujier muestra el QR del evento", async ({ page }) => {
    await mockService(page);
    await page.route(`**/v1/events/${eventId}/attendance`, (route) =>
      route.fulfill(json({ personIds: [], guestCount: 0, marks: [] })),
    );
    await page.route(`**/v1/events/${eventId}/attendance/qr`, (route) =>
      route.fulfill(
        json({
          token: "abc.1.def",
          refreshAt: new Date(Date.now() + 300_000).toISOString(),
        }),
      ),
    );

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);
    await page
      .getByRole("button", { name: "Mostrar QR de asistencia" })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "QR de asistencia de «Culto dominical»",
    });
    await expect(
      dialog.getByRole("img", { name: "QR para marcar la asistencia" }),
    ).toBeVisible();
    // axe reads the colors as painted, so let the dialog finish fading in.
    await expect
      .poll(() =>
        page
          .locator(".MuiDialog-container")
          .evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe("1");
    await page.addStyleTag({
      content:
        "*, *::before, *::after { transition: none !important; animation: none !important; }",
    });
    // Only the dialog: the page behind it has contrast problems of its own
    // (see the technical debt table).
    const { violations } = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      violations
        .filter((v) => ["serious", "critical"].includes(v.impact ?? ""))
        .map((v) => v.id),
    ).toEqual([]);
  });

  test("el ujier valida el ticket de un inscrito escribiendo su código", async ({
    page,
  }) => {
    let ticket: unknown;
    await mockService(page);
    await page.route(`**/v1/events/${eventId}/attendance`, (route) =>
      route.fulfill(json({ personIds: [], guestCount: 0, marks: [] })),
    );
    await page.route(
      `**/v1/events/${eventId}/attendance/check-in`,
      async (route) => {
        ticket = route.request().postDataJSON();
        await route.fulfill(
          json({
            registrationId: "r1",
            name: "Lucía Mora",
            ticketName: "General",
            alreadyCheckedIn: false,
          }),
        );
      },
    );

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);
    await page.getByRole("button", { name: "Escanear tickets" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Escanear tickets de «Culto dominical»",
    });
    await dialog
      .getByLabel("Código del ticket", { exact: true })
      .fill("codigo-ticket");
    await dialog.getByRole("button", { name: "Validar" }).click();

    await expect(
      dialog.getByText("Lucía Mora (General) ingresó"),
    ).toBeVisible();
    expect(ticket).toEqual({ ticketCode: "codigo-ticket" });
  });

  test("quien escanea el QR marca su asistencia sin cuenta, con su nombre", async ({
    page,
  }) => {
    let marked: unknown;
    await page.route("**/v1/public/attendance/tok", async (route) => {
      if (route.request().method() === "POST") {
        marked = route.request().postDataJSON();
        await route.fulfill(json({ kind: "VISITOR", alreadyMarked: false }));
        return;
      }
      await route.fulfill(
        json({
          title: "Culto dominical",
          start: "2030-01-06T15:00:00Z",
          organizationName: "Iglesia E2E",
          status: "OPEN",
        }),
      );
    });

    await page.goto("/a/tok");
    await expect(
      page.getByRole("heading", { name: "Culto dominical", level: 1 }),
    ).toBeVisible();
    await page.getByLabel("Su nombre (opcional)").fill("Rosa Díaz");
    await page.getByRole("button", { name: "Marcar mi asistencia" }).click();

    await expect(
      page.getByText(/Quedó registrado como visitante/),
    ).toBeVisible();
    expect(marked).toEqual({ name: "Rosa Díaz" });
  });

  test("un código que venció pide el QR actual", async ({ page }) => {
    await page.route("**/v1/public/attendance/viejo", (route) =>
      route.fulfill(
        json({
          title: "Culto dominical",
          start: "2030-01-06T15:00:00Z",
          organizationName: "Iglesia E2E",
          status: "EXPIRED_CODE",
        }),
      ),
    );

    await page.goto("/a/viejo");

    await expect(page.getByText(/Este código venció/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Marcar mi asistencia" }),
    ).toHaveCount(0);
  });

  test("un código que no es nuestro responde que no se encontró", async ({
    page,
  }) => {
    await page.route("**/v1/public/attendance/falso", (route) =>
      route.fulfill(json({ title: "Not Found" }, 404)),
    );

    await page.goto("/a/falso");

    await expect(page.getByText(/No encontrado/i)).toBeVisible();
  });
});
