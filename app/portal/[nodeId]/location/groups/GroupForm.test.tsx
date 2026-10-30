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

const setup = (canSave = true) => {
  const submit = vi.fn().mockResolvedValue(undefined);
  render(
    <GroupForm
      initialValues={initialValues}
      submit={submit}
      canSave={canSave}
    />,
  );
  return { submit, user: userEvent.setup() };
};

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
    const values = submit.mock.calls[0]![0] as GroupInitialValues;
    expect(values).toMatchObject({ name: "Jóvenes", description: "Sábados" });
    expect(values).not.toHaveProperty("members");
    expect(values).not.toHaveProperty("leaders");
  });

  it("hides the save button without permission", () => {
    setup(false);

    expect(screen.queryByRole("button", { name: "Guardar" })).toBeNull();
  });
});
