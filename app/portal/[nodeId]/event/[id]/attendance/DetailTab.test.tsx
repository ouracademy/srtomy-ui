import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DetailTab } from "./DetailTab";

vi.mock("./ProgramSection", () => ({
  ProgramSection: () => <div data-testid="program" />,
}));
vi.mock("./ContainerNotice", () => ({
  ContainerNotice: () => <div data-testid="container" />,
}));
vi.mock("./RegistrationPanel", () => ({
  RegistrationPanel: () => <div data-testid="registration" />,
}));
vi.mock("./InheritedRegistrationsPanel", () => ({
  InheritedRegistrationsPanel: () => <div data-testid="expected" />,
}));
vi.mock("./NoticesPanel", () => ({
  NoticesPanel: () => <div data-testid="notices" />,
}));

afterEach(cleanup);

const base: EventResponse = {
  id: "e1",
  title: "Congreso",
  start: new Date(2026, 10, 13, 9),
  end: new Date(2026, 10, 15, 20),
};

const setup = (
  event: EventResponse,
  allowed: string[] = ["events.write", "registrations.read"],
) =>
  render(
    <DetailTab
      nodeId="n1"
      eventId="e1"
      event={event}
      can={((permission: string) => allowed.includes(permission)) as never}
      onChanged={vi.fn()}
    />,
  );

describe("DetailTab", () => {
  it("shows the program, the sign-up and the notices of an event of its own", () => {
    setup({ ...base, description: "Tres días de enseñanza" });

    expect(screen.getByText("Tres días de enseñanza")).toBeInTheDocument();
    expect(screen.getByTestId("program")).toBeInTheDocument();
    expect(screen.getByTestId("registration")).toBeInTheDocument();
    expect(screen.getByTestId("notices")).toBeInTheDocument();
    expect(screen.queryByTestId("expected")).toBeNull();
  });

  it("lists the speakers when there are some", () => {
    setup({
      ...base,
      speakers: [{ id: "s1", fullName: "Sarah Mitchell" }],
    });

    expect(screen.getByRole("region", { name: "Ponentes" })).toHaveTextContent(
      "Sarah Mitchell",
    );
  });

  it("has no speakers card without speakers", () => {
    setup(base);

    expect(screen.queryByRole("region", { name: "Ponentes" })).toBeNull();
  });

  it("says which event a sub-event is part of and, when it inherits, who is expected", () => {
    setup({ ...base, parentEventId: "mega", registrationMode: "INHERIT" });

    expect(screen.getByTestId("container")).toBeInTheDocument();
    expect(screen.queryByTestId("program")).toBeNull();
    expect(screen.queryByTestId("registration")).toBeNull();
    expect(screen.getByTestId("expected")).toBeInTheDocument();
  });

  it("keeps the sign-up of a sub-event that has its own", () => {
    setup({ ...base, parentEventId: "mega", registrationMode: "OWN" });

    expect(screen.getByTestId("registration")).toBeInTheDocument();
    expect(screen.queryByTestId("expected")).toBeNull();
  });

  it("has no program in an event that repeats", () => {
    setup({
      ...base,
      recurrence: { frequency: "DAILY", interval: 1, endType: "NEVER" },
    });

    expect(screen.queryByTestId("program")).toBeNull();
  });

  it("hides the sign-up from whoever cannot read it", () => {
    setup(base, ["events.write"]);

    expect(screen.queryByTestId("registration")).toBeNull();
  });
});
