import { afterEach, describe, expect, it, vi } from "vitest";
import { copyLink } from "./copyLink";

afterEach(() => vi.unstubAllGlobals());

describe("copyLink", () => {
  it("copies the address and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const notify = vi.fn();

    await copyLink("https://x.org/g/abc", notify);

    expect(writeText).toHaveBeenCalledWith("https://x.org/g/abc");
    expect(notify).toHaveBeenCalledWith("Enlace copiado");
  });

  it("asks to copy it by hand when the clipboard fails", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const notify = vi.fn();

    await copyLink("https://x.org/g/abc", notify);

    expect(notify).toHaveBeenCalledWith(
      "No se pudo copiar. Copie el enlace manualmente",
    );
  });

  it("does not break without a clipboard", async () => {
    vi.stubGlobal("navigator", {});
    const notify = vi.fn();

    await copyLink("https://x.org/g/abc", notify);

    expect(notify).toHaveBeenCalledOnce();
  });
});
