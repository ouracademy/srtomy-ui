import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PersonForm, type PersonDetailFormData } from "./PersonForm";

// What the form shows before it has the positions of the node to choose from.
const positions = vi.hoisted(() => ({
  current: { isLoading: true } as {
    data?: unknown;
    error?: unknown;
    isLoading: boolean;
  },
}));

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsById: () => ({ data: { name: "Sede", type: "LOCATION" } }),
  useGetOrganizationsByIdPositions: () => positions.current,
}));

afterEach(cleanup);

const initial: PersonDetailFormData = {
  firstName: "",
  lastName: "",
  phoneNumber: "+51",
  email: "",
  memberState: "VISITOR",
  positions: [],
};

const renderForm = () =>
  render(<PersonForm initialValues={initial} submit={vi.fn()} nodeId="n1" />);

describe("PersonForm while it loads the positions", () => {
  it("shows the progress indicator, never «Not found»", () => {
    positions.current = { isLoading: true };
    renderForm();

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Not found")).not.toBeInTheDocument();
  });

  it("says the positions could not be loaded and offers to retry", () => {
    positions.current = { isLoading: false, error: new Error("500") };
    renderForm();

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar");
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });
});
