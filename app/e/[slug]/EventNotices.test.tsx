import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EventNotices } from "./EventNotices";

afterEach(cleanup);

describe("EventNotices", () => {
  it("shows nothing without notices", () => {
    const { container } = render(<EventNotices notices={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lists each notice with its date, an announcement apart from a change", () => {
    render(
      <EventNotices
        notices={[
          {
            kind: "CHANGED",
            message: "Nuevo lugar: Salón 3.",
            createdAt: new Date(2030, 0, 5, 10, 30),
          },
          {
            kind: "ANNOUNCEMENT",
            message: "Traer Biblia",
            createdAt: new Date(2030, 0, 4, 9, 0),
          },
        ]}
      />,
    );

    const region = screen.getByRole("region", { name: "Avisos del evento" });
    expect(region).toBeInTheDocument();
    expect(screen.getByText("Nuevo lugar: Salón 3.")).toBeInTheDocument();
    expect(screen.getByText("Traer Biblia")).toBeInTheDocument();
    expect(screen.getByText("5 de enero, 10:30")).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });
});
