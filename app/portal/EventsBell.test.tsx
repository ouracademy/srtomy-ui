import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MyEventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { EventsBell } from "./EventsBell";

const hooks = vi.hoisted(() => ({ useGetMeEvents: vi.fn() }));
vi.mock("@/app/(api)/generated", () => hooks);

const course: MyEventResponse = {
  title: "Curso de discipulado",
  start: new Date(2030, 1, 2, 19, 0),
  isACourse: true,
  registered: true,
  slug: "curso",
  registrationId: "r1",
  registrationStatus: "CONFIRMED",
};
const retreat: MyEventResponse = {
  ...course,
  title: "Retiro de jóvenes",
  isACourse: false,
  slug: "retiro",
  registrationId: "r2",
};

const withEvents = (events: MyEventResponse[]) =>
  hooks.useGetMeEvents.mockReturnValue({ data: events });

beforeEach(() => withEvents([course, retreat]));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("EventsBell", () => {
  it("counts the sign-ups the user has not seen", () => {
    render(<EventsBell />);

    expect(
      screen.getByRole("button", { name: "Eventos y cursos: 2 nuevos" }),
    ).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("shows only the bell when there are no events", () => {
    withEvents([]);
    render(<EventsBell />);

    expect(
      screen.getByRole("button", { name: "Eventos y cursos" }),
    ).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("lists the events when opened, flags the new ones and clears the count", async () => {
    const user = userEvent.setup();
    render(<EventsBell />);

    await user.click(screen.getByRole("button", { name: /Eventos y cursos/ }));

    expect(
      screen.getByRole("menuitem", { name: /Curso de discipulado/ }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("menuitem", { name: /Retiro de jóvenes/ })
        .getAttribute("href"),
    ).toBe("/e/retiro");
    expect(screen.getAllByText("Nuevo")).toHaveLength(2);
    expect(
      screen.getByRole("button", {
        name: "Eventos y cursos",
        hidden: true,
      }),
    ).toBeTruthy();
  });

  it("does not count again what was seen in an earlier visit", () => {
    window.localStorage.setItem("ovejafiel.seenEvents", '["r1"]');
    render(<EventsBell />);

    expect(
      screen.getByRole("button", { name: "Eventos y cursos: 1 nuevos" }),
    ).toBeTruthy();
  });

  it("says so when opened without events", async () => {
    withEvents([]);
    const user = userEvent.setup();
    render(<EventsBell />);

    await user.click(screen.getByRole("button", { name: "Eventos y cursos" }));

    expect(
      screen.getByText("Aún no estás inscrito a ningún evento o curso."),
    ).toBeTruthy();
  });
});
