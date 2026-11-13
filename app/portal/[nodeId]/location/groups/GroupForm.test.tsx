import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultVisibility } from "@/app/(components)/visibility";
import { emptySocialLinks } from "@/app/(components)/SocialLinks";
import { GroupForm, type GroupInitialValues } from "./GroupForm";

vi.mock("@/app/(api)/generated", () => ({}));

afterEach(cleanup);

const initialValues: GroupInitialValues = {
  name: "Jóvenes",
  description: "",
  type: "GROUP",
  socialLinks: emptySocialLinks,
  ...defaultVisibility,
};

const setup = (canSave = true, values = initialValues) => {
  const submit = vi.fn().mockResolvedValue(undefined);
  render(
    <GroupForm
      initialValues={values}
      submit={submit}
      canSave={canSave}
      slug="jovenes-x7k2"
    />,
  );
  return { submit, user: userEvent.setup() };
};

const submittedValues = (submit: ReturnType<typeof vi.fn>) =>
  submit.mock.calls[0]![0] as GroupInitialValues;

describe("GroupForm", () => {
  it("does not manage people: they live in Personas", () => {
    setup();

    expect(screen.queryByText("Miembros")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /invitar/i })).toBeNull();
  });

  it("saves only the group data", async () => {
    const { submit, user } = setup();

    await user.type(screen.getByLabelText("Descripción"), "Sábados");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(submit).toHaveBeenCalledOnce();
    const values = submittedValues(submit);
    expect(values).toMatchObject({ name: "Jóvenes", description: "Sábados" });
    expect(values).not.toHaveProperty("members");
    expect(values).not.toHaveProperty("leaders");
  });

  it("is split in sections with a title each", () => {
    setup();

    for (const name of [
      "Identidad",
      "Reunión",
      "Visibilidad",
      "Redes sociales y sitio web",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
  });

  it("follows the name as it is typed in the header", async () => {
    const { user } = setup();

    await user.clear(screen.getByLabelText(/Nombre/));
    await user.type(screen.getByLabelText(/Nombre/), "Alabanza");

    expect(
      screen.getByRole("heading", { level: 1, name: "Alabanza" }),
    ).toBeTruthy();
  });

  it("saves the type chosen with the buttons", async () => {
    const { submit, user } = setup();

    expect(
      screen
        .getByRole("button", { name: "Grupo" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await user.click(screen.getByRole("button", { name: "Ministerio" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(submittedValues(submit).type).toBe("MINISTRY");
  });

  it("keeps the type when the chosen button is pressed again", async () => {
    const { submit, user } = setup();

    await user.click(screen.getByRole("button", { name: "Grupo" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(submittedValues(submit).type).toBe("GROUP");
  });

  it("saves the schedule typed in Reunión", async () => {
    const { submit, user } = setup();

    await user.type(screen.getByLabelText("Horario"), "Sábados 5 pm");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(submittedValues(submit).schedule).toBe("Sábados 5 pm");
  });

  it("saves who sees the people", async () => {
    const { submit, user } = setup();

    await user.click(screen.getByRole("radio", { name: "Solo líderes" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(submittedValues(submit).memberVisibility).toBe("LEADERS");
  });

  it("saves the links typed in the folded block", async () => {
    const { submit, user } = setup();

    await user.click(
      screen.getByRole("button", { name: /Redes sociales y sitio web/ }),
    );
    await user.type(
      screen.getByLabelText("Instagram"),
      "https://instagram.com/jovenes",
    );
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(submittedValues(submit).socialLinks.instagramUrl).toBe(
      "https://instagram.com/jovenes",
    );
  });

  it("asks for a name before saving", async () => {
    const { submit, user } = setup(true, { ...initialValues, name: "" });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(
        "Por favor ingrese el nombre del Grupo o ministerio",
      ),
    ).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
  });

  it("opens the links when one of them is wrong, so the error is seen", async () => {
    const { submit, user } = setup();
    const toggle = screen.getByRole("button", {
      name: /Redes sociales y sitio web/,
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    await user.click(toggle);
    await user.type(screen.getByLabelText("Sitio web"), "mi sitio");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(
        "Debe ser un enlace que empiece con http:// o https://",
      ),
    ).toBeTruthy();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(submit).not.toHaveBeenCalled();
  });

  it("hides the save button without permission", () => {
    setup(false);

    expect(screen.queryByRole("button", { name: "Guardar" })).toBeNull();
  });

  it("shows the data but does not let change it without permission", () => {
    setup(false);

    expect(screen.getByText(/no cambiarlos/)).toBeTruthy();
    expect(screen.getByLabelText(/Nombre/).hasAttribute("disabled")).toBe(true);
    expect(screen.getByLabelText("Descripción").hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByLabelText("Horario").hasAttribute("disabled")).toBe(
      true,
    );
    expect(
      screen
        .getByRole("radio", { name: "Solo líderes" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("does not show the read-only notice to who can save", () => {
    setup();

    expect(screen.queryByText(/no cambiarlos/)).toBeNull();
  });
});
