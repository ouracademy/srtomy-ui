import { test, expect } from "./fixtures";

test.describe("Eliminar un evento con asistencia", () => {
  const nodeId = "11111111-1111-1111-1111-111111111111";
  const eventId = "33333333-3333-3333-3333-333333333333";
  let deleteStatus = 200;

  test.beforeEach(async ({ page }) => {
    deleteStatus = 200;
    await page.route(`**/events/${eventId}**`, async (route) => {
      const request = route.request();
      if (request.url().endsWith("/attendance")) {
        await route.fulfill({ status: 204 });
        return;
      }
      if (request.method() === "DELETE") {
        await route.fulfill({ status: deleteStatus });
        return;
      }
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: eventId,
            title: "Servicio Dominical",
            start: "2026-11-01T15:00:00Z",
            end: "2026-11-01T17:00:00Z",
            isACourse: false,
            speakers: [],
            recurrentEvent: {
              daysOfWeek: [0],
              endRecur: "2026-11-20",
            },
          }),
        });
      }
    });

    await page.route("**/people*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ content: [] }),
      });
    });
  });

  test("elige todos los eventos, confirma y envía la opción", async ({
    page,
  }) => {
    const deleteRequest = page.waitForRequest(
      (request) =>
        request.method() === "DELETE" &&
        request.url().endsWith(`/events/${eventId}`),
    );
    await page.goto(`/portal/${nodeId}/event/${eventId}/attendance`);
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page.getByLabel("Todos los eventos").check();
    await page
      .getByRole("dialog", { name: "Borrar el evento recurrente" })
      .getByRole("button", { name: "Eliminar" })
      .click();

    const confirmation = page.getByRole("dialog", { name: "Deseas eliminar" });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Eliminar" }).click();

    expect((await deleteRequest).postDataJSON()).toEqual({
      option: "ALL_EVENTS",
    });
  });

  test("muestra un error y no navega si la eliminación falla", async ({
    page,
  }) => {
    deleteStatus = 500;

    await page.goto(`/portal/${nodeId}/event/${eventId}/attendance`);
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Borrar el evento recurrente" })
      .getByRole("button", { name: "Eliminar" })
      .click();
    await page
      .getByRole("dialog", { name: "Deseas eliminar" })
      .getByRole("button", { name: "Eliminar" })
      .click();

    await expect(
      page.getByText("No se pudo eliminar el evento. Intenta de nuevo."),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/event/${eventId}/attendance$`));
  });
});
