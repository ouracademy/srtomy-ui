import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PersonForm, type PersonDetailFormData } from "./PersonForm";

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsById: () => ({ data: { name: "Sede", type: "LOCATION" } }),
  useGetOrganizationsByIdPositions: () => ({ data: [], isLoading: false }),
}));

afterEach(cleanup);

const initial: PersonDetailFormData = {
  firstName: "Rosa",
  lastName: "Díaz",
  phoneNumber: "+51999999999",
  email: "",
  memberState: "VISITOR",
  hasBeenBaptized: "NO",
  positions: [],
};

const setup = () => {
  const submit = vi.fn().mockResolvedValue(undefined);
  render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PersonForm
        initialValues={initial}
        submit={submit}
        nodeId="n1"
        actions={<button type="button">Eliminar</button>}
      />
    </LocalizationProvider>,
  );
  return { submit, user: userEvent.setup() };
};

describe("PersonForm personal data", () => {
  it("folds birth date, age and baptism away until asked", async () => {
    const { user } = setup();
    const toggle = screen.getByRole("button", { name: /Datos personales/ });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(await screen.findByLabelText("Edad")).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Bautizado" })).toBeTruthy();
  });

  it("saves the baptism chosen with the switch", async () => {
    const { submit, user } = setup();

    await user.click(screen.getByRole("button", { name: /Datos personales/ }));
    await user.click(screen.getByRole("switch", { name: "Bautizado" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0]?.[0]).toMatchObject({
      hasBeenBaptized: "YES",
    });
  });

  it("keeps the person's name and the actions in the header", () => {
    setup();

    expect(screen.getByRole("heading", { name: "Rosa Díaz" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "En Sede" })).toBeTruthy();
  });
});
