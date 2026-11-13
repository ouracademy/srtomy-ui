import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultVisibility } from "@/app/(components)/visibility";
import { emptySocialLinks } from "@/app/(components)/SocialLinks";
import { LocationForm } from "./LocationForm";
import type { OrganizationDetailForm } from "./LocationSchema";

vi.mock("@/app/(api)/generated", () => ({}));

afterEach(cleanup);

const initialValues: OrganizationDetailForm = {
  name: "Sede Norte",
  address: "Av. Siempre Viva 123",
  phoneNumber: "",
  socialLinks: emptySocialLinks,
  ...defaultVisibility,
};

const setup = () => {
  const submit = vi.fn().mockResolvedValue(undefined);
  render(
    <LocationForm
      title="Datos de la sede"
      initialValues={initialValues}
      submit={submit}
    />,
  );
  return { submit, user: userEvent.setup() };
};

describe("LocationForm", () => {
  it("offers the links of the networks in a folded block with its title", () => {
    setup();

    const toggle = screen.getByRole("button", {
      name: /Redes sociales y sitio web/,
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.getByText(
        "Sitio, Facebook, Instagram, YouTube y TikTok · opcional",
      ),
    ).toBeTruthy();
  });

  it("saves a link typed in the block of the networks", async () => {
    const { submit, user } = setup();

    await user.click(
      screen.getByRole("button", { name: /Redes sociales y sitio web/ }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Facebook" }),
      "https://facebook.com/sedenorte",
    );
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0]![0]).toMatchObject({
      name: "Sede Norte",
      socialLinks: { facebookUrl: "https://facebook.com/sedenorte" },
    });
  });

  it("opens the block of the networks when a link is wrong", async () => {
    const { submit, user } = setup();

    await user.click(
      screen.getByRole("button", { name: /Redes sociales y sitio web/ }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Sitio web" }),
      "sitio",
    );
    await user.click(
      screen.getByRole("button", { name: /Redes sociales y sitio web/ }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(
        "Debe ser un enlace que empiece con http:// o https://",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /Redes sociales y sitio web/ })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(submit).not.toHaveBeenCalled();
  });

  it("keeps the schedule and visibility block as it was", () => {
    setup();

    expect(
      screen.getByRole("button", { name: /Horario y visibilidad/ }),
    ).toBeTruthy();
  });

  it("hides the save button without permission", () => {
    render(
      <LocationForm
        title="Datos de la sede"
        initialValues={initialValues}
        submit={vi.fn()}
        canSave={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Guardar" })).toBeNull();
  });
});
