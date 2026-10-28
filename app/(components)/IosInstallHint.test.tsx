import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DISMISSED_KEY, IosInstallHint } from "./IosInstallHint";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const DESKTOP = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36";

function setup(userAgent: string, standalone = false) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
  window.matchMedia = vi.fn().mockReturnValue({ matches: standalone });
}

const hint = () => screen.queryByText(/Agregar a pantalla de inicio/);

describe("IosInstallHint", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("explains how to install on iOS Safari", () => {
    setup(IPHONE);
    render(<IosInstallHint />);
    expect(hint()).toBeInTheDocument();
  });

  it("stays hidden outside iOS", () => {
    setup(DESKTOP);
    render(<IosInstallHint />);
    expect(hint()).not.toBeInTheDocument();
  });

  it("stays hidden once the app is installed", () => {
    setup(IPHONE, true);
    render(<IosInstallHint />);
    expect(hint()).not.toBeInTheDocument();
  });

  it("remembers when the user closes it", async () => {
    setup(IPHONE);
    const user = userEvent.setup();
    const { unmount } = render(<IosInstallHint />);

    await user.click(screen.getByRole("button", { name: /close|cerrar/i }));
    expect(hint()).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISSED_KEY)).toBe("1");

    unmount();
    render(<IosInstallHint />);
    expect(hint()).not.toBeInTheDocument();
  });
});
