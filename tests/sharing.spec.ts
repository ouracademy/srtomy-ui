import { test, expect } from "./fixtures";
import { NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const eventId = "33333333-3333-3333-3333-333333333333";

test.describe("Compartir eventos y cursos", () => {
  test("comparte un curso con una persona, abre el enlace a cualquiera y ve los inscritos", async ({
    page,
  }) => {
    let sharing = {
      generalAccess: "RESTRICTED",
      linkRole: "VIEWER",
      slug: "slug-del-curso",
      isACourse: true,
      shares: [] as unknown[],
      registrations: 1,
    };
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
    await page.route(`**/v1/events/${eventId}/sharing`, async (route) => {
      if (route.request().method() === "PUT") {
        access = route.request().postDataJSON();
        sharing = { ...sharing, ...(access as object) };
      }
      await route.fulfill(json(sharing));
    });
    await page.route(`**/v1/events/${eventId}/shares`, async (route) => {
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
    await page.route(`**/v1/events/${eventId}/registrations`, (route) =>
      route.fulfill(
        json([
          {
            id: "r1",
            firstName: "Lucía",
            lastName: "Mora",
            email: "lucia@example.com",
            phoneNumber: "999",
            hasAccount: false,
          },
        ]),
      ),
    );

    await page.goto(`/portal/${NODE_ID}/event/${eventId}/attendance`);
    await page.getByRole("button", { name: "Compartir", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Compartir «Curso de discipulado»" }),
    ).toBeVisible();

    await page.getByLabel("Correo de la persona").fill("ana@example.com");
    await page.getByRole("combobox", { name: "Rol" }).click();
    await page.getByRole("option", { name: "Editor" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Compartir", exact: true })
      .click();
    await expect(page.getByText("Compartido", { exact: true })).toBeVisible();
    expect(shared).toEqual({ email: "ana@example.com", role: "EDITOR" });
    await expect(page.getByText("ana@example.com")).toBeVisible();

    await page.getByRole("combobox", { name: "Quién abre el enlace" }).click();
    await page
      .getByRole("option", { name: "Cualquiera con el enlace" })
      .click();
    await expect(page.getByText("Acceso actualizado")).toBeVisible();
    expect(access).toEqual({
      generalAccess: "ANYONE_WITH_LINK",
      linkRole: "VIEWER",
    });
    await expect(page.getByLabel("Enlace", { exact: true })).toHaveValue(
      /\/e\/slug-del-curso$/,
    );

    await page.getByRole("tab", { name: "Inscritos (1)" }).click();
    await expect(page.getByText("Lucía Mora")).toBeVisible();
  });

  test("quien abre el enlace de un curso se inscribe sin cuenta", async ({
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
          registered: false,
        }),
      ),
    );
    await page.route(
      "**/v1/public/events/curso/registrations",
      async (route) => {
        registration = route.request().postDataJSON();
        await route.fulfill(json({ alreadyRegistered: false }, 201));
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
    expect(registration).toEqual({
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
