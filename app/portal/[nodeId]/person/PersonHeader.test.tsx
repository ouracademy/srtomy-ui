import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form-mui";
import { afterEach, describe, expect, it } from "vitest";
import { initialsOf, PersonHeader } from "./PersonHeader";

afterEach(cleanup);

const Wrapper = ({ firstName, lastName }: Record<string, string>) => {
  const methods = useForm({ defaultValues: { firstName, lastName } });
  return (
    <FormProvider {...methods}>
      <PersonHeader subtitle="Datos generales de persona" actions="Acciones" />
    </FormProvider>
  );
};

describe("initialsOf", () => {
  it("takes the first letter of each name in capitals", () => {
    expect(initialsOf("angelo", "rodas")).toBe("AR");
    expect(initialsOf("  ana", "")).toBe("A");
    expect(initialsOf("", "")).toBe("");
  });
});

describe("PersonHeader", () => {
  it("shows the name as typed, with its initials and the actions", () => {
    render(<Wrapper firstName="angelo" lastName="rodas" />);

    expect(screen.getByRole("heading", { name: "angelo rodas" })).toBeTruthy();
    expect(screen.getByText("AR")).toBeTruthy();
    expect(screen.getByText("Acciones")).toBeTruthy();
  });

  it("asks for a name while nothing is typed", () => {
    render(<Wrapper firstName="" lastName="" />);

    expect(screen.getByRole("heading", { name: "Nueva persona" })).toBeTruthy();
  });

  it("has the photo button off and explains why", async () => {
    const user = userEvent.setup();
    render(<Wrapper firstName="a" lastName="b" />);

    const photo = screen.getByRole("button", {
      name: "Subir foto de la persona (próximamente)",
    });
    expect(photo.getAttribute("aria-disabled")).toBe("true");

    await user.hover(photo);
    expect(await screen.findByText("Estamos trabajando en ello")).toBeTruthy();
  });
});
