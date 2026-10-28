import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PersonForm, type PersonDetailFormData } from "./PersonForm";

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsByIdPositions: () => ({
    data: [{ id: "p1", name: "Pastor" }],
    isLoading: false,
  }),
}));

afterEach(cleanup);

const initial: PersonDetailFormData = {
  firstName: "Rosa",
  lastName: "Díaz",
  phoneNumber: "+51999999999",
  email: "",
  memberState: "VISITOR",
  positions: [],
};

const setup = (values: Partial<PersonDetailFormData> = {}) => {
  const submit = vi.fn().mockResolvedValue(undefined);
  render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PersonForm
        initialValues={{ ...initial, ...values }}
        submit={submit}
        nodeId="n1"
      />
    </LocalizationProvider>,
  );
  return { submit, user: userEvent.setup() };
};

describe("PersonForm member state", () => {
  it("starts as a visitor and explains the three states", () => {
    setup();

    expect(
      screen.getByRole("combobox", { name: "Estado en la iglesia" })
        .textContent,
    ).toBe("Visitante");
    expect(screen.getByText(/Quien tiene un cargo es miembro/)).toBeTruthy();
  });

  it("lets the user choose the state and saves it", async () => {
    const { submit, user } = setup();

    await user.click(
      screen.getByRole("combobox", { name: "Estado en la iglesia" }),
    );
    await user.click(screen.getByRole("option", { name: "Asistente" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0]?.[0]).toMatchObject({
      memberState: "MEMBERSHIP_IN_PROGRESS",
    });
  });

  it("shows a person with a position as a member and does not let it change", () => {
    setup({ positions: [{ id: "p1", label: "Pastor" }] });

    const field = screen.getByRole("combobox", {
      name: "Estado en la iglesia",
    });
    expect(field.textContent).toBe("Miembro");
    expect(field.getAttribute("aria-disabled")).toBe("true");
  });
});
