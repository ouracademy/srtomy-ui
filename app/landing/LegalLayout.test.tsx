import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LegalLayout } from "./LegalLayout";

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({ isAuthenticated: false, isLoading: false }),
}));

afterEach(cleanup);

describe("LegalLayout", () => {
  it("frames the page with the landing header and footer", () => {
    render(
      <LegalLayout>
        <p>Contenido legal</p>
      </LegalLayout>,
    );
    expect(screen.getByRole("banner")).toHaveTextContent("Oveja Fiel");
    expect(screen.getByRole("main")).toHaveTextContent("Contenido legal");
    expect(screen.getByRole("contentinfo")).toHaveTextContent("CONTACTO");
  });
});
