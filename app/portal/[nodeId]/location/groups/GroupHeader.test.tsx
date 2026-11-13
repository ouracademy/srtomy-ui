import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormContainer } from "react-hook-form-mui";
import { afterEach, describe, expect, it } from "vitest";
import { GroupHeader } from "./GroupHeader";

afterEach(cleanup);

const renderHeader = (values: {
  name: string;
  type: string;
  schedule: string;
}) =>
  render(
    <FormContainer defaultValues={values}>
      <GroupHeader />
    </FormContainer>,
  );

describe("GroupHeader", () => {
  it("shows the name of the group as the title", () => {
    renderHeader({ name: "Alabanza", type: "MINISTRY", schedule: "" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Alabanza" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Datos generales del grupo o ministerio"),
    ).toBeTruthy();
  });

  it("titles a group that has no name yet by its type", () => {
    renderHeader({ name: "  ", type: "GROUP", schedule: "" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Nuevo grupo" }),
    ).toBeTruthy();
  });

  it("titles a ministry that has no name yet by its type", () => {
    renderHeader({ name: "", type: "MINISTRY", schedule: "" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Nuevo ministerio" }),
    ).toBeTruthy();
  });

  it("shows the schedule only when there is one", () => {
    const { unmount } = renderHeader({
      name: "Jóvenes",
      type: "GROUP",
      schedule: "Sábados 5 pm",
    });
    expect(screen.getByText("Sábados 5 pm")).toBeTruthy();
    unmount();

    renderHeader({ name: "Jóvenes", type: "GROUP", schedule: " " });
    expect(screen.queryByText("Sábados 5 pm")).toBeNull();
  });

  it("has the image upload off and says why when the user gets close", async () => {
    const user = userEvent.setup();
    renderHeader({ name: "Jóvenes", type: "GROUP", schedule: "" });

    const upload = screen.getByRole("button", {
      name: "Subir imagen (próximamente)",
    });
    expect(upload.getAttribute("aria-disabled")).toBe("true");

    await user.hover(upload);
    expect(await screen.findByText("Estamos trabajando en ello")).toBeTruthy();
  });
});
