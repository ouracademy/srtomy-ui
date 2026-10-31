import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ParentEventNotice } from "./ParentEventNotice";

afterEach(cleanup);

const container = { slug: "congreso", title: "Congreso" };

describe("ParentEventNotice", () => {
  it("says which event it is part of and links to its page", () => {
    render(<ParentEventNotice container={container} signsUpThere={false} />);

    expect(screen.getByText(/Forma parte de «Congreso»/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver «Congreso»" }),
    ).toHaveAttribute("href", "/e/congreso");
    expect(screen.queryByText(/inscríbase allá/)).toBeNull();
  });

  it("sends the visitor there to sign up when the registration is the one of that event", () => {
    render(<ParentEventNotice container={container} signsUpThere />);

    expect(
      screen.getByText(/Para tener un lugar, inscríbase allá/),
    ).toBeInTheDocument();
  });
});
