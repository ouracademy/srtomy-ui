import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import { NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const eventId = "44444444-4444-4444-4444-444444444444";

const setupWithTickets = {
  enabled: true,
  open: true,
  requiresAccount: false,
  confirmed: 2,
  checkedIn: 1,
  tickets: [
    { id: "t1", name: "General", priceCents: 0, quantity: 30, sold: 2 },
    { id: "t2", name: "VIP", priceCents: 2500, quantity: 10, sold: 0 },
  ],
};

const registrations = [
  {
    id: "r1",
    firstName: "Lucía",
    lastName: "Mora",
    email: "lucia@example.com",
    phoneNumber: "999",
    ticketName: "General",
    status: "CONFIRMED",
    checkedInAt: "2030-01-05T15:10:00Z",
  },
  {
    id: "r2",
    firstName: "Ana",
    lastName: "Paz",
    email: "ana@example.com",
    ticketName: "General",
    status: "CONFIRMED",
  },
  {
    id: "r3",
    firstName: "Eva",
    lastName: "Sol",
    email: "eva@example.com",
    ticketName: "VIP",
    status: "CONFIRMED",
  },
];

async function mockEvent(page: import("@playwright/test").Page) {
  await page.route(`**/v1/events/${eventId}`, (route) =>
    route.fulfill(
      json({
        id: eventId,
        title: "Curso de discipulado",
        start: "2030-01-05T15:00:00Z",
        end: "2030-01-05T17:00:00Z",
        isACourse: true,
        speakers: [],
      }),
    ),
  );
  await page.route("**/people*", (route) =>
    route.fulfill(json({ content: [] })),
  );
  await page.route(`**/v1/events/${eventId}/attendance`, (route) =>
    route.fulfill(json({ personIds: [], guestCount: 0, marks: [] })),
  );
}

test.describe("Inscripción a eventos y cursos", () => {
  test("al crear un curso se elige inscripción gratis con cupo", async ({
    page,
  }) => {
    let created: unknown;
    let registration: unknown;
    await page.route(`**/organizations/${NODE_ID}`, (route) =>
      route.fulfill(json({ id: NODE_ID, address: "Calle Principal 123" })),
    );
    await page.route("**/people*", (route) =>
      route.fulfill(json({ content: [] })),
    );
    await page.route("**/v1/events", async (route) => {
      if (route.request().method() === "POST") {
        created = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(eventId),
        });
        return;
      }
      await route.fallback();
    });
    await page.route(`**/v1/events/${eventId}/registration`, async (route) => {
      registration = route.request().postDataJSON();
      await route.fulfill(json({ enabled: true, tickets: [] }));
    });

    // The calendar must ask for the events again once the new one is saved.
    let listCalls = 0;
    page.on("request", (request) => {
      if (request.method() === "GET" && /\/v1\/events\?/.test(request.url())) {
        listCalls += 1;
      }
    });

    await page.goto(`/portal/${NODE_ID}/event`);
    await expect.poll(() => listCalls).toBeGreaterThan(0);
    await page
      .getByRole("grid")
      .getByRole("gridcell")
      .first()
      .click({ force: true });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Curso", exact: true }).click();
    await dialog.getByPlaceholder(/Agregar título/i).fill("Discipulado");
    await expect(
      dialog.getByRole("switch", { name: "Pedir inscripción" }),
    ).not.toBeChecked();
    await dialog.getByRole("switch", { name: "Pedir inscripción" }).click();
    await dialog.getByLabel("Cupos del ticket 1").fill("25");
    const callsBeforeSaving = listCalls;
    await dialog.getByRole("button", { name: /Guardar/i }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /Guardado exitosamente/i }),
    ).toBeVisible();
    await expect.poll(() => listCalls).toBeGreaterThan(callsBeforeSaving);
    expect(created).toMatchObject({ name: "Discipulado", isACourse: true });
    expect(registration).toMatchObject({
      requiresAccount: false,
      tickets: [{ name: "General", priceCents: 0, quantity: 25 }],
    });
    // Only what is still offered is sent.
    expect(registration).not.toHaveProperty("capacity");
    expect(registration).not.toHaveProperty("waitlistEnabled");
    expect(registration).not.toHaveProperty("open");
  });

  test("los organizadores configuran la inscripción de un evento que ya existe", async ({
    page,
  }) => {
    let saved: unknown;
    let setup: unknown = { enabled: false, tickets: [] };
    await mockEvent(page);
    await page.route(`**/v1/events/${eventId}/registrations`, (route) =>
      route.fulfill(json([])),
    );
    await page.route(`**/v1/events/${eventId}/registration`, async (route) => {
      if (route.request().method() === "PUT") {
        saved = route.request().postDataJSON();
        setup = setupWithTickets;
      }
      await route.fulfill(json(setup));
    });

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);
    await expect(
      page.getByText(
        "Este evento no pide inscripción: cualquiera puede venir.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Activar inscripción" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Inscripción de «Curso de discipulado»",
    });
    await expect(
      dialog.getByRole("button", { name: "Guardar" }),
    ).toBeDisabled();
    await dialog.getByRole("switch", { name: "Pedir inscripción" }).click();
    await dialog.getByLabel("Cupos del ticket 1").fill("30");
    await dialog
      .getByRole("button", { name: "Agregar tipo de ticket" })
      .click();
    await dialog.getByLabel("Nombre del ticket 2").fill("VIP");
    await dialog.getByLabel("Precio (S/) del ticket 2").fill("25");
    await dialog.getByLabel("Cupos del ticket 2").fill("10");
    await dialog.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText("Inscripción guardada")).toBeVisible();
    expect(saved).toMatchObject({
      requiresAccount: false,
      tickets: [
        { name: "General", priceCents: 0, quantity: 30 },
        { name: "VIP", priceCents: 2500, quantity: 10 },
      ],
    });
  });

  test("se ve quién se inscribió y se marca el ingreso", async ({ page }) => {
    let checkIn: unknown;
    await mockEvent(page);
    await page.route(`**/v1/events/${eventId}/registration`, (route) =>
      route.fulfill(json(setupWithTickets)),
    );
    await page.route(`**/v1/events/${eventId}/registrations`, (route) =>
      route.fulfill(json(registrations)),
    );
    await page.route(
      `**/v1/events/${eventId}/registrations/r2/check-in`,
      async (route) => {
        checkIn = route.request().postDataJSON();
        await route.fulfill(
          json({
            registrationId: "r2",
            name: "Ana Paz",
            ticketName: "General",
          }),
        );
      },
    );

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);
    const table = page.getByRole("table", { name: "Inscritos" });
    await expect(table.getByRole("row", { name: /Lucía Mora/ })).toContainText(
      "Ingresó a las",
    );
    await expect(table.getByRole("row", { name: /Eva Sol/ })).toContainText(
      "Aún no",
    );
    await expect(page.getByText(/En espera/)).toHaveCount(0);
    await page
      .getByRole("button", { name: "Marcar el ingreso de Ana Paz" })
      .click();

    await expect(page.getByText("Ingreso marcado")).toBeVisible();
    expect(checkIn).toEqual({ checkedIn: true });
  });

  const publicCourse = (remaining: number, soldOut: boolean) =>
    json({
      title: "Curso de discipulado",
      start: "2030-01-05T15:00:00Z",
      end: "2030-01-05T17:00:00Z",
      isACourse: true,
      organizationName: "Jóvenes",
      canRegister: true,
      registration: {
        open: true,
        requiresAccount: false,
        soldOut,
        tickets: [
          {
            id: "t1",
            name: "General",
            priceCents: 0,
            currency: "PEN",
            onSale: true,
            remaining,
          },
        ],
      },
    });

  test("al agotarse los lugares la página lo dice y no deja inscribirse", async ({
    page,
  }) => {
    await page.route("**/v1/public/events/curso", (route) =>
      route.fulfill(publicCourse(0, true)),
    );

    await page.goto("/e/curso");

    await expect(page.getByText("Se agotaron los lugares.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Inscribirme" })).toHaveCount(
      0,
    );
    await expect(page.getByText(/lista de espera/i)).toHaveCount(0);
  });

  test("quien se inscribe ve su ticket y puede cancelar con su enlace", async ({
    page,
  }) => {
    await page.route("**/v1/public/events/curso", (route) =>
      route.fulfill(publicCourse(5, false)),
    );
    await page.route("**/v1/public/events/curso/registrations", (route) =>
      route.fulfill(
        json(
          {
            alreadyRegistered: false,
            status: "CONFIRMED",
            cancelCode: "cancel-1",
            ticketCode: "ticket-1",
          },
          201,
        ),
      ),
    );
    let cancelled = false;
    await page.route("**/v1/public/registrations/cancel-1", async (route) => {
      cancelled = true;
      await route.fulfill({ status: 204 });
    });

    await page.goto("/e/curso");
    await page.getByLabel(/Nombre/).fill("Eva");
    await page.getByLabel(/Apellido/).fill("Sol");
    await page.getByLabel(/Correo/).fill("eva@example.com");
    await page.getByRole("button", { name: "Inscribirme" }).click();

    await expect(
      page.getByText("Listo, quedó inscrito. Gracias."),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "QR de su ticket" }),
    ).toBeVisible();
    await expect(page.getByLabel("Enlace para cancelar")).toHaveValue(
      /\/e\/curso\/cancelar\/cancel-1$/,
    );
    await page.getByRole("button", { name: "Cancelar mi inscripción" }).click();
    await expect(page.getByText("Su inscripción se canceló.")).toBeVisible();
    expect(cancelled).toBe(true);
  });

  test("el enlace de cancelar pregunta una vez y cancela", async ({ page }) => {
    let cancelled = false;
    await page.route("**/v1/public/registrations/codigo", async (route) => {
      cancelled = true;
      await route.fulfill({ status: 204 });
    });

    await page.goto("/e/curso/cancelar/codigo");
    await page.getByRole("button", { name: "Cancelar mi inscripción" }).click();

    await expect(page.getByText(/Su inscripción se canceló/)).toBeVisible();
    expect(cancelled).toBe(true);
  });

  test("el organizador cierra y reabre las inscripciones con su propio botón", async ({
    page,
  }) => {
    const calls: unknown[] = [];
    let open = true;
    await mockEvent(page);
    await page.route(`**/v1/events/${eventId}/registrations`, (route) =>
      route.fulfill(json(registrations)),
    );
    await page.route(`**/v1/events/${eventId}/registration`, (route) =>
      route.fulfill(json({ ...setupWithTickets, open })),
    );
    await page.route(`**/v1/events/${eventId}/registration/open`, (route) => {
      const body = route.request().postDataJSON() as { open: boolean };
      calls.push(body);
      open = body.open;
      return route.fulfill(json({ ...setupWithTickets, open }));
    });

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);
    await page.getByRole("button", { name: "Cerrar inscripciones" }).click();

    await expect(page.getByText("Inscripciones cerradas")).toBeVisible();
    await expect(
      page.getByText(
        "Las inscripciones están cerradas: nadie más puede anotarse.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Reabrir inscripciones" }).click();
    await expect(page.getByText("Inscripciones abiertas")).toBeVisible();
    expect(calls).toEqual([{ open: false }, { open: true }]);
  });

  test("cada acción se muestra solo a quien tiene su permiso", async ({
    page,
  }) => {
    await mockEvent(page);
    await page.route("**/v1/me/permissions**", (route) =>
      route.fulfill(json(["org.read", "events.read", "registrations.read"])),
    );
    await page.route(`**/v1/events/${eventId}/registration`, (route) =>
      route.fulfill(json(setupWithTickets)),
    );
    await page.route(`**/v1/events/${eventId}/registrations`, (route) =>
      route.fulfill(json(registrations)),
    );

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);

    await expect(page.getByRole("table", { name: "Inscritos" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Configurar inscripción" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Cerrar inscripciones" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Quitar la inscripción de/ }),
    ).toHaveCount(0);
  });

  test("quien no puede ver las inscripciones no ve el panel", async ({
    page,
  }) => {
    await mockEvent(page);
    await page.route("**/v1/me/permissions**", (route) =>
      route.fulfill(json(["org.read", "events.read"])),
    );

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);

    await expect(
      page.getByRole("heading", { name: "Toma de asistencia" }),
    ).toBeVisible();
    await expect(page.locator('section[aria-label="Inscripción"]')).toHaveCount(
      0,
    );
  });

  test("la pantalla del evento con inscripción no tiene violaciones graves", async ({
    page,
  }) => {
    await mockEvent(page);
    await page.route(`**/v1/events/${eventId}/registration`, (route) =>
      route.fulfill(json(setupWithTickets)),
    );
    await page.route(`**/v1/events/${eventId}/registrations`, (route) =>
      route.fulfill(json(registrations)),
    );

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);
    await expect(page.getByRole("table", { name: "Inscritos" })).toBeVisible();

    // The panel and the visitors are new; the rest of the screen has contrast
    // problems of its own (see the technical debt table).
    const panel = await new AxeBuilder({ page })
      .include('section[aria-label="Inscripción"]')
      .include('section[aria-label="Visitantes"]')
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    await page.getByRole("button", { name: "Configurar inscripción" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
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
    const dialog = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const serious = [...panel.violations, ...dialog.violations].filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(
      serious.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
      ),
    ).toEqual([]);
  });
});
