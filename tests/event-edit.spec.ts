import { test, expect } from "./fixtures";

test.describe("Editar un evento", () => {
  const nodeId = "11111111-1111-1111-1111-111111111111";
  const eventId = "33333333-3333-3333-3333-333333333333";
  let repeats = false;
  let putBody: Record<string, unknown> | undefined;
  let putStatus = 200;

  test.beforeEach(async ({ page }) => {
    repeats = false;
    putBody = undefined;
    putStatus = 200;
    await page.route(`**/events/${eventId}**`, async (route) => {
      const request = route.request();
      if (request.url().endsWith("/attendance")) {
        await route.fulfill({ status: 204 });
        return;
      }
      if (request.method() === "PUT") {
        putBody = request.postDataJSON();
        await route.fulfill(
          putStatus === 200
            ? {
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                  id: eventId,
                  keptEvents: 1,
                  notifiedPeople: 2,
                }),
              }
            : {
                status: 400,
                contentType: "application/problem+json",
                body: JSON.stringify({
                  detail: "La hora de fin no puede ser anterior a la de inicio",
                }),
              },
        );
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
            recurrence: repeats
              ? {
                  frequency: "WEEKLY",
                  interval: 1,
                  daysOfWeek: [0],
                  endType: "NEVER",
                  timeZone: "America/Lima",
                }
              : undefined,
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

  test("edita un evento suelto y lo guarda con el botón Guardar", async ({
    page,
  }) => {
    await page.goto(`/portal/${nodeId}/event/${eventId}/attendance`);
    await expect(page.getByPlaceholder("Agregar título")).toBeDisabled();
    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await page.getByPlaceholder("Agregar título").fill("Culto de oración");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /Evento actualizado/ }),
    ).toBeVisible();
    expect(putBody).toMatchObject({
      name: "Culto de oración",
      organizationId: nodeId,
      isACourse: false,
      option: "THIS_EVENT",
    });
    expect(putBody?.recurrence).toBeUndefined();
    await expect(page.getByPlaceholder("Agregar título")).toBeDisabled();
  });

  test("en una serie pregunta a qué eventos aplicar el cambio", async ({
    page,
  }) => {
    repeats = true;
    await page.goto(`/portal/${nodeId}/event/${eventId}/attendance`);
    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await page.getByPlaceholder("Agregar título").fill("Servicio");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    const dialog = page.getByRole("dialog", {
      name: "Editar el evento recurrente",
    });
    await dialog.getByLabel("Todos los eventos").check();
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText:
          "Se avisó por correo a 2 personas. 1 evento con inscritos, asistencia o ya pasados no cambiaron.",
      }),
    ).toBeVisible();
    expect(putBody).toMatchObject({ name: "Servicio", option: "ALL_EVENTS" });
    expect(putBody?.recurrence).toBeUndefined();
  });

  test("muestra la explicación de la API si no se pudo guardar", async ({
    page,
  }) => {
    putStatus = 400;
    await page.goto(`/portal/${nodeId}/event/${eventId}/attendance`);
    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await page.getByPlaceholder("Agregar título").fill("Otro nombre");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    await expect(
      page.getByText("La hora de fin no puede ser anterior a la de inicio"),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Agregar título")).toBeEnabled();
  });

  test("Cancelar descarta los cambios", async ({ page }) => {
    await page.goto(`/portal/${nodeId}/event/${eventId}/attendance`);
    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await page.getByPlaceholder("Agregar título").fill("Descartado");
    await page.getByRole("button", { name: "Cancelar" }).click();

    await expect(page.getByPlaceholder("Agregar título")).toHaveValue(
      "Servicio Dominical",
    );
    expect(putBody).toBeUndefined();
  });
});
