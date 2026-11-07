import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgramPrompt } from "./ProgramPrompt";

const api = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock("@/app/(api)/generated", () => ({
  useGetEvents: () => ({ data: api.data }),
}));

afterEach(cleanup);

const congress: EventResponse = {
  id: "congreso",
  title: "Avivamiento 2030",
  start: new Date(2026, 9, 23, 9, 0),
  end: new Date(2026, 9, 25, 22, 0),
};
const picked = {
  start: new Date(2026, 9, 24, 15, 0),
  end: new Date(2026, 9, 24, 16, 0),
};

describe("ProgramPrompt", () => {
  it("offers to add the session to the program it falls inside", async () => {
    api.data = [congress];
    const onChoose = vi.fn();
    render(<ProgramPrompt nodeId="n1" picked={picked} onChoose={onChoose} />);

    await userEvent.setup().click(
      screen.getByRole("button", {
        name: "Agregar al programa de «Avivamiento 2030»",
      }),
    );

    expect(onChoose).toHaveBeenCalledWith(congress);
  });

  it("shows nothing when the hours fall inside no program", () => {
    api.data = [
      { ...congress, start: new Date(2026, 10, 1), end: new Date(2026, 10, 3) },
    ];
    const { container } = render(
      <ProgramPrompt nodeId="n1" picked={picked} onChoose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
