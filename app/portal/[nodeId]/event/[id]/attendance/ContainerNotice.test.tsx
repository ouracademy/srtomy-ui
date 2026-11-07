import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ContainerNotice } from "./ContainerNotice";

afterEach(cleanup);

const subEvent = (registrationMode: EventResponse["registrationMode"]) =>
  render(
    <ContainerNotice
      nodeId="n1"
      event={{
        id: "c1",
        parentEventId: "mega",
        parentTitle: "Congreso",
        registrationMode,
      }}
    />,
  );

describe("ContainerNotice", () => {
  it("says which event it is part of and links back to it", () => {
    subEvent("INHERIT");

    expect(screen.getByText(/Parte de «Congreso»/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver el evento" })).toHaveAttribute(
      "href",
      "/portal/n1/event/mega/attendance",
    );
  });

  it.each([
    ["INHERIT", /puede entrar a este sub-evento/],
    ["OWN", /su propia inscripción/],
    ["OPEN", /sin inscribirse/],
  ] as const)("explains how a %s sub-event is entered", (mode, text) => {
    subEvent(mode);

    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
