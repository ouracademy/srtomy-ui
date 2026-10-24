import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySocialLinks } from "@/app/(components)/SocialLinks";
import { GroupForm, type GroupInitialValues } from "./GroupForm";

vi.mock("@/app/(api)/generated", () => ({
  useGetPeople: () => ({
    data: {
      content: [
        { id: "p1", firstName: "Ana", lastName: "Ruiz", email: "ana@x.org" },
        { id: "p2", firstName: "Luis", lastName: "Paz" },
      ],
    },
  }),
}));

afterEach(cleanup);

const initialValues: GroupInitialValues = {
  name: "Jóvenes",
  description: "",
  type: "GROUP",
  members: [],
  leaders: [],
  inviteLeaders: true,
  socialLinks: emptySocialLinks,
};

const setup = (canInvite: boolean) => {
  const submit = vi.fn().mockResolvedValue(undefined);
  render(
    <GroupForm
      nodeId="n1"
      initialValues={initialValues}
      submit={submit}
      canInvite={canInvite}
    />,
  );
  return { submit, user: userEvent.setup() };
};

const pickLeader = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  await user.click(
    screen.getByRole("combobox", {
      name: "Escriba/seleccione el lider o lideres",
    }),
  );
  await user.click(screen.getByRole("option", { name }));
};

describe("GroupForm invitations", () => {
  it("offers to invite a leader that has an email", async () => {
    const { user } = setup(true);

    expect(screen.queryByRole("checkbox")).toBeNull();
    await pickLeader(user, "Ana Ruiz");

    const checkbox = screen.getByRole("checkbox", {
      name: "Invitar a usar la app al líder con correo",
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("does not offer it for a leader without email", async () => {
    const { user } = setup(true);

    await pickLeader(user, "Luis Paz");

    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("does not offer it to someone who cannot invite", async () => {
    const { user } = setup(false);

    await pickLeader(user, "Ana Ruiz");

    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("saves the leader's email and the choice not to invite", async () => {
    const { submit, user } = setup(true);

    await pickLeader(user, "Ana Ruiz");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(submit).toHaveBeenCalledOnce();
    const values = submit.mock.calls[0]![0] as GroupInitialValues;
    expect(values.inviteLeaders).toBe(false);
    expect(values.leaders).toEqual([
      { id: "p1", label: "Ana Ruiz", email: "ana@x.org" },
    ]);
  });
});
