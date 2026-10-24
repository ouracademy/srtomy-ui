import { test, expect } from "./fixtures";
import { NODE_ID } from "./e2e-env";

const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Lista de personas", () => {
  test("carga una vez, sin navegar en bucle, y etiqueta el grupo de origen", async ({
    page,
  }) => {
    let calls = 0;
    await page.route("**/v1/people?*", (route) => {
      calls += 1;
      return route.fulfill(
        json({
          content: [
            {
              id: "p1",
              fullName: "Ana Diaz",
              directMember: true,
              organizationName: "Sede",
            },
            {
              id: "p2",
              fullName: "Beto Ruiz",
              directMember: false,
              organizationName: "Jóvenes",
            },
          ],
          totalElements: 2,
        }),
      );
    });

    await page.goto(`/portal/${NODE_ID}/person`);
    await expect(page.getByText("Beto Ruiz")).toBeVisible();
    // A navigation loop would keep refetching; give it time to show up.
    await page.waitForTimeout(2000);

    expect(calls).toBeLessThanOrEqual(2);
    await expect(page.getByRole("gridcell", { name: "Jóvenes" })).toBeVisible();
    expect(new URL(page.url()).search).toBe("");
  });
});
