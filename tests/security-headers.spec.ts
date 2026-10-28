import { test, expect } from "./fixtures";

test.describe("Cabeceras de seguridad", () => {
  test("el sitio deja usar la cámara para escanear tickets, pero no el micrófono ni la ubicación", async ({
    request,
  }) => {
    const response = await request.get("/e/cualquiera");

    const policy = response.headers()["permissions-policy"];
    // With camera=() the browser refuses the camera without asking the user.
    expect(policy).toContain("camera=(self)");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
  });
});
