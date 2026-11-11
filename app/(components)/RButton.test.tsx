import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RButton } from "./RButton";

afterEach(cleanup);

describe("RButton", () => {
  it("is a link with the add icon", () => {
    render(<RButton name="Agregar persona" href="/portal/1/person/create" />);

    const link = screen.getByRole("link", { name: "Agregar persona" });
    expect(link).toHaveAttribute("href", "/portal/1/person/create");
    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();
  });
});
