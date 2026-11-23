import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Loading from "./Loading";

afterEach(cleanup);

describe("Loading", () => {
  it("shows a progress indicator that a screen reader names", () => {
    render(<Loading />);

    expect(
      screen.getByRole("progressbar", { name: "Cargando" }),
    ).toBeInTheDocument();
  });
});
