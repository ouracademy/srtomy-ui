import { test, expect } from "./fixtures";
import { NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const eventId = "33333333-3333-3333-3333-333333333333";

test.describe("Compartir eventos y cursos", () => {
  test("compartir guarda solo al pulsar Guardar, sin selector de rol del enlace", async ({
    page,
  }) => {
    let sharing = {
      generalAccess: "RESTRICTED",
      slug: "slug-del-curso",
      isACourse: true,
      shares: [] as unknown[],
      registrations: 0,
    };
    const calls: string[] = [];
    let shared: unknown;
    let access: unknown;

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
    await page.route(`**/v1/events/${eventId}/registration`, (route) =>
      route.fulfill(json({ enabled: false, tickets: [] })),
    );
    await page.route(`**/v1/events/${eventId}/registrations`, (route) =>
      route.fulfill(json([])),
    );
    await page.route(`**/v1/events/${eventId}/sharing`, async (route) => {
      if (route.request().method() === "PUT") {
        calls.push("PUT sharing");
        access = route.request().postDataJSON();
        sharing = { ...sharing, ...(access as object) };
      }
      await route.fulfill(json(sharing));
    });
    await page.route(`**/v1/events/${eventId}/shares`, async (route) => {
      calls.push("POST shares");
      shared = route.request().postDataJSON();
      sharing.shares = [{ id: "s1", email: "ana@example.com", role: "EDITOR" }];
      await route.fulfill(
        json(
          {
            share: sharing.shares[0],
            emailSent: true,
            emailStatus: "SENT",
          },
          201,
        ),
      );
    });

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);
    await page.getByRole("button", { name: "Compartir", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: "Compartir «Curso de discipulado»",
    });
    await expect(dialog).toBeVisible();
    // The link only lets people see: there is no second select.
    await expect(
      dialog.getByRole("combobox", { name: "Con el enlace" }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("button", { name: "Guardar" }),
    ).toBeDisabled();

    await dialog.getByLabel("Correo de la persona").fill("ana@example.com");
    await dialog.getByRole("combobox", { name: "Rol" }).click();
    await page.getByRole("option", { name: "Editor" }).click();
    await dialog.getByRole("button", { name: "Agregar" }).click();
    await dialog
      .getByRole("combobox", { name: "Quién abre el enlace" })
      .click();
    await page
      .getByRole("option", { name: "Cualquiera con el enlace" })
      .click();

    // Nothing is saved yet.
    await expect(dialog.getByText("Sin guardar")).toBeVisible();
    expect(calls).toEqual([]);

    await dialog.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Cambios guardados")).toBeVisible();
    expect(access).toEqual({ generalAccess: "ANYONE_WITH_LINK" });
    expect(shared).toEqual({ email: "ana@example.com", role: "EDITOR" });
    expect(calls).toEqual(["PUT sharing", "POST shares"]);
    await expect(dialog).toBeHidden();
  });

  test("quien abre el enlace de un curso se inscribe sin cuenta con un ticket", async ({
    page,
  }) => {
    let registration: unknown;
    await page.route("**/v1/public/events/curso", (route) =>
      route.fulfill(
        json({
          title: "Curso de discipulado",
          description: "Ocho semanas",
          address: "Av. 1",
          start: "2030-01-05T15:00:00Z",
          end: "2030-01-05T17:00:00Z",
          isACourse: true,
          organizationName: "Jóvenes",
          canRegister: true,
          registration: {
            open: true,
            requiresAccount: false,
            waitlistEnabled: false,
            soldOut: false,
            tickets: [
              {
                id: "t1",
                name: "General",
                priceCents: 0,
                currency: "PEN",
                onSale: true,
                remaining: 12,
              },
            ],
          },
        }),
      ),
    );
    await page.route(
      "**/v1/public/events/curso/registrations",
      async (route) => {
        registration = route.request().postDataJSON();
        await route.fulfill(
          json(
            {
              alreadyRegistered: false,
              status: "CONFIRMED",
              cancelCode: "codigo-cancelar",
              ticketCode: "codigo-ticket",
            },
            201,
          ),
        );
      },
    );

    await page.goto("/e/curso");
    await expect(
      page.getByRole("heading", { name: "Curso de discipulado", level: 1 }),
    ).toBeVisible();
    await page.getByLabel(/Nombre/).fill("Lucía");
    await page.getByLabel(/Apellido/).fill("Mora");
    await page.getByLabel(/Correo/).fill("lucia@example.com");
    await page.getByRole("button", { name: "Inscribirme" }).click();

    await expect(
      page.getByText("Listo, quedó inscrito. Gracias."),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "QR de su ticket" }),
    ).toBeVisible();
    expect(registration).toEqual({
      ticketTypeId: "t1",
      firstName: "Lucía",
      lastName: "Mora",
      email: "lucia@example.com",
    });
  });

  test("un enlace que no abre responde que no se encontró", async ({
    page,
  }) => {
    await page.route("**/v1/public/events/cerrado", (route) =>
      route.fulfill(json({ title: "Not Found" }, 404)),
    );

    await page.goto("/e/cerrado");

    await expect(page.getByText(/No encontrado/i)).toBeVisible();
  });

  test("los eventos compartidos contigo salen en el portal", async ({
    page,
  }) => {
    await page.route("**/v1/me/organizations", (route) =>
      route.fulfill(json([])),
    );
    await page.route("**/v1/me/shared-events", (route) =>
      route.fulfill(
        json([
          {
            title: "Retiro",
            start: "2030-01-05T15:00:00Z",
            isACourse: false,
            organizationName: "Jóvenes",
            role: "VIEWER",
            slug: "retiro",
          },
        ]),
      ),
    );

    await page.goto("/portal");

    await expect(
      page.getByRole("heading", { name: "Compartidos contigo" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Retiro" }).click();
    await expect(page).toHaveURL(/\/e\/retiro$/);
  });
});
