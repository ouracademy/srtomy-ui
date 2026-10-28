import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationPanel } from "./RegistrationPanel";

const api = vi.hoisted(() => ({
  setup: undefined as unknown,
  setupError: undefined as unknown,
  mutateSetup: vi.fn(),
}));

vi.mock("@/app/(api)/generated", () => ({
  useGetEventsByIdRegistration: () => ({
    data: api.setup,
    error: api.setupError,
    mutate: api.mutateSetup,
  }),
  useGetEventsByIdRegistrations: () => ({
    data: [],
    mutate: vi.fn(),
  }),
  putEventsByIdRegistration: vi.fn(),
  deleteEventsByIdRegistration: vi.fn(),
  putEventsByIdRegistrationsByRegistrationIdCheckIn: vi.fn(),
  deleteEventsByIdRegistrationsByRegistrationId: vi.fn(),
}));

beforeEach(() => {
  api.setup = undefined;
  api.setupError = undefined;
  api.mutateSetup.mockClear();
});
afterEach(cleanup);

const panel = () => (
  <RegistrationPanel eventId="e1" title="Retiro" canCheckIn />
);

describe("RegistrationPanel", () => {
  it("is loading while the API has not answered", () => {
    render(panel());

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the failure, and not a spinner for ever, when the API refuses", async () => {
    api.setupError = new Error("500");

    render(panel());
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByText("No se pudo cargar")).toBeTruthy();
    expect(api.mutateSetup).toHaveBeenCalledOnce();
  });

  it("says the event was not found on a 404", () => {
    api.setupError = new AxiosError(
      "Not Found",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 404,
      } as never,
    );

    render(panel());

    expect(screen.getByText("No encontrado")).toBeTruthy();
  });
});
