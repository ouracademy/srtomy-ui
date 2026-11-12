import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormContainer } from "react-hook-form-mui";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupVisibilitySection } from "./GroupVisibilitySection";

afterEach(cleanup);

const setup = ({
  visibility = "PUBLIC",
  ...props
}: {
  visibility?: string;
  disabled?: boolean;
  slug?: string;
  onCopy?: (url: string) => void;
} = {}) => {
  render(
    <FormContainer defaultValues={{ memberVisibility: visibility }}>
      <GroupVisibilitySection {...props} />
    </FormContainer>,
  );
  return userEvent.setup();
};

describe("GroupVisibilitySection", () => {
  it("offers one option per audience, each with its explanation", () => {
    setup();

    for (const name of [
      "Cualquiera con el enlace",
      "Toda la iglesia",
      "Solo los miembros",
      "Solo líderes",
    ]) {
      expect(screen.getByRole("radio", { name })).toBeTruthy();
    }
    expect(
      screen
        .getByRole("radio", { name: "Toda la iglesia" })
        .getAttribute("aria-describedby"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Cualquier persona con acceso en la iglesia ve la lista.",
      ),
    ).toBeTruthy();
  });

  it("marks the current option and moves the mark when another is chosen", async () => {
    const user = setup({ visibility: "CHURCH" });

    const church = screen.getByRole("radio", { name: "Toda la iglesia" });
    const leaders = screen.getByRole("radio", { name: "Solo líderes" });
    expect((church as HTMLInputElement).checked).toBe(true);

    await user.click(leaders);

    expect((leaders as HTMLInputElement).checked).toBe(true);
    expect((church as HTMLInputElement).checked).toBe(false);
  });

  it("shows the public address and copies it", async () => {
    const onCopy = vi.fn();
    const user = setup({ slug: "alabanza-x7k2", onCopy });

    expect(
      screen.getByRole("link", { name: /\/g\/alabanza-x7k2$/ }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));

    expect(onCopy).toHaveBeenCalledWith(
      expect.stringMatching(/\/g\/alabanza-x7k2$/),
    );
  });

  it("hides the public address when the page is not public", () => {
    setup({ visibility: "MEMBERS", slug: "alabanza-x7k2", onCopy: vi.fn() });

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button", { name: "Copiar enlace" })).toBeNull();
  });

  it("has no public address before the group exists", () => {
    setup({ onCopy: vi.fn() });

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("explains that minors are never shown", () => {
    setup();

    expect(
      screen.getByText(/Nunca se muestra a menores de 18 años/),
    ).toBeTruthy();
  });

  it("cannot be changed when disabled", async () => {
    const user = setup({ visibility: "CHURCH", disabled: true });

    const leaders = screen.getByRole("radio", { name: "Solo líderes" });
    // The whole card is the label: clicking its text would pick the option.
    await user.click(screen.getByText("Solo líderes"));

    expect((leaders as HTMLInputElement).checked).toBe(false);
    expect(leaders.hasAttribute("disabled")).toBe(true);
  });
});
